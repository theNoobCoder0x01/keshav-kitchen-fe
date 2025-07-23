"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getDailyMenus(date?: Date, kitchenId?: string) {
  try {
    const session = await auth()

    if (!session?.user) {
      return []
    }

    const targetDate = date || new Date()
    const targetKitchenId = kitchenId || session.user.kitchenId

    if (!targetKitchenId) {
      return []
    }

    const menus = await prisma.menu.findMany({
      where: {
        date: {
          gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
          lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
        },
        kitchenId: targetKitchenId,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
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

    return menus
  } catch (error) {
    console.error("Get daily menus error:", error)
    return []
  }
}

export async function getMenuStats(kitchenId?: string) {
  try {
    const session = await auth()

    if (!session?.user) {
      return {
        totalMenusThisWeek: 0,
        totalMenusToday: 0,
        averageGhanFactor: 0,
        totalServingsToday: 0,
      }
    }

    const targetKitchenId = kitchenId || session.user.kitchenId

    if (!targetKitchenId) {
      return {
        totalMenusThisWeek: 0,
        totalMenusToday: 0,
        averageGhanFactor: 0,
        totalServingsToday: 0,
      }
    }

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfToday = new Date(today)
    startOfToday.setHours(0, 0, 0, 0)

    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    const [totalMenusThisWeek, totalMenusToday, avgGhanFactor, totalServingsToday] = await Promise.all([
      prisma.menu.count({
        where: {
          date: { gte: startOfWeek },
          kitchenId: targetKitchenId,
        },
      }),
      prisma.menu.count({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
          kitchenId: targetKitchenId,
        },
      }),
      prisma.menu.aggregate({
        where: { kitchenId: targetKitchenId },
        _avg: { ghanFactor: true },
      }),
      prisma.menu.aggregate({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
          kitchenId: targetKitchenId,
        },
        _sum: { servings: true },
      }),
    ])

    return {
      totalMenusThisWeek,
      totalMenusToday,
      averageGhanFactor: avgGhanFactor._avg.ghanFactor || 0,
      totalServingsToday: totalServingsToday._sum.servings || 0,
    }
  } catch (error) {
    console.error("Get menu stats error:", error)
    return {
      totalMenusThisWeek: 0,
      totalMenusToday: 0,
      averageGhanFactor: 0,
      totalServingsToday: 0,
    }
  }
}

export async function createDailyMenu(formData: FormData) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const date = formData.get("date") as string
    const mealType = formData.get("mealType") as string
    const recipeId = formData.get("recipeId") as string
    const servings = Number.parseInt(formData.get("servings") as string)
    const ghanFactor = Number.parseFloat(formData.get("ghanFactor") as string) || 1.0
    const notes = formData.get("notes") as string

    if (!date || !mealType || !recipeId || !servings) {
      return { success: false, error: "Missing required fields" }
    }

    if (!session.user.kitchenId) {
      return { success: false, error: "No kitchen assigned" }
    }

    const menu = await prisma.menu.create({
      data: {
        date: new Date(date),
        mealType: mealType as any,
        recipeId,
        kitchenId: session.user.kitchenId,
        userId: session.user.id,
        servings,
        ghanFactor,
        notes: notes || null,
        status: "PLANNED",
      },
    })

    revalidatePath("/")
    return { success: true, menu }
  } catch (error) {
    console.error("Create daily menu error:", error)
    return { success: false, error: "Failed to create menu" }
  }
}

export async function updateDailyMenu(id: string, formData: FormData) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const servings = Number.parseInt(formData.get("servings") as string)
    const ghanFactor = Number.parseFloat(formData.get("ghanFactor") as string)
    const status = formData.get("status") as string
    const actualCount = formData.get("actualCount") ? Number.parseInt(formData.get("actualCount") as string) : null
    const notes = formData.get("notes") as string

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        servings,
        ghanFactor,
        status: status as any,
        actualCount,
        notes: notes || null,
      },
    })

    revalidatePath("/")
    return { success: true, menu }
  } catch (error) {
    console.error("Update daily menu error:", error)
    return { success: false, error: "Failed to update menu" }
  }
}

export async function deleteDailyMenu(id: string) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.menu.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Delete daily menu error:", error)
    return { success: false, error: "Failed to delete menu" }
  }
}
