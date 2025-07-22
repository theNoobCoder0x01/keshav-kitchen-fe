"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const MenuSchema = z.object({
  kitchenId: z.string(),
  menuDate: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string(),
  plannedServings: z.number().min(1),
  ghanMultiplier: z.number().min(0.1).max(10),
})

export async function getDailyMenus(date: Date, kitchenId?: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const whereClause: any = {
      menuDate: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    }

    if (kitchenId) {
      whereClause.kitchenId = kitchenId
    } else if (session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId
    }

    const menus = await prisma.dailyMenu.findMany({
      where: whereClause,
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
        kitchen: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ mealType: "asc" }, { createdAt: "desc" }],
    })

    return menus.map((menu) => ({
      id: menu.id,
      kitchenId: menu.kitchenId,
      kitchenName: menu.kitchen.name,
      menuDate: menu.menuDate,
      mealType: menu.mealType,
      recipe: {
        id: menu.recipe.id,
        name: menu.recipe.name,
        type: menu.recipe.type,
        description: menu.recipe.description,
        prepTime: menu.recipe.prepTime,
        cookTime: menu.recipe.cookTime,
        servings: menu.recipe.servings,
        costPerServing: menu.recipe.costPerServing,
        ingredients: menu.recipe.ingredients,
      },
      plannedServings: menu.plannedServings,
      actualServings: menu.actualServings,
      ghanMultiplier: menu.ghanMultiplier,
      status: menu.status,
      createdBy: menu.creator.name,
      createdAt: menu.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching daily menus:", error)
    throw new Error("Failed to fetch daily menus")
  }
}

export async function createDailyMenu(data: z.infer<typeof MenuSchema>) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const validatedData = MenuSchema.parse(data)

    // Check if menu already exists for this combination
    const existingMenu = await prisma.dailyMenu.findUnique({
      where: {
        kitchenId_menuDate_mealType_recipeId: {
          kitchenId: validatedData.kitchenId,
          menuDate: validatedData.menuDate,
          mealType: validatedData.mealType,
          recipeId: validatedData.recipeId,
        },
      },
    })

    if (existingMenu) {
      throw new Error("Menu already exists for this date, meal type, and recipe")
    }

    const menu = await prisma.dailyMenu.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
      include: {
        recipe: true,
        kitchen: true,
      },
    })

    revalidatePath("/")
    return menu
  } catch (error) {
    console.error("Error creating daily menu:", error)
    throw new Error("Failed to create daily menu")
  }
}

export async function updateDailyMenu(
  id: string,
  data: Partial<z.infer<typeof MenuSchema>> & {
    actualServings?: number
    status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED"
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const menu = await prisma.dailyMenu.update({
      where: { id },
      data,
      include: {
        recipe: true,
        kitchen: true,
      },
    })

    revalidatePath("/")
    return menu
  } catch (error) {
    console.error("Error updating daily menu:", error)
    throw new Error("Failed to update daily menu")
  }
}

export async function deleteDailyMenu(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    await prisma.dailyMenu.delete({
      where: { id },
    })

    revalidatePath("/")
  } catch (error) {
    console.error("Error deleting daily menu:", error)
    throw new Error("Failed to delete daily menu")
  }
}

export async function getMenuStats(kitchenId?: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const whereClause: any = {
      menuDate: today,
    }

    if (kitchenId) {
      whereClause.kitchenId = kitchenId
    } else if (session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId
    }

    const [totalMenus, completedMenus, plannedServings] = await Promise.all([
      prisma.dailyMenu.count({
        where: whereClause,
      }),
      prisma.dailyMenu.count({
        where: {
          ...whereClause,
          status: "COMPLETED",
        },
      }),
      prisma.dailyMenu.aggregate({
        where: whereClause,
        _sum: {
          plannedServings: true,
        },
      }),
    ])

    return {
      totalMenus,
      completedMenus,
      plannedServings: plannedServings._sum.plannedServings || 0,
      completionRate: totalMenus > 0 ? (completedMenus / totalMenus) * 100 : 0,
    }
  } catch (error) {
    console.error("Error fetching menu stats:", error)
    throw new Error("Failed to fetch menu stats")
  }
}
