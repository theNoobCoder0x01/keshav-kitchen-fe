"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns"
import { getMenuStats } from "@/lib/menu-stats-utils" // Import getMenuStats

export async function generateDailyReport(date: Date, kitchenIds?: string[]) {
  try {
    const session = await requireAuth()

    const where = {
      menuDate: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      ...(kitchenIds?.length && { kitchenId: { in: kitchenIds } }),
      ...(session.user.kitchenId && session.user.role !== "ADMIN" && { kitchenId: session.user.kitchenId }),
    }

    const menus = await prisma.dailyMenu.findMany({
      where,
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
        kitchen: {
          select: { id: true, name: true },
        },
      },
    })

    // Group by kitchen and meal type
    const reportData = menus.reduce((acc, menu) => {
      const kitchenName = menu.kitchen.name
      if (!acc[kitchenName]) {
        acc[kitchenName] = {
          BREAKFAST: [],
          LUNCH: [],
          DINNER: [],
          SNACK: [],
        }
      }

      acc[kitchenName][menu.mealType].push({
        recipeName: menu.recipe.name,
        plannedServings: menu.plannedServings,
        actualServings: menu.actualServings || menu.plannedServings,
        ghanMultiplier: menu.ghanMultiplier,
        ingredients: menu.recipe.ingredients.map((ing) => ({
          name: ing.ingredientName,
          totalQuantity: Number(ing.quantity) * Number(menu.ghanMultiplier),
          unit: ing.unit,
          estimatedCost: ing.costPerUnit
            ? Number(ing.quantity) * Number(menu.ghanMultiplier) * Number(ing.costPerUnit)
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
        totalPlannedServings: menus.reduce((sum, m) => sum + m.plannedServings, 0),
        totalActualServings: menus.reduce((sum, m) => sum + (m.actualServings || m.plannedServings), 0),
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

    const dateFilter =
      startDate && endDate
        ? {
            menuDate: {
              gte: startOfDay(startDate),
              lte: endOfDay(endDate),
            },
          }
        : {}

    const where = {
      ...dateFilter,
      ...(actualKitchenId && { kitchenId: actualKitchenId }),
    }

    const [totalMenus, completedMenus, totalServings, avgServings] = await Promise.all([
      prisma.dailyMenu.count({ where }),
      prisma.dailyMenu.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.dailyMenu.aggregate({
        where,
        _sum: { plannedServings: true, actualServings: true },
      }),
      prisma.dailyMenu.aggregate({
        where,
        _avg: { plannedServings: true, actualServings: true },
      }),
    ])

    return {
      totalMenus,
      completedMenus,
      completionRate: totalMenus > 0 ? (completedMenus / totalMenus) * 100 : 0,
      totalPlannedServings: totalServings._sum.plannedServings || 0,
      totalActualServings: totalServings._sum.actualServings || totalServings._sum.plannedServings || 0,
      avgPlannedServings: Math.round(avgServings._avg.plannedServings || 0),
      avgActualServings: Math.round(avgServings._avg.actualServings || avgServings._avg.plannedServings || 0),
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

    const actualKitchenId = kitchenId || session.user.kitchenId
    const where = actualKitchenId && session.user.role !== "ADMIN" ? { kitchenId: actualKitchenId } : {}

    const [todayStats, monthStats, recentMenus] = await Promise.all([
      getMenuStats(today, actualKitchenId),
      prisma.dailyMenu.aggregate({
        where: {
          ...where,
          menuDate: {
            gte: startOfMonth(today),
            lte: endOfMonth(today),
          },
        },
        _sum: { plannedServings: true, actualServings: true },
        _count: { id: true },
      }),
      prisma.dailyMenu.findMany({
        where,
        include: {
          recipe: { select: { name: true } },
          kitchen: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    return {
      today: todayStats,
      month: {
        totalMenus: monthStats._count.id,
        totalServings: monthStats._sum.plannedServings || 0,
        actualServings: monthStats._sum.actualServings || monthStats._sum.plannedServings || 0,
      },
      recentMenus,
    }
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    throw new Error("Failed to fetch dashboard statistics")
  }
}
