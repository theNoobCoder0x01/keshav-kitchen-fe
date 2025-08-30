"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { epochToDate } from "../utils/date";

export async function getCookReport(epochMs: number) {
  // Fetch report data from DB based on date
  let data;
  try {
    const session = await auth();

    if (!session?.user) {
      return [];
    }

    const targetDate = epochMs ? epochToDate(Number(epochMs)) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    data = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ mealType: "asc" }, { date: "asc" }],
      select: {
        kitchenId: true,
        mealType: true,
        recipeId: true,
        ghanFactor: true,
        recipe: { select: { name: true } },
        kitchen: { select: { name: true } },
      },
    });

    // Transform into flat structure like SQL result
    data = data.map((m) => ({
      kitchenId: m.kitchenId,
      kitchenName: m.kitchen.name,
      mealType: m.mealType,
      recipeId: m.recipeId,
      recipeName: m.recipe.name,
      ghanFactor: m.ghanFactor,
    }));

    return data;
  } catch (error) {
    console.error("Get cook report error:", error);
    return [];
  }
}

export async function getSupplierReport(epochMs: number) {
  // Fetch report data from DB based on date
  let data;
  try {
    const session = await auth();

    if (!session?.user) {
      return [];
    }

    const targetDate = epochMs ? epochToDate(Number(epochMs)) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    data = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ mealType: "asc" }, { date: "asc" }],
      select: {
        kitchenId: true,
        mealType: true,
        recipeId: true,
        ghanFactor: true,
        recipe: { select: { name: true } },
        kitchen: { select: { name: true } },
      },
    });

    // Transform into flat structure like SQL result
    data = data.map((m) => ({
      kitchenId: m.kitchenId,
      kitchenName: m.kitchen.name,
      mealType: m.mealType,
      recipeId: m.recipeId,
      recipeName: m.recipe.name,
      ghanFactor: m.ghanFactor,
      totalQuantity: m.ghanFactor, // TODO: calculate sum of all the ingredients
    }));

    return data;
  } catch (error) {
    console.error("Get cook report error:", error);
    return [];
  }
}

export async function getRecipesReport(epochMs: number) {
  // Fetch report data from DB based on date
  let data;
  try {
    const targetDate = epochMs ? epochToDate(Number(epochMs)) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    data = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ mealType: "asc" }, { date: "asc" }],
      select: {
        kitchenId: true,
        mealType: true,
        recipeId: true,
        ghanFactor: true,
        recipe: { select: { name: true } },
        kitchen: { select: { name: true } },
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
          },
        },
      },
    });

    // Transform into flat structure like SQL result
    data = data.map((m) => ({
      kitchenId: m.kitchenId,
      kitchenName: m.kitchen.name,
      mealType: m.mealType,
      recipeId: m.recipeId,
      recipeName: m.recipe.name,
      ghanFactor: m.ghanFactor,
      ingredients: m.ingredients.map((i) => ({
        ...i,
        quantity: m.ghanFactor * i.quantity,
      })),
    }));

    return data;
  } catch (error) {
    console.error("Get cook report error:", error);
    return [];
  }
}
