"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

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
            role: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { mealType: "asc" }],
    })

    return { success: true, data: menus }
  } catch (error) {
    console.error("Error fetching menus:", error)
    return { success: false, error: "Failed to fetch menus" }
  }
}

export async function getMenuById(id: string) {
  try {
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
        kitchen: true,
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    })

    if (!menu) {
      return { success: false, error: "Menu not found" }
    }

    return { success: true, data: menu }
  } catch (error) {
    console.error("Error fetching menu:", error)
    return { success: false, error: "Failed to fetch menu" }
  }
}

export async function createMenu(data: {
  date: Date
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"
  recipeId: string
  kitchenId: string
  servings: number
  ghanFactor?: number
  status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user has permission for this kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== data.kitchenId) {
      return { success: false, error: "Unauthorized for this kitchen" }
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
        status: data.status || "PLANNED",
      },
      include: {
        recipe: true,
        kitchen: true,
      },
    })

    revalidatePath("/menus")
    return { success: true, data: menu }
  } catch (error) {
    console.error("Error creating menu:", error)
    return { success: false, error: "Failed to create menu" }
  }
}

export async function updateMenu(
  id: string,
  data: {
    date?: Date
    mealType?: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"
    recipeId?: string
    servings?: number
    ghanFactor?: number
    status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the menu to check permissions
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    })

    if (!existingMenu) {
      return { success: false, error: "Menu not found" }
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== existingMenu.kitchenId) {
      return { success: false, error: "Unauthorized for this kitchen" }
    }

    const menu = await prisma.menu.update({
      where: { id },
      data,
      include: {
        recipe: true,
        kitchen: true,
      },
    })

    revalidatePath("/menus")
    return { success: true, data: menu }
  } catch (error) {
    console.error("Error updating menu:", error)
    return { success: false, error: "Failed to update menu" }
  }
}

export async function deleteMenu(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the menu to check permissions
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    })

    if (!existingMenu) {
      return { success: false, error: "Menu not found" }
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== existingMenu.kitchenId) {
      return { success: false, error: "Unauthorized for this kitchen" }
    }

    await prisma.menu.delete({
      where: { id },
    })

    revalidatePath("/menus")
    return { success: true }
  } catch (error) {
    console.error("Error deleting menu:", error)
    return { success: false, error: "Failed to delete menu" }
  }
}

export async function getTodaysMenus(kitchenId?: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const where: any = {
      date: {
        gte: today,
        lt: tomorrow,
      },
    }

    if (kitchenId) {
      where.kitchenId = kitchenId
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
        kitchen: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        mealType: "asc",
      },
    })

    return { success: true, data: menus }
  } catch (error) {
    console.error("Error fetching today's menus:", error)
    return { success: false, error: "Failed to fetch today's menus" }
  }
}
