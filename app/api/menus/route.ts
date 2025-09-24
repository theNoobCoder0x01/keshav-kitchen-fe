import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createEndOfDayUTC,
  createStartOfDayUTC,
  parseISOString,
} from "@/lib/utils/date";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET all menus or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kitchenId = searchParams.get("kitchenId");
    const epochMs = searchParams.get("epochMs");
    const dateISOString = searchParams.get("date");
    const date = epochMs
      ? new Date(parseInt(epochMs))
      : dateISOString
        ? parseISOString(dateISOString)
        : new Date();

    // Build where clause for filtering
    const where: any = {};

    if (kitchenId) {
      where.kitchenId = kitchenId;
    }

    if (date) {
      // Parse date string and create UTC day boundaries for database queries
      const targetDate = date;
      const startOfDay = createStartOfDayUTC(targetDate);
      const endOfDay = createEndOfDayUTC(targetDate);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        menuComponent: {
          select: {
            id: true,
            name: true,
            label: true,
            mealType: true,
            sequenceNumber: true,
          },
        },
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
          },
        },
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
            sequenceNumber: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                sortOrder: true,
              },
            },
          },
          orderBy: [
            {
              sequenceNumber: "asc",
            },
          ],
        },
        ingredientGroups: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
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
    return NextResponse.json(menus);
  } catch (error) {
    console.error("Failed to fetch menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus." },
      { status: 500 }
    );
  }
}

// POST create menu
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.recipeId || !data.mealType || !data.kitchenId || !data.userId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: recipeId, mealType, kitchenId, userId",
        },
        { status: 400 }
      );
    }

    // Normalize date if epochMs provided
    if (data.epochMs) {
      data.date = new Date(data.epochMs);
    }

    // Extract ingredients and ingredientGroups from payload
    const { ingredients = [], ingredientGroups = [], deletedIngredientGroupIds, epochMs, ...menuData } = data;

    // Create menu, ingredient groups and ingredients in a transaction so we can map
    // any temporary frontend group IDs to real DB ids (same approach as recipes POST)
    const menu = await prisma.$transaction(async (tx) => {
      // Create the menu first (without nested ingredient/group creates)
      const newMenu = await tx.menu.create({
        data: {
          ...menuData,
          date: data.date ?? undefined,
        },
      });

      // Create ingredient groups (if any) and keep a map from temporary IDs -> real IDs
      const groupIdMap = new Map<string, string>();
      if (Array.isArray(ingredientGroups) && ingredientGroups.length > 0) {
        for (const group of ingredientGroups) {
          const createdGroup = await tx.menuIngredientGroup.create({
            data: {
              name: group.name,
              sortOrder: group.sortOrder ?? 0,
              menuId: newMenu.id,
            },
          });
          if (group.id) {
            groupIdMap.set(group.id, createdGroup.id);
          }
        }
      }

      // Build ingredient data, map temp group ids to real ids when necessary
      const ingredientData = (ingredients || []).map((ingredient: any) => {
        let finalGroupId: string | null = null;

        if (ingredient.groupId) {
          if (groupIdMap.has(ingredient.groupId)) {
            finalGroupId = groupIdMap.get(ingredient.groupId) as string;
          } else {
            finalGroupId = ingredient.groupId;
          }
        }

        return {
          menuId: newMenu.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit ?? undefined,
          sequenceNumber:
            ingredient.sequenceNumber != null
              ? Number(ingredient.sequenceNumber)
              : null,
          groupId: finalGroupId,
        };
      });

      if (ingredientData.length > 0) {
        await tx.menuIngredient.createMany({ data: ingredientData });
      }

      // Return the created menu with included relations for the client
      return await tx.menu.findUnique({
        where: { id: newMenu.id },
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
            },
          },
          ingredients: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unit: true,
              costPerUnit: true,
              sequenceNumber: true,
              groupId: true,
              group: {
                select: {
                  id: true,
                  name: true,
                  sortOrder: true,
                },
              },
            },
            orderBy: [
              {
                sequenceNumber: "asc",
              },
            ],
          },
          ingredientGroups: {
            select: {
              id: true,
              name: true,
              sortOrder: true,
            },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
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
      });
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error("Create menu API error:", error);
    return NextResponse.json(
      { error: "Failed to create menu." },
      { status: 500 }
    );
  }
}


