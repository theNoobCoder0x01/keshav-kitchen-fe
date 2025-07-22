"use server"

import { revalidatePath } from "next/cache"
import prisma from "../prisma"
import { auth } from "../auth"
import { z } from "zod"
import { menuSchema } from "../validations/menu"

export async function getMenus(date?: string) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    const today = date ? new Date(date) : new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const where: any = {
      date: {
        gte: today,
        lt: tomorrow,
      },
    }

    // Non-admin users can only see menus for their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      where.kitchenId = session.user.kitchenId
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        recipe: true,
        kitchen: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { mealType: "asc" }],
    })

    return { success: true, data: menus }
  } catch (error) {
    console.error("Error fetching menus:", error)
    return { success: false, error: "Failed to fetch menus" }
  }
}

export async function getMenuById(id: string) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

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
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!menu) {
      return { success: false, error: "Menu not found" }
    }

    // Check if user has access to this menu
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== menu.kitchenId) {
      throw new Error("Unauthorized to access this menu")
    }

    return { success: true, data: menu }
  } catch (error) {
    console.error("Error fetching menu:", error)
    return { success: false, error: "Failed to fetch menu" }
  }
}

export async function createMenu(data: z.infer<typeof menuSchema>) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Validate data
    const validatedData = menuSchema.parse(data)

    // Check if user has access to this kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== validatedData.kitchenId) {
      throw new Error("Unauthorized to create menu for this kitchen")
    }

    const menu = await prisma.menu.create({
      data: {
        date: new Date(validatedData.date),
        mealType: validatedData.mealType,
        recipeId: validatedData.recipeId,
        kitchenId: validatedData.kitchenId,
        userId: session.user.id,
        servings: validatedData.servings,
        ghanFactor: validatedData.ghanFactor || 1.0,
        status: validatedData.status || "PLANNED",
        notes: validatedData.notes,
      },
    })

    revalidatePath("/")
    return { success: true, data: menu }
  } catch (error) {
    console.error("Error creating menu:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create menu" }
  }
}

export async function updateMenu(id: string, data: Partial<z.infer<typeof menuSchema>>) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Get the current menu
    const currentMenu = await prisma.menu.findUnique({
      where: { id },
    })

    if (!currentMenu) {
      return { success: false, error: "Menu not found" }
    }

    // Check if user has access to this menu
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== currentMenu.kitchenId) {
      throw new Error("Unauthorized to update this menu")
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        mealType: data.mealType,
        recipeId: data.recipeId,
        kitchenId: data.kitchenId,
        servings: data.servings,
        ghanFactor: data.ghanFactor,
        status: data.status,
        actualCount: data.actualCount,
        notes: data.notes,
      },
    })

    revalidatePath("/")
    return { success: true, data: menu }
  } catch (error) {
    console.error("Error updating menu:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update menu" }
  }
}

export async function deleteMenu(id: string) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Get the current menu
    const currentMenu = await prisma.menu.findUnique({
      where: { id },
    })

    if (!currentMenu) {
      return { success: false, error: "Menu not found" }
    }

    // Check if user has access to this menu
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "MANAGER" &&
      session.user.kitchenId !== currentMenu.kitchenId
    ) {
      throw new Error("Unauthorized to delete this menu")
    }

    await prisma.menu.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting menu:", error)
    return { success: false, error: "Failed to delete menu" }
  }
}
