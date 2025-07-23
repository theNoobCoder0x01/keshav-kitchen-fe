"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { CreateDailyMenuSchema, UpdateDailyMenuSchema } from "@/lib/validations/menu"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay } from "date-fns"

export async function createDailyMenu(formData: FormData) {
  try {
    const session = await requireAuth()

    const rawData = {
      kitchenId: formData.get("kitchenId") as string,
      menuDate: new Date(formData.get("menuDate") as string),
      mealType: formData.get("mealType") as string,
      recipeId: formData.get("recipeId") as string,
      plannedServings: Number.parseInt(formData.get("plannedServings") as string),
      ghanMultiplier: Number.parseFloat(formData.get("ghanMultiplier") as string) || 1,
    }

    const validatedData = CreateDailyMenuSchema.parse(rawData)

    // Check for existing menu item
    const existing = await prisma.dailyMenu.findUnique({
      where: {
        kitchenId_menuDate_mealType_recipeId: {
          kitchenId: validatedData.kitchenId,
          menuDate: validatedData.menuDate,
          mealType: validatedData.mealType as any,
          recipeId: validatedData.recipeId,
        },
      },
    })

    if (existing) {
      return { success: false, error: "Menu item already exists for this date and meal type" }
    }

    const menuItem = await prisma.dailyMenu.create({
      data: {
        kitchenId: validatedData.kitchenId,
        menuDate: validatedData.menuDate,
        mealType: validatedData.mealType as any,
        recipeId: validatedData.recipeId,
        plannedServings: validatedData.plannedServings,
        ghanMultiplier: validatedData.ghanMultiplier,
        createdBy: session.user.id,
      },
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
        kitchen: {
          select: { name: true },
        },
      },
    })

    revalidatePath("/")
    revalidatePath("/reports")
    return { success: true, menuItem }
  } catch (error) {
    console.error("Create daily menu error:", error)
    return { success: false, error: "Failed to create menu item" }
  }
}

export async function updateDailyMenu(formData: FormData) {
  try {
    const session = await requireAuth()

    const rawData = {
      id: formData.get("id") as string,
      actualServings: formData.get("actualServings")
        ? Number.parseInt(formData.get("actualServings") as string)
        : undefined,
      status: formData.get("status") as string,
      plannedServings: formData.get("plannedServings")
        ? Number.parseInt(formData.get("plannedServings") as string)
        : undefined,
      ghanMultiplier: formData.get("ghanMultiplier")
        ? Number.parseFloat(formData.get("ghanMultiplier") as string)
        : undefined,
    }

    const validatedData = UpdateDailyMenuSchema.parse(rawData)

    const menuItem = await prisma.dailyMenu.update({
      where: { id: validatedData.id },
      data: {
        actualServings: validatedData.actualServings,
        status: validatedData.status as any,
        plannedServings: validatedData.plannedServings,
        ghanMultiplier: validatedData.ghanMultiplier,
      },
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
        kitchen: {
          select: { name: true },
        },
      },
    })

    revalidatePath("/")
    revalidatePath("/reports")
    return { success: true, menuItem }
  } catch (error) {
    console.error("Update daily menu error:", error)
    return { success: false, error: "Failed to update menu item" }
  }
}

export async function deleteDailyMenu(menuId: string) {
  try {
    const session = await requireAuth()

    await prisma.dailyMenu.delete({
      where: { id: menuId },
    })

    revalidatePath("/")
    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Delete daily menu error:", error)
    return { success: false, error: "Failed to delete menu item" }
  }
}

export async function getDailyMenus(date: Date, kitchenId?: string) {
  try {
    const session = await requireAuth()

    const where = {
      menuDate: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      ...(kitchenId && { kitchenId }),
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
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
      orderBy: [{ mealType: "asc" }, { createdAt: "asc" }],
    })

    // Group by meal type
    const groupedMenus = {
      BREAKFAST: menus.filter((m) => m.mealType === "BREAKFAST"),
      LUNCH: menus.filter((m) => m.mealType === "LUNCH"),
      DINNER: menus.filter((m) => m.mealType === "DINNER"),
      SNACK: menus.filter((m) => m.mealType === "SNACK"),
    }

    return groupedMenus
  } catch (error) {
    console.error("Get daily menus error:", error)
    // Return empty structure instead of throwing
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

    const where = {
      menuDate: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      ...(kitchenId && { kitchenId }),
      ...(session.user.kitchenId && session.user.role !== "ADMIN" && { kitchenId: session.user.kitchenId }),
    }

    const stats = await prisma.dailyMenu.groupBy({
      by: ["mealType"],
      where,
      _sum: {
        plannedServings: true,
        actualServings: true,
      },
      _count: {
        id: true,
      },
    })

    const totalPlanned = stats.reduce((sum, stat) => sum + (stat._sum.plannedServings || 0), 0)
    const totalActual = stats.reduce((sum, stat) => sum + (stat._sum.actualServings || 0), 0)

    return {
      total: {
        planned: totalPlanned,
        actual: totalActual || totalPlanned,
        items: stats.reduce((sum, stat) => sum + stat._count.id, 0),
      },
      byMealType: {
        BREAKFAST: stats.find((s) => s.mealType === "BREAKFAST")?._sum.plannedServings || 0,
        LUNCH: stats.find((s) => s.mealType === "LUNCH")?._sum.plannedServings || 0,
        DINNER: stats.find((s) => s.mealType === "DINNER")?._sum.plannedServings || 0,
        SNACK: stats.find((s) => s.mealType === "SNACK")?._sum.plannedServings || 0,
      },
    }
  } catch (error) {
    console.error("Get menu stats error:", error)
    // Return default stats instead of throwing
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
