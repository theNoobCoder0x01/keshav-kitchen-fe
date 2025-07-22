"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { MealType, Status } from "@prisma/client"

export async function getMenus(kitchenId?: string, date?: Date) {
  try {
    const where: any = {}

    if (kitchenId) {
      where.kitchenId = kitchenId
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        recipe: {
          include: {
            ingredients: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        kitchen: {
          select: {
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { mealType: "asc" }],
    })

    return menus
  } catch (error) {
    console.error("Error fetching menus:", error)
    throw new Error("Failed to fetch menus")
  }
}

export async function createMenu(data: {
  date: Date
  mealType: MealType
  recipeId: string
  kitchenId: string
  userId: string
  servings: number
  ghanFactor?: number
  notes?: string
}) {
  try {
    const menu = await prisma.menu.create({
      data: {
        date: data.date,
        mealType: data.mealType,
        recipeId: data.recipeId,
        kitchenId: data.kitchenId,
        userId: data.userId,
        servings: data.servings,
        ghanFactor: data.ghanFactor || 1.0,
        notes: data.notes,
        status: "PLANNED",
      },
      include: {
        recipe: true,
        kitchen: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath("/")
    return menu
  } catch (error) {
    console.error("Error creating menu:", error)
    throw new Error("Failed to create menu")
  }
}

export async function updateMenu(
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
    const menu = await prisma.menu.update({
      where: { id },
      data,
      include: {
        recipe: true,
        kitchen: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath("/")
    return menu
  } catch (error) {
    console.error("Error updating menu:", error)
    throw new Error("Failed to update menu")
  }
}

export async function deleteMenu(id: string) {
  try {
    await prisma.menu.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting menu:", error)
    throw new Error("Failed to delete menu")
  }
}

export async function getTodaysMenus(kitchenId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return getMenus(kitchenId, today)
}

export async function getMenuStats() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalMenus = await prisma.menu.count()
    const todaysMenus = await prisma.menu.count({
      where: {
        date: {
          gte: today,
        },
      },
    })

    const menusByStatus = await prisma.menu.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    })

    const menusByMealType = await prisma.menu.groupBy({
      by: ["mealType"],
      _count: {
        mealType: true,
      },
    })

    return {
      totalMenus,
      todaysMenus,
      menusByStatus,
      menusByMealType,
    }
  } catch (error) {
    console.error("Error fetching menu stats:", error)
    throw new Error("Failed to fetch menu stats")
  }
}
