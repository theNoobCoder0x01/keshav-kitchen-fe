"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { MealType, Status } from "@prisma/client"

export async function getDailyMenus(date?: Date) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const targetDate = date || new Date()
    targetDate.setHours(0, 0, 0, 0)

    const whereClause: any = {
      date: targetDate,
    }

    // If user has a specific kitchen, filter by it
    if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause.kitchenId = session.user.kitchenId
    }

    const menus = await prisma.menu.findMany({
      where: whereClause,
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            servings: true,
            category: true,
            ingredients: {
              select: {
                name: true,
                quantity: true,
                unit: true,
                costPerUnit: true,
              },
            },
          },
        },
        kitchen: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ mealType: "asc" }, { createdAt: "asc" }],
    })

    // Group by meal type
    const groupedMenus = menus.reduce(
      (acc, menu) => {
        if (!acc[menu.mealType]) {
          acc[menu.mealType] = []
        }
        acc[menu.mealType].push(menu)
        return acc
      },
      {} as Record<MealType, typeof menus>,
    )

    return { success: true, data: groupedMenus }
  } catch (error) {
    console.error("Get daily menus error:", error)
    return { success: false, error: "Failed to fetch daily menus" }
  }
}

export async function getMenuStats() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const whereClause: any = {}

    // If user has a specific kitchen, filter by it
    if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause.kitchenId = session.user.kitchenId
    }

    const [todayMenus, tomorrowMenus, totalMenusThisWeek, completedMenusToday] = await Promise.all([
      prisma.menu.count({
        where: {
          ...whereClause,
          date: today,
        },
      }),
      prisma.menu.count({
        where: {
          ...whereClause,
          date: tomorrow,
        },
      }),
      prisma.menu.count({
        where: {
          ...whereClause,
          date: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
            lte: today,
          },
        },
      }),
      prisma.menu.count({
        where: {
          ...whereClause,
          date: today,
          status: "COMPLETED",
        },
      }),
    ])

    const totalServingsToday = await prisma.menu.aggregate({
      where: {
        ...whereClause,
        date: today,
      },
      _sum: {
        servings: true,
        actualCount: true,
      },
    })

    return {
      success: true,
      data: {
        todayMenus,
        tomorrowMenus,
        totalMenusThisWeek,
        completedMenusToday,
        plannedServingsToday: totalServingsToday._sum.servings || 0,
        actualServingsToday: totalServingsToday._sum.actualCount || 0,
      },
    }
  } catch (error) {
    console.error("Get menu stats error:", error)
    return { success: false, error: "Failed to fetch menu statistics" }
  }
}

export async function createDailyMenu(data: {
  date: Date
  mealType: MealType
  recipeId: string
  kitchenId: string
  servings: number
  ghanFactor?: number
  notes?: string
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user has permission to create menu for this kitchen
    if (session.user.kitchenId && session.user.role !== "ADMIN" && session.user.kitchenId !== data.kitchenId) {
      return { success: false, error: "Access denied for this kitchen" }
    }

    const menu = await prisma.menu.create({
      data: {
        date: data.date,
        mealType: data.mealType,
        recipeId: data.recipeId,
        kitchenId: data.kitchenId,
        userId: session.user.id,
        servings: data.servings,
        ghanFactor: data.ghanFactor || 1.0,
        status: "PLANNED",
        notes: data.notes,
      },
      include: {
        recipe: {
          select: {
            name: true,
            category: true,
          },
        },
        kitchen: {
          select: {
            name: true,
          },
        },
      },
    })

    revalidatePath("/")
    return { success: true, data: menu }
  } catch (error) {
    console.error("Create daily menu error:", error)
    return { success: false, error: "Failed to create menu item" }
  }
}

export async function updateDailyMenu(
  id: string,
  data: {
    servings?: number
    ghanFactor?: number
    status?: Status
    actualCount?: number
    notes?: string
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if menu exists and user has permission
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
      select: { kitchenId: true, userId: true },
    })

    if (!existingMenu) {
      return { success: false, error: "Menu item not found" }
    }

    // Check permissions
    if (session.user.kitchenId && session.user.role !== "ADMIN" && session.user.kitchenId !== existingMenu.kitchenId) {
      return { success: false, error: "Access denied" }
    }

    const menu = await prisma.menu.update({
      where: { id },
      data,
      include: {
        recipe: {
          select: {
            name: true,
            category: true,
          },
        },
        kitchen: {
          select: {
            name: true,
          },
        },
      },
    })

    revalidatePath("/")
    return { success: true, data: menu }
  } catch (error) {
    console.error("Update daily menu error:", error)
    return { success: false, error: "Failed to update menu item" }
  }
}

export async function deleteDailyMenu(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if menu exists and user has permission
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
      select: { kitchenId: true, userId: true },
    })

    if (!existingMenu) {
      return { success: false, error: "Menu item not found" }
    }

    // Check permissions
    if (
      session.user.kitchenId &&
      session.user.role !== "ADMIN" &&
      session.user.kitchenId !== existingMenu.kitchenId &&
      existingMenu.userId !== session.user.id
    ) {
      return { success: false, error: "Access denied" }
    }

    await prisma.menu.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Delete daily menu error:", error)
    return { success: false, error: "Failed to delete menu item" }
  }
}

export async function getMenusByDateRange(startDate: Date, endDate: Date) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    // If user has a specific kitchen, filter by it
    if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause.kitchenId = session.user.kitchenId
    }

    const menus = await prisma.menu.findMany({
      where: whereClause,
      include: {
        recipe: {
          select: {
            name: true,
            category: true,
            servings: true,
          },
        },
        kitchen: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { mealType: "asc" }],
    })

    return { success: true, data: menus }
  } catch (error) {
    console.error("Get menus by date range error:", error)
    return { success: false, error: "Failed to fetch menus" }
  }
}
