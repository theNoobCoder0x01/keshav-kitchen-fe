import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET menu by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    if (!menu) {
      return NextResponse.json({ error: "Menu not found." }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu." },
      { status: 500 }
    );
  }
}

// PUT/PATCH update menu by id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const data = await request.json();

    // Extract ingredients and deletedIngredientGroupIds from data
    const { ingredients, deletedIngredientGroupIds, ingredientGroups, ...menuData } = data;

    // If there are ingredient group IDs to delete, handle them first
    if (
      deletedIngredientGroupIds &&
      Array.isArray(deletedIngredientGroupIds) &&
      deletedIngredientGroupIds.length > 0
    ) {
      await prisma.menuIngredientGroup.deleteMany({
        where: {
          id: { in: deletedIngredientGroupIds },
          menuId: id,
        },
      });
    }

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
                sequenceNumber: ingredient.sequenceNumber ?? null,
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

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Update menu API error:", error);
    return NextResponse.json(
      { error: "Failed to update menu." },
      { status: 400 }
    );
  }
}

// DELETE menu by id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ message: "Menu deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete menu." },
      { status: 400 }
    );
  }
}
