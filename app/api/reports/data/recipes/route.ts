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
        { status: 400 }
      );
    }

    const date = new Date(epochMs);
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );

    const menus = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
        menuComponent: {
          select: {
            name: true,
            sequenceNumber: true,
          },
        },
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
            sequenceNumber: true,
          },
          orderBy: {
            sequenceNumber: "asc",
          },
        },
        ingredientGroups: {
          include: {
            ingredients: {
              select: {
                name: true,
                quantity: true,
                unit: true,
                sequenceNumber: true,
              },
              orderBy: {
                sequenceNumber: "asc",
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
          kitchen: {
            name: "asc",
          },
        },
        {
          mealType: "asc",
        },
        {
          menuComponent: {
            sequenceNumber: "asc",
          },
        },
        {
          recipe: {
            name: "asc",
          },
        },
      ],
    });

    // Group by kitchen -> mealType -> recipeId
    const kitchenMap: { [key: string]: any } = {};

    menus.forEach((menu: any) => {
      const kitchenName = menu.kitchen.name;
      const mealType = menu.mealType;
      const recipeId = menu.recipeId;

      if (!kitchenMap[kitchenName]) {
        kitchenMap[kitchenName] = {
          kitchenName,
          mealTypeMap: {},
        };
      }

      if (!kitchenMap[kitchenName].mealTypeMap[mealType]) {
        kitchenMap[kitchenName].mealTypeMap[mealType] = {
          mealType,
          recipeMap: {},
        };
      }

      const recipeMap = kitchenMap[kitchenName].mealTypeMap[mealType].recipeMap;

      if (!recipeMap[recipeId]) {
        recipeMap[recipeId] = {
          recipeId,
          recipeName: menu.recipe.name,
          ghanFactor: 0,
          preparedQuantity: 0,
          preparedQuantityUnit: menu.preparedQuantityUnit,
          menuComponents: new Set(),
          minSequenceNumber: menu.menuComponent?.sequenceNumber ?? Infinity,
          groupMap: {},
        };
      } else {
        const seq = menu.menuComponent?.sequenceNumber ?? Infinity;
        if (seq < recipeMap[recipeId].minSequenceNumber) {
          recipeMap[recipeId].minSequenceNumber = seq;
        }
      }
      recipeMap[recipeId].ghanFactor += menu.ghanFactor;
      if (menu.preparedQuantity) {
        recipeMap[recipeId].preparedQuantity += menu.preparedQuantity;
      }

      if (menu.menuComponent) {
        recipeMap[recipeId].menuComponents.add(menu.menuComponent.name);
      }

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
      menu.ingredientGroups.forEach((group: any) => {
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

    const data = Object.values(kitchenMap).map((kitchen: any) => ({
      kitchenName: kitchen.kitchenName,
      mealTypes: Object.values(kitchen.mealTypeMap).map((mealType: any) => ({
        mealType: mealType.mealType,
        recipes: Object.values(mealType.recipeMap)
          .sort((a: any, b: any) => {
            if (a.minSequenceNumber !== b.minSequenceNumber) {
              return a.minSequenceNumber - b.minSequenceNumber;
            }
            return a.recipeName.localeCompare(b.recipeName);
          })
          .map((recipe: any) => ({
          recipeId: recipe.recipeId,
          recipeName: recipe.recipeName,
          ghanFactor: recipe.ghanFactor,
          preparedQuantity: recipe.preparedQuantity,
          preparedQuantityUnit: recipe.preparedQuantityUnit,
          menuComponents: Array.from(recipe.menuComponents),
          ingredientGroups: Object.values(recipe.groupMap)
            .map((group: any) => ({
              name: group.name,
              ingredients: Object.values(group.ingredientMap).sort(
                (a: any, b: any) => a.sequenceNumber - b.sequenceNumber
              ),
            }))
            .sort((a: any, b: any) => {
              if (a.name === "Ungrouped") return -1;
              if (b.name === "Ungrouped") return 1;
              return a.name.localeCompare(b.name);
            }),
        })),
      })),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get recipes report data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes report data" },
      { status: 500 }
    );
  }
}
