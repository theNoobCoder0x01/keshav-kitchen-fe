import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: {
        id,
      },
      include: {
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
          orderBy: [
            {
              quantity: "desc",
            },
            {
              name: "asc",
            },
          ],
        },
        ingredientGroups: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
            ingredients: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unit: true,
                costPerUnit: true,
              },
              orderBy: [
                {
                  name: "asc",
                },
              ],
            },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            menus: true,
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Get recipe by ID API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if recipe exists and user has permission to delete it
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: {
        userId: true,
        name: true,
      },
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Delete the recipe (ingredients will be deleted automatically due to cascade)
    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Delete recipe API error:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      instructions,
      preparedQuantity,
      preparedQuantityUnit,
      servingQuantity,
      servingQuantityUnit,
      quantityPerPiece,
      category,
      subcategory,
      ingredients,
    } = body || {};

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existingRecipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Update core fields
    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(ingredients)) {
        await tx.ingredient.deleteMany({ where: { recipeId: id } });
        if (ingredients.length > 0) {
          await tx.ingredient.createMany({
            data: ingredients.map((ing: any) => ({
              recipeId: id,
              name: ing.name,
              quantity: Number(ing.quantity) || 0,
              unit: ing.unit,
              costPerUnit:
                ing.costPerUnit != null ? Number(ing.costPerUnit) : null,
            })),
          });
        }
      }

      const recipe = await tx.recipe.update({
        where: { id },
        data: {
          name,
          description,
          instructions,
          preparedQuantity:
            preparedQuantity != null ? Number(preparedQuantity) : undefined,
          preparedQuantityUnit,
          servingQuantity:
            servingQuantity != null ? Number(servingQuantity) : undefined,
          servingQuantityUnit,
          quantityPerPiece:
            quantityPerPiece != null ? Number(quantityPerPiece) : undefined,
          category,
          subcategory,
        },
        include: { ingredients: true },
      });
      return recipe;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Patch recipe API error:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}
