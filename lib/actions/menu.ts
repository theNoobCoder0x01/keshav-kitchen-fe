"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"
import { CreateDailyMenuSchema, UpdateDailyMenuSchema } from "@/lib/validations/menu"
import { revalidatePath } from "next/cache"

export async function createDailyMenu(formData: FormData) {
  try {
    const session = await requireAuth()

    const rawData = {
      kitchenId: formData.get("kitchenId") as string,
      menuDate: new Date(formData.get("menuDate") as string),
      mealType: formData.get("mealType") as string,
      recipeId: formData.get("recipeId") as string,
      plannedServings: Number.parseInt(formData.get("plannedServings") as string),
      ghanMultiplier: Number.parseFloat(formData.get("ghanMultiplier") as string) || 1,
    }

    const validatedData = CreateDailyMenuSchema.parse(rawData)

    // Check for existing menu item
    const existing = await sql`
      SELECT id FROM daily_menus 
      WHERE kitchen_id = ${validatedData.kitchenId}
        AND menu_date = ${validatedData.menuDate.toISOString().split("T")[0]}
        AND meal_type = ${validatedData.mealType}
        AND recipe_id = ${validatedData.recipeId}
    `

    if (existing.length > 0) {
      return { success: false, error: "Menu item already exists for this date and meal type" }
    }

    const menuId = `menu_${Date.now()}`

    const menuItem = await sql`
      INSERT INTO daily_menus (
        id, kitchen_id, menu_date, meal_type, recipe_id, 
        planned_servings, ghan_multiplier, created_by, status
      )
      VALUES (
        ${menuId}, ${validatedData.kitchenId}, ${validatedData.menuDate.toISOString().split("T")[0]}, 
        ${validatedData.mealType}, ${validatedData.recipeId}, 
        ${validatedData.plannedServings}, ${validatedData.ghanMultiplier}, 
        ${session.user.id}, 'PLANNED'
      )
      RETURNING *
    `

    // Get the complete menu item with recipe details
    const completeMenuItem = await sql`
      SELECT dm.*, r.name as recipe_name, k.name as kitchen_name
      FROM daily_menus dm
      JOIN recipes r ON dm.recipe_id = r.id
      JOIN kitchens k ON dm.kitchen_id = k.id
      WHERE dm.id = ${menuId}
    `

    revalidatePath("/")
    revalidatePath("/reports")
    return { success: true, menuItem: completeMenuItem[0] }
  } catch (error) {
    console.error("Create daily menu error:", error)
    return { success: false, error: "Failed to create menu item" }
  }
}

export async function updateDailyMenu(formData: FormData) {
  try {
    const session = await requireAuth()

    const rawData = {
      id: formData.get("id") as string,
      actualServings: formData.get("actualServings")
        ? Number.parseInt(formData.get("actualServings") as string)
        : undefined,
      status: formData.get("status") as string,
      plannedServings: formData.get("plannedServings")
        ? Number.parseInt(formData.get("plannedServings") as string)
        : undefined,
      ghanMultiplier: formData.get("ghanMultiplier")
        ? Number.parseFloat(formData.get("ghanMultiplier") as string)
        : undefined,
    }

    const validatedData = UpdateDailyMenuSchema.parse(rawData)

    const updateFields = []
    const updateValues = []

    if (validatedData.actualServings !== undefined) {
      updateFields.push("actual_servings = $" + (updateValues.length + 1))
      updateValues.push(validatedData.actualServings)
    }
    if (validatedData.status) {
      updateFields.push("status = $" + (updateValues.length + 1))
      updateValues.push(validatedData.status)
    }
    if (validatedData.plannedServings !== undefined) {
      updateFields.push("planned_servings = $" + (updateValues.length + 1))
      updateValues.push(validatedData.plannedServings)
    }
    if (validatedData.ghanMultiplier !== undefined) {
      updateFields.push("ghan_multiplier = $" + (updateValues.length + 1))
      updateValues.push(validatedData.ghanMultiplier)
    }

    updateFields.push("updated_at = NOW()")
    updateValues.push(validatedData.id)

    const menuItem = await sql`
      UPDATE daily_menus 
      SET ${sql.unsafe(updateFields.join(", "))}
      WHERE id = $${updateValues.length}
      RETURNING *
    `

    revalidatePath("/")
    revalidatePath("/reports")
    return { success: true, menuItem: menuItem[0] }
  } catch (error) {
    console.error("Update daily menu error:", error)
    return { success: false, error: "Failed to update menu item" }
  }
}

