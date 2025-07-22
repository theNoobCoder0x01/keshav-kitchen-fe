"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

export async function getDailyMenus(date: Date, kitchenId?: string) {
  try {
    const session = await requireAuth()
    const dateStr = date.toISOString().split("T")[0]

    let whereClause = sql`WHERE dm.menu_date = ${dateStr}`

    if (kitchenId) {
      whereClause = sql`WHERE dm.menu_date = ${dateStr} AND dm.kitchen_id = ${kitchenId}`
    } else if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause = sql`WHERE dm.menu_date = ${dateStr} AND dm.kitchen_id = ${session.user.kitchenId}`
    }

    const menus = await sql`
      SELECT dm.*, 
             r.name as recipe_name,
             r.description as recipe_description,
             k.name as kitchen_name,
             u.name as creator_name
      FROM daily_menus dm
      LEFT JOIN recipes r ON dm.recipe_id = r.id
      LEFT JOIN kitchens k ON dm.kitchen_id = k.id
      LEFT JOIN users u ON dm.created_by = u.id
      ${whereClause}
      ORDER BY dm.meal_type, dm.created_at
    `

    // Group by meal type
    const groupedMenus = {
      BREAKFAST: menus.filter((m: any) => m.meal_type === "BREAKFAST"),
      LUNCH: menus.filter((m: any) => m.meal_type === "LUNCH"),
      DINNER: menus.filter((m: any) => m.meal_type === "DINNER"),
      SNACK: menus.filter((m: any) => m.meal_type === "SNACK"),
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

    let whereClause = sql`WHERE dm.menu_date = ${dateStr}`

    if (kitchenId) {
      whereClause = sql`WHERE dm.menu_date = ${dateStr} AND dm.kitchen_id = ${kitchenId}`
    } else if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause = sql`WHERE dm.menu_date = ${dateStr} AND dm.kitchen_id = ${session.user.kitchenId}`
    }

    const stats = await sql`
      SELECT 
        meal_type,
        SUM(planned_servings) as planned_servings,
        SUM(actual_servings) as actual_servings,
        COUNT(*) as item_count
      FROM daily_menus dm
      ${whereClause}
      GROUP BY meal_type
    `

    const totalPlanned = stats.reduce((sum: number, stat: any) => sum + (Number(stat.planned_servings) || 0), 0)
    const totalActual = stats.reduce((sum: number, stat: any) => sum + (Number(stat.actual_servings) || 0), 0)

    return {
      total: {
        planned: totalPlanned,
        actual: totalActual || totalPlanned,
        items: stats.reduce((sum: number, stat: any) => sum + Number(stat.item_count), 0),
      },
      byMealType: {
        BREAKFAST: Number(stats.find((s: any) => s.meal_type === "BREAKFAST")?.planned_servings || 0),
        LUNCH: Number(stats.find((s: any) => s.meal_type === "LUNCH")?.planned_servings || 0),
        DINNER: Number(stats.find((s: any) => s.meal_type === "DINNER")?.planned_servings || 0),
        SNACK: Number(stats.find((s: any) => s.meal_type === "SNACK")?.planned_servings || 0),
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

export async function createDailyMenu(formData: FormData) {
  try {
    const session = await requireAuth()

    const kitchenId = formData.get("kitchenId") as string
    const menuDate = new Date(formData.get("menuDate") as string).toISOString().split("T")[0]
    const mealType = formData.get("mealType") as string
    const recipeId = formData.get("recipeId") as string
    const plannedServings = Number.parseInt(formData.get("plannedServings") as string)
    const ghanMultiplier = Number.parseFloat(formData.get("ghanMultiplier") as string) || 1

    if (!kitchenId || !recipeId || !plannedServings) {
      return { success: false, error: "Missing required fields" }
    }

    // Check for existing menu item
    const existing = await sql`
      SELECT id FROM daily_menus 
      WHERE kitchen_id = ${kitchenId} 
        AND menu_date = ${menuDate} 
        AND meal_type = ${mealType} 
        AND recipe_id = ${recipeId}
    `

    if (existing.length > 0) {
      return { success: false, error: "Menu item already exists for this date and meal type" }
    }

    const menuId = `menu_${Date.now()}`

    await sql`
      INSERT INTO daily_menus (id, kitchen_id, menu_date, meal_type, recipe_id, planned_servings, ghan_multiplier, created_by)
      VALUES (${menuId}, ${kitchenId}, ${menuDate}, ${mealType}, ${recipeId}, ${plannedServings}, ${ghanMultiplier}, ${session.user.id})
    `

    revalidatePath("/")
    revalidatePath("/reports")
    return { success: true, menuId }
  } catch (error) {
    console.error("Create daily menu error:", error)
    return { success: false, error: "Failed to create menu item" }
  }
}
