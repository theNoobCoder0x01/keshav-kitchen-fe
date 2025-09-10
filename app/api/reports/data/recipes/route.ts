import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Menu, MenuIngredient, MenuIngredientGroup } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const epochMs = parseInt(searchParams.get("epochMs") || "");

    if (!epochMs) {
      return NextResponse.json(
        { error: "epochMs is required" },
        { status: 400 },
      );
    }

    const date = new Date(epochMs);
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );

    const menus = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        recipe: {
          select: {
            name: true,
          },
        },
        ingredients: {
          select: {
            name: true,
            quantity: true,
            unit: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        ingredientGroups: {
          include: {
            ingredients: {
              select: {
                name: true,
                quantity: true,
                unit: true,
              },
              orderBy: {
                name: "asc",
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: [
        {
          recipe: {
            name: "asc",
          },
        },
      ],
    });

    // Group by recipeId and sum ghanFactor, aggregate ingredients by groups
    const recipeMap: { [key: string]: any } = {};

    menus.forEach((menu: Menu) => {
      const recipeId = menu.recipeId;
      if (!recipeMap[recipeId]) {
        recipeMap[recipeId] = {
          recipeId,
          recipeName: menu.recipe.name,
          ghanFactor: 0,
          groupMap: {},
        };
      }
      recipeMap[recipeId].ghanFactor += menu.ghanFactor;

      // Add menu ingredients to "Ungrouped" group
      if (!recipeMap[recipeId].groupMap["Ungrouped"]) {
        recipeMap[recipeId].groupMap["Ungrouped"] = {
          name: "Ungrouped",
          ingredientMap: {},
        };
      }
      menu.ingredients.forEach((ing: MenuIngredient) => {
        const key = `${ing.name}-${ing.unit}`;
        if (!recipeMap[recipeId].groupMap["Ungrouped"].ingredientMap[key]) {
          recipeMap[recipeId].groupMap["Ungrouped"].ingredientMap[key] = {
            name: ing.name,
            quantity: 0,
            unit: ing.unit,
          };
        }
        recipeMap[recipeId].groupMap["Ungrouped"].ingredientMap[key].quantity +=
          ing.quantity * menu.ghanFactor;
      });

      // Add ingredient groups
      menu.ingredientGroups.forEach((group: MenuIngredientGroup) => {
        if (!recipeMap[recipeId].groupMap[group.name]) {
          recipeMap[recipeId].groupMap[group.name] = {
            name: group.name,
            ingredientMap: {},
          };
        }
        group.ingredients.forEach((ing: MenuIngredient) => {
          const key = `${ing.name}-${ing.unit}`;
          if (!recipeMap[recipeId].groupMap[group.name].ingredientMap[key]) {
            recipeMap[recipeId].groupMap[group.name].ingredientMap[key] = {
              name: ing.name,
              quantity: 0,
              unit: ing.unit,
            };
          }
          recipeMap[recipeId].groupMap[group.name].ingredientMap[
            key
          ].quantity += ing.quantity * menu.ghanFactor;
        });
      });
    });

    const data = Object.values(recipeMap).map((recipe) => ({
      recipeId: recipe.recipeId,
      recipeName: recipe.recipeName,
      ghanFactor: recipe.ghanFactor,
      ingredientGroups: Object.values(recipe.groupMap)
        .map((group: any) => ({
          name: group.name,
          ingredients: Object.values(group.ingredientMap).sort(
            (a: any, b: any) => a.name.localeCompare(b.name),
          ),
        }))
        .sort((a: any, b: any) => {
          if (a.name === "Ungrouped") return -1;
          if (b.name === "Ungrouped") return 1;
          return a.name.localeCompare(b.name);
        }),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get recipes report data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes report data" },
      { status: 500 },
    );
  }
}
