import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
        date: { gte: startOfDay, lt: endOfDay },
      },
      include: {
        kitchen: {
          select: { name: true, sequenceNumber: true },
        },
        recipe: {
          select: { name: true },
        },
        menuComponent: {
          select: { name: true, label: true, sequenceNumber: true },
        },
        ingredients: {
          select: {
            name: true,
            quantity: true,
            unit: true,
            sequenceNumber: true,
            groupId: true,
          },
          orderBy: { sequenceNumber: "asc" },
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
              orderBy: { sequenceNumber: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [
        { kitchen: { sequenceNumber: "asc" } },
        { kitchen: { name: "asc" } },
        { mealType: "asc" },
        { menuComponent: { sequenceNumber: "asc" } },
      ],
    });

    // Group: kitchen -> mealType -> list of items
    const kitchenMap: Record<string, any> = {};

    menus.forEach((menu: any) => {
      const kitchenName = menu.kitchen.name;
      const mealType = menu.mealType;

      if (!kitchenMap[kitchenName]) {
        kitchenMap[kitchenName] = {
          kitchenName,
          sequenceNumber: menu.kitchen.sequenceNumber,
          mealTypeMap: {},
        };
      }

      if (!kitchenMap[kitchenName].mealTypeMap[mealType]) {
        kitchenMap[kitchenName].mealTypeMap[mealType] = {
          mealType,
          items: [],
        };
      }

      const recipeName =
        menu.recipe?.name ||
        menu.customName ||
        null;

      // Build ingredient groups
      // 1. Named groups from ingredientGroups relation
      const groupMap: Record<string, any> = {};

      menu.ingredientGroups.forEach((group: any) => {
        groupMap[group.id] = {
          id: group.id,
          name: group.name,
          sortOrder: group.sortOrder,
          ingredients: group.ingredients.map((ing: any) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        };
      });

      // 2. Ingredients not belonging to any group ("Ungrouped")
      const ungroupedIngs = menu.ingredients.filter(
        (ing: any) => !ing.groupId,
      );
      if (ungroupedIngs.length > 0) {
        groupMap["__ungrouped__"] = {
          id: "__ungrouped__",
          name: "Ungrouped",
          sortOrder: -1, // show first
          ingredients: ungroupedIngs.map((ing: any) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        };
      }

      const ingredientGroups = Object.values(groupMap).sort((a: any, b: any) => {
        if (a.name === "Ungrouped") return -1;
        if (b.name === "Ungrouped") return 1;
        return a.sortOrder - b.sortOrder;
      });

      kitchenMap[kitchenName].mealTypeMap[mealType].items.push({
        menuId: menu.id,
        menuComponentLabel:
          menu.menuComponent?.label ||
          menu.menuComponent?.name ||
          "અન્ય",
        menuComponentSequenceNumber:
          menu.menuComponent?.sequenceNumber ?? 9999,
        recipeName,
        followRecipe: menu.followRecipe,
        ghanFactor: menu.ghanFactor,
        // preparedQuantity is stored per-ghan when followRecipe, or as total when not.
        // Multiply by ghanFactor to get the actual total in both cases (ghan=1 when no recipe).
        preparedQuantity: menu.preparedQuantity != null
          ? menu.preparedQuantity * menu.ghanFactor
          : null,
        preparedQuantityUnit: menu.preparedQuantityUnit,
        ingredientGroups,
      });
    });

    const MEAL_TYPE_ORDER = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

    const data = Object.values(kitchenMap)
      .sort((a: any, b: any) => {
        if (a.sequenceNumber !== b.sequenceNumber)
          return a.sequenceNumber - b.sequenceNumber;
        return a.kitchenName.localeCompare(b.kitchenName);
      })
      .map((kitchen: any) => ({
        kitchenName: kitchen.kitchenName,
        mealTypes: Object.values(kitchen.mealTypeMap)
          .sort((a: any, b: any) => {
            const ai = MEAL_TYPE_ORDER.indexOf(a.mealType);
            const bi = MEAL_TYPE_ORDER.indexOf(b.mealType);
            return ai - bi;
          })
          .map((mealType: any) => ({
            mealType: mealType.mealType,
            items: [...mealType.items].sort(
              (a: any, b: any) =>
                a.menuComponentSequenceNumber - b.menuComponentSequenceNumber,
            ),
          })),
      }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get prasad report data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prasad report data" },
      { status: 500 },
    );
  }
}
