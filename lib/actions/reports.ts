"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { getMenuStats } from "@/lib/actions/menu"

export async function generateDailyReport(date: Date, kitchenIds?: string[]) {
  try {
    const session = await requireAuth()
    const dateStr = date.toISOString().split("T")[0]

    let whereClause = `WHERE dm.menu_date = '${dateStr}'`

    if (kitchenIds?.length) {
      const kitchenIdsList = kitchenIds.map((id) => `'${id}'`).join(",")
      whereClause += ` AND dm.kitchen_id IN (${kitchenIdsList})`
    } else if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause += ` AND dm.kitchen_id = '${session.user.kitchenId}'`
    }

    const menus = await sql`
      SELECT dm.*, 
             r.name as recipe_name,
             k.name as kitchen_name,
             k.id as kitchen_id
      FROM daily_menus dm
      JOIN recipes r ON dm.recipe_id = r.id
      JOIN kitchens k ON dm.kitchen_id = k.id
      ${sql.unsafe(whereClause)}
      ORDER BY k.name, dm.meal_type
    `

    // Get ingredients for each recipe
    const recipeIds = [...new Set(menus.map((m) => m.recipe_id))]
    const ingredients = await sql`
      SELECT ri.*, r.id as recipe_id
      FROM recipe_ingredients ri
      JOIN recipes r ON ri.recipe_id = r.id
      WHERE r.id = ANY(${recipeIds})
    `

    // Group ingredients by recipe
    const ingredientsByRecipe = ingredients.reduce((acc, ing) => {
      if (!acc[ing.recipe_id]) acc[ing.recipe_id] = []
      acc[ing.recipe_id].push(ing)
      return acc
    }, {} as any)

    // Group by kitchen and meal type
    const reportData = menus.reduce((acc, menu) => {
      const kitchenName = menu.kitchen_name
      if (!acc[kitchenName]) {
        acc[kitchenName] = {
          BREAKFAST: [],
          LUNCH: [],
          DINNER: [],
          SNACK: [],
        }
      }

      const recipeIngredients = ingredientsByRecipe[menu.recipe_id] || []

      acc[kitchenName][menu.meal_type].push({
        recipeName: menu.recipe_name,
        plannedServings: menu.planned_servings,
        actualServings: menu.actual_servings || menu.planned_servings,
        ghanMultiplier: menu.ghan_multiplier,
        ingredients: recipeIngredients.map((ing) => ({
          name: ing.ingredient_name,
          totalQuantity: Number(ing.quantity) * Number(menu.ghan_multiplier),
          unit: ing.unit,
          estimatedCost: ing.cost_per_unit
            ? Number(ing.quantity) * Number(menu.ghan_multiplier) * Number(ing.cost_per_unit)
            : null,
        })),
        status: menu.status,
      })

      return acc
    }, {} as any)

    return {
      date: format(date, "yyyy-MM-dd"),
      kitchens: reportData,
      summary: {
        totalKitchens: Object.keys(reportData).length,
        totalMenuItems: menus.length,
        totalPlannedServings: menus.reduce((sum, m) => sum + Number(m.planned_servings), 0),
        totalActualServings: menus.reduce((sum, m) => sum + Number(m.actual_servings || m.planned_servings), 0),
      },
    }
  } catch (error) {
    console.error("Generate daily report error:", error)
    throw new Error("Failed to generate daily report")
  }
}

