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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const kitchenId = searchParams.get("kitchenId");
    const date = searchParams.get("date");

    if (id) {
      const menu = await prisma.menu.findUnique({
        where: { id },
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
              groupId: true,
              group: {
                select: {
                  id: true,
                  name: true,
                  sortOrder: true,
                },
              },
            },
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
      if (!menu)
        return NextResponse.json({ error: "Menu not found." }, { status: 404 });
      return NextResponse.json(menu);
    }

    // Build where clause for filtering
    const where: any = {};

    if (kitchenId) {
      where.kitchenId = kitchenId;
    }

    if (date) {
      // Parse date string and create UTC day boundaries for database queries
      const targetDate = parseISOString(date);
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
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                sortOrder: true,
              },
            },
          },
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
      { status: 500 },
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
        { status: 400 },
      );
    }

    // Ensure date is properly formatted (parse to UTC Date for storage)
    if (data.date) {
      data.date = parseISOString(data.date.toString());
    }

    // Extract ingredients from data
    const { ingredients, ...menuData } = data;

    const menu = await prisma.menu.create({
      data: {
        ...menuData,
        ingredients: {
          create:
            ingredients?.map((ingredient: any) => ({
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              costPerUnit: ingredient.costPerUnit,
            })) || [],
        },
      },
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
    });
    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error("Create menu API error:", error);
    return NextResponse.json(
      { error: "Failed to create menu." },
      { status: 500 },
    );
  }
}

// PUT update menu by id (via ?id=)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Menu id required." }, { status: 400 });

    const data = await request.json();

    // Extract ingredients from data
    const { ingredients, ...menuData } = data;

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        ...menuData,
        ingredients: ingredients
          ? {
              deleteMany: {}, // Delete existing ingredients
              create: ingredients.map((ingredient: any) => ({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                costPerUnit: ingredient.costPerUnit,
              })),
            }
          : undefined,
      },
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
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                sortOrder: true,
              },
            },
          },
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

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Update menu API error:", error);
    return NextResponse.json(
      { error: "Failed to update menu." },
      { status: 400 },
    );
  }
}

// DELETE menu by id (via ?id=)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Menu id required." }, { status: 400 });
    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ message: "Menu deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete menu." },
      { status: 400 },
    );
  }
}
