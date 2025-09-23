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

    // Ensure date is properly formatted (parse to UTC Date for storage)
    if (data.epochMs) {
      data.date = new Date(data.epochMs);
    }

    // Extract ingredients and ingredientGroups from data
  const { ingredients, ingredientGroups, deletedIngredientGroupIds, epochMs, ...menuData } = data;

    // Build menu creation data (omit deletedIngredientGroupIds)
    const menuCreateData: any = {
      ...menuData,
      ingredients: {
        create:
          ingredients?.map((ingredient: any) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
            sequenceNumber: ingredient.sequenceNumber ?? null,
          })) || [],
      },
    };

    // Only add ingredientGroups if present and non-empty
    if (ingredientGroups && Array.isArray(ingredientGroups) && ingredientGroups.length > 0) {
      menuCreateData.ingredientGroups = {
        create: ingredientGroups.map((group: any) => ({
          name: group.name,
          sortOrder: group.sortOrder ?? 0,
        })),
      };
    }

    const menu = await prisma.menu.create({
      data: menuCreateData,
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
          },
          orderBy: [
            {
              sequenceNumber: "asc",
            },
          ],
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
    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error("Create menu API error:", error);
    return NextResponse.json(
      { error: "Failed to create menu." },
      { status: 500 }
    );
  }
}