export async function getKitchenStats(kitchenId?: string, startDate?: Date, endDate?: Date) {
  try {
    const session = await requireAuth()

    const actualKitchenId = kitchenId || session.user.kitchenId
    if (!actualKitchenId && session.user.role !== "ADMIN") {
      throw new Error("Kitchen ID required")
    }

    let whereClause = "WHERE 1=1"

    if (actualKitchenId) {
      whereClause += ` AND kitchen_id = '${actualKitchenId}'`
    }

    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]
      whereClause += ` AND menu_date BETWEEN '${startDateStr}' AND '${endDateStr}'`
    }

    const stats = await sql`
      SELECT 
        COUNT(*) as total_menus,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_menus,
        SUM(planned_servings) as total_planned_servings,
        SUM(actual_servings) as total_actual_servings,
        AVG(planned_servings) as avg_planned_servings,
        AVG(actual_servings) as avg_actual_servings
      FROM daily_menus
      ${sql.unsafe(whereClause)}
    `

    const result = stats[0]

    return {
      totalMenus: Number(result.total_menus),
      completedMenus: Number(result.completed_menus),
      completionRate:
        Number(result.total_menus) > 0 ? (Number(result.completed_menus) / Number(result.total_menus)) * 100 : 0,
      totalPlannedServings: Number(result.total_planned_servings) || 0,
      totalActualServings: Number(result.total_actual_servings) || Number(result.total_planned_servings) || 0,
      avgPlannedServings: Math.round(Number(result.avg_planned_servings) || 0),
      avgActualServings: Math.round(Number(result.avg_actual_servings) || Number(result.avg_planned_servings) || 0),
    }
  } catch (error) {
    console.error("Get kitchen stats error:", error)
    throw new Error("Failed to fetch kitchen statistics")
  }
}

export async function exportMenuReport(date: Date, kitchenIds?: string[], format: "csv" | "pdf" = "csv") {
  try {
    const reportData = await generateDailyReport(date, kitchenIds)

    if (format === "csv") {
      // Generate CSV content
      const csvRows = ["Kitchen,Meal Type,Recipe,Planned Servings,Actual Servings,Status"]

      Object.entries(reportData.kitchens).forEach(([kitchenName, meals]: [string, any]) => {
        Object.entries(meals).forEach(([mealType, items]: [string, any[]]) => {
          items.forEach((item) => {
            csvRows.push(
              [kitchenName, mealType, item.recipeName, item.plannedServings, item.actualServings, item.status].join(
                ",",
              ),
            )
          })
        })
      })

      return {
        content: csvRows.join("\n"),
        filename: `menu-report-${format(date, "yyyy-MM-dd")}.csv`,
        contentType: "text/csv",
      }
    }

    // For PDF, you would integrate with a PDF library like puppeteer or jsPDF
    throw new Error("PDF export not implemented yet")
  } catch (error) {
    console.error("Export menu report error:", error)
    throw new Error("Failed to export menu report")
  }
}

export async function getDashboardStats(kitchenId?: string) {
  try {
    const session = await requireAuth()
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const monthStart = startOfMonth(today).toISOString().split("T")[0]
    const monthEnd = endOfMonth(today).toISOString().split("T")[0]

    const actualKitchenId = kitchenId || session.user.kitchenId
    let whereClause = "WHERE 1=1"

    if (actualKitchenId && session.user.role !== "ADMIN") {
      whereClause += ` AND kitchen_id = '${actualKitchenId}'`
    }

    const [todayStats, monthStats, recentMenus] = await Promise.all([
      getMenuStats(today, actualKitchenId),
      sql`
        SELECT 
          SUM(planned_servings) as planned_servings,
          SUM(actual_servings) as actual_servings,
          COUNT(*) as menu_count
        FROM daily_menus
        ${sql.unsafe(whereClause)} AND menu_date BETWEEN '${monthStart}' AND '${monthEnd}'
      `,
      sql`
        SELECT dm.*, r.name as recipe_name, k.name as kitchen_name
        FROM daily_menus dm
        JOIN recipes r ON dm.recipe_id = r.id
        JOIN kitchens k ON dm.kitchen_id = k.id
        ${sql.unsafe(whereClause)}
        ORDER BY dm.created_at DESC
        LIMIT 5
      `,
    ])

    const monthResult = monthStats[0]

    return {
      today: todayStats,
      month: {
        totalMenus: Number(monthResult.menu_count),
        totalServings: Number(monthResult.planned_servings) || 0,
        actualServings: Number(monthResult.actual_servings) || Number(monthResult.planned_servings) || 0,
      },
      recentMenus: recentMenus.map((menu) => ({
        id: menu.id,
        recipe: { name: menu.recipe_name },
        kitchen: { name: menu.kitchen_name },
        createdAt: menu.created_at,
      })),
    }
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    throw new Error("Failed to fetch dashboard statistics")
  }
}
