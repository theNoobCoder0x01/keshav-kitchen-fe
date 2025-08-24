"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createEndOfDayUTC,
  createStartOfDayUTC,
  getCurrentDateUTC,
} from "@/lib/utils/date";
import { MealType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getDailyMenus(date?: Date, kitchenId?: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return {};
    }

    const targetDate = date || getCurrentDateUTC(); // Use UTC for consistency
    const targetKitchenId = kitchenId || session.user.kitchenId;

    if (!targetKitchenId) {
      return {};
    }

    // Use date-fns for consistent day boundary handling in UTC
    const startOfDay = createStartOfDayUTC(targetDate);
    const endOfDay = createEndOfDayUTC(targetDate);

    const menus = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
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
    });

    // Group by meal type
    const groupedMenus = {
      BREAKFAST: menus.filter((m) => m.mealType === MealType.BREAKFAST),
      LUNCH: menus.filter((m) => m.mealType === MealType.LUNCH),
      DINNER: menus.filter((m) => m.mealType === MealType.DINNER),
      SNACK: menus.filter((m) => m.mealType === MealType.SNACK),
    };

    return groupedMenus;
  } catch (error) {
    console.error("Get daily menus error:", error);
    return {};
  }
}

export async function getMenuStats(date?: Date, kitchenId?: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        total: { planned: 0 },
        byMealType: { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACK: 0 },
      };
    }

    const targetDate = date || new Date();
    const targetKitchenId = kitchenId || session.user.kitchenId;

    if (!targetKitchenId) {
      return {
        total: { planned: 0 },
        byMealType: { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACK: 0 },
      };
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalPlanned, mealTypeStats] = await Promise.all([
      prisma.menu.aggregate({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          kitchenId: targetKitchenId,
        },
        _sum: {
          servings: true,
        },
      }),
      prisma.menu.groupBy({
        by: ["mealType"],
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          kitchenId: targetKitchenId,
        },
        _sum: {
          servings: true,
        },
      }),
    ]);

    const byMealType = {
      BREAKFAST: 0,
      LUNCH: 0,
      DINNER: 0,
      SNACK: 0,
    };

    mealTypeStats.forEach((stat) => {
      byMealType[stat.mealType] = stat._sum.servings || 0;
    });

    return {
      total: { planned: totalPlanned._sum.servings || 0 },
      byMealType,
    };
  } catch (error) {
    console.error("Get menu stats error:", error);
    return {
      total: { planned: 0 },
      byMealType: { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACK: 0 },
    };
  }
}

export async function createDailyMenu(data: {
  date: Date;
  mealType: MealType;
  recipeId: string;
  kitchenId: string;
  servings: number;
  ghanFactor?: number;
  notes?: string;
}) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check permissions
    if (
      session.user.role === "STAFF" &&
      data.kitchenId !== session.user.kitchenId
    ) {
      return { success: false, error: "Access denied for this kitchen" };
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
    });

    revalidatePath("/");
    return { success: true, data: menu };
  } catch (error) {
    console.error("Create daily menu error:", error);
    return { success: false, error: "Failed to create menu item" };
  }
}

export async function updateDailyMenu(
  id: string,
  data: {
    servings?: number;
    ghanFactor?: number;
    status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    actualCount?: number;
    notes?: string;
  },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if menu exists and user has permission
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
      select: { kitchenId: true, userId: true },
    });

    if (!existingMenu) {
      return { success: false, error: "Menu item not found" };
    }

    // Check permissions
    if (
      session.user.role === "STAFF" &&
      existingMenu.userId !== session.user.id
    ) {
      return { success: false, error: "Access denied" };
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
    });

    revalidatePath("/");
    return { success: true, data: menu };
  } catch (error) {
    console.error("Update daily menu error:", error);
    return { success: false, error: "Failed to update menu item" };
  }
}

export async function deleteDailyMenu(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if menu exists and user has permission
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
      select: { kitchenId: true, userId: true },
    });

    if (!existingMenu) {
      return { success: false, error: "Menu item not found" };
    }

    // Check permissions
    if (
      session.user.role === "STAFF" &&
      existingMenu.userId !== session.user.id
    ) {
      return { success: false, error: "Access denied" };
    }

    await prisma.menu.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete daily menu error:", error);
    return { success: false, error: "Failed to delete menu item" };
  }
}
