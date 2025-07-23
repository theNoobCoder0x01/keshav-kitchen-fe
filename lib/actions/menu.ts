"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getDailyMenus(date?: Date) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const targetDate = date || new Date()
  targetDate.setHours(0, 0, 0, 0)

  const menus = await prisma.menu.findMany({
    where: {
      date: targetDate,
      ...(session.user.kitchenId && { kitchenId: session.user.kitchenId }),
    },
    include: {
      recipe: {
        include: {
          ingredients: true,
        },
      },
      kitchen: true,
      user: true,
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
    {} as Record<string, typeof menus>,
  )

  return groupedMenus
}

export async function getMenuStats() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [todayMenus, tomorrowMenus, totalRecipes, totalKitchens] = await Promise.all([
    prisma.menu.count({
      where: {
        date: today,
        ...(session.user.kitchenId && { kitchenId: session.user.kitchenId }),
      },
    }),
    prisma.menu.count({
      where: {
        date: tomorrow,
        ...(session.user.kitchenId && { kitchenId: session.user.kitchenId }),
      },
    }),
    prisma.recipe.count({
      ...(session.user.kitchenId && {
        where: {
          user: {
            kitchenId: session.user.kitchenId,
          },
        },
      }),
    }),
    session.user.role === "ADMIN" ? prisma.kitchen.count() : 1,
  ])

  return {
    todayMenus,
    tomorrowMenus,
    totalRecipes,
    totalKitchens,
  }
}

export async function createDailyMenu(data: {
  date: Date
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"
  recipeId: string
  kitchenId: string
  servings: number
  ghanFactor: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Check permissions
  if (session.user.kitchenId && session.user.kitchenId !== data.kitchenId) {
    throw new Error("You can only create menus for your assigned kitchen")
  }

  try {
    const menu = await prisma.menu.create({
      data: {
        date: data.date,
        mealType: data.mealType,
        recipeId: data.recipeId,
        kitchenId: data.kitchenId,
        userId: session.user.id,
        servings: data.servings,
        ghanFactor: data.ghanFactor,
        status: "PLANNED",
        notes: data.notes,
      },
      include: {
        recipe: true,
        kitchen: true,
      },
    })

    revalidatePath("/")
    return { success: true, menu }
  } catch (error) {
    console.error("Error creating menu:", error)
    return { success: false, error: "Failed to create menu" }
  }
}

export async function updateDailyMenu(
  id: string,
  data: {
    servings?: number
    ghanFactor?: number
    status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
    actualCount?: number
    notes?: string
  },
) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  try {
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    })

    if (!existingMenu) {
      return { success: false, error: "Menu not found" }
    }

    // Check permissions
    if (session.user.kitchenId && session.user.kitchenId !== existingMenu.kitchenId) {
      throw new Error("You can only update menus for your assigned kitchen")
    }

    const menu = await prisma.menu.update({
      where: { id },
      data,
      include: {
        recipe: true,
        kitchen: true,
      },
    })

    revalidatePath("/")
    return { success: true, menu }
  } catch (error) {
    console.error("Error updating menu:", error)
    return { success: false, error: "Failed to update menu" }
  }
}

export async function deleteDailyMenu(id: string) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  try {
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    })

    if (!existingMenu) {
      return { success: false, error: "Menu not found" }
    }

    // Check permissions
    if (session.user.kitchenId && session.user.kitchenId !== existingMenu.kitchenId) {
      throw new Error("You can only delete menus for your assigned kitchen")
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