export async function deleteDailyMenu(menuId: string) {
  try {
    const session = await requireAuth()

    await sql`DELETE FROM daily_menus WHERE id = ${menuId}`

    revalidatePath("/")
    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Delete daily menu error:", error)
    return { success: false, error: "Failed to delete menu item" }
  }
}

export async function getDailyMenus(date: Date, kitchenId?: string) {
  try {
    const session = await requireAuth()
    const dateStr = date.toISOString().split("T")[0]

    let whereClause = `WHERE dm.menu_date = '${dateStr}'`

    if (kitchenId) {
      whereClause += ` AND dm.kitchen_id = '${kitchenId}'`
    } else if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause += ` AND dm.kitchen_id = '${session.user.kitchenId}'`
    }

    const menus = await sql`
      SELECT dm.*, 
             r.name as recipe_name,
             k.name as kitchen_name,
             u.name as creator_name
      FROM daily_menus dm
      JOIN recipes r ON dm.recipe_id = r.id
      JOIN kitchens k ON dm.kitchen_id = k.id
      LEFT JOIN users u ON dm.created_by = u.id
      ${sql.unsafe(whereClause)}
      ORDER BY 
        CASE dm.meal_type 
          WHEN 'BREAKFAST' THEN 1 
          WHEN 'LUNCH' THEN 2 
          WHEN 'DINNER' THEN 3 
          WHEN 'SNACK' THEN 4 
        END,
        dm.created_at ASC
    `

    // Transform the data to match the expected format
    const transformedMenus = menus.map((menu) => ({
      id: menu.id,
      kitchenId: menu.kitchen_id,
      menuDate: menu.menu_date,
      mealType: menu.meal_type,
      recipeId: menu.recipe_id,
      plannedServings: menu.planned_servings,
      actualServings: menu.actual_servings,
      ghanMultiplier: menu.ghan_multiplier,
      status: menu.status,
      createdBy: menu.created_by,
      createdAt: menu.created_at,
      updatedAt: menu.updated_at,
      recipe: {
        name: menu.recipe_name,
      },
      kitchen: {
        name: menu.kitchen_name,
      },
      creator: {
        name: menu.creator_name,
      },
    }))

    // Group by meal type
    const groupedMenus = {
      BREAKFAST: transformedMenus.filter((m) => m.mealType === "BREAKFAST"),
      LUNCH: transformedMenus.filter((m) => m.mealType === "LUNCH"),
      DINNER: transformedMenus.filter((m) => m.mealType === "DINNER"),
      SNACK: transformedMenus.filter((m) => m.mealType === "SNACK"),
    }

    return groupedMenus
  } catch (error) {
    console.error("Get daily menus error:", error)
    return {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
      SNACK: [],
    }
  }
}

export async function getMenuStats(date: Date, kitchenId?: string) {
  try {
    const session = await requireAuth()
    const dateStr = date.toISOString().split("T")[0]

    let whereClause = `WHERE menu_date = '${dateStr}'`

    if (kitchenId) {
      whereClause += ` AND kitchen_id = '${kitchenId}'`
    } else if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause += ` AND kitchen_id = '${session.user.kitchenId}'`
    }

    const stats = await sql`
      SELECT 
        meal_type,
        SUM(planned_servings) as planned_servings,
        SUM(actual_servings) as actual_servings,
        COUNT(*) as item_count
      FROM daily_menus
      ${sql.unsafe(whereClause)}
      GROUP BY meal_type
    `

    const totalPlanned = stats.reduce((sum, stat) => sum + (Number(stat.planned_servings) || 0), 0)
    const totalActual = stats.reduce((sum, stat) => sum + (Number(stat.actual_servings) || 0), 0)

    return {
      total: {
        planned: totalPlanned,
        actual: totalActual || totalPlanned,
        items: stats.reduce((sum, stat) => sum + Number(stat.item_count), 0),
      },
      byMealType: {
        BREAKFAST: Number(stats.find((s) => s.meal_type === "BREAKFAST")?.planned_servings || 0),
        LUNCH: Number(stats.find((s) => s.meal_type === "LUNCH")?.planned_servings || 0),
        DINNER: Number(stats.find((s) => s.meal_type === "DINNER")?.planned_servings || 0),
        SNACK: Number(stats.find((s) => s.meal_type === "SNACK")?.planned_servings || 0),
      },
    }
  } catch (error) {
    console.error("Get menu stats error:", error)
    return {
      total: {
        planned: 0,
        actual: 0,
        items: 0,
      },
      byMealType: {
        BREAKFAST: 0,
        LUNCH: 0,
        DINNER: 0,
        SNACK: 0,
      },
    }
  }
}
