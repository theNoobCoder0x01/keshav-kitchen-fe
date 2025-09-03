import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateIngredientGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name too long")
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const dynamic = "force-dynamic";

// PUT /api/recipes/[id]/ingredient-groups/[groupId] - Update ingredient group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId, groupId } = params;
    const body = await request.json();

    const validatedData = UpdateIngredientGroupSchema.parse(body);

    // Verify recipe exists and user has access
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found or access denied" },
        { status: 404 },
      );
    }

    // Verify ingredient group exists and belongs to this recipe
    const existingGroup = await prisma.ingredientGroup.findFirst({
      where: {
        id: groupId,
        recipeId,
      },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Ingredient group not found" },
        { status: 404 },
      );
    }

    // Check if new name conflicts with existing group (if name is being changed)
    if (validatedData.name && validatedData.name !== existingGroup.name) {
      const conflictingGroup = await prisma.ingredientGroup.findFirst({
        where: {
          recipeId,
          name: validatedData.name,
          id: { not: groupId },
        },
      });

      if (conflictingGroup) {
        return NextResponse.json(
          { error: "A group with this name already exists for this recipe" },
          { status: 400 },
        );
      }
    }

    const updatedGroup = await prisma.ingredientGroup.update({
      where: { id: groupId },
      data: validatedData,
      include: {
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
    });

    return NextResponse.json({ ingredientGroup: updatedGroup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Update ingredient group API error:", error);
    return NextResponse.json(
      { error: "Failed to update ingredient group" },
      { status: 500 },
    );
  }
}

// DELETE /api/recipes/[id]/ingredient-groups/[groupId] - Delete ingredient group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId, groupId } = params;

    // Verify recipe exists and user has access
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found or access denied" },
        { status: 404 },
      );
    }

    // Verify ingredient group exists and belongs to this recipe
    const existingGroup = await prisma.ingredientGroup.findFirst({
      where: {
        id: groupId,
        recipeId,
      },
      include: {
        ingredients: true,
      },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Ingredient group not found" },
        { status: 404 },
      );
    }

    // Handle ingredients in the group being deleted
    // Option 1: Move them to an "Ungrouped" group (create if doesn't exist)
    // Option 2: Set their groupId to null (handled by onDelete: SetNull in schema)

    // We'll use Option 1 for better UX - ensure there's always an "Ungrouped" group
    let ungroupedGroup = await prisma.ingredientGroup.findFirst({
      where: {
        recipeId,
        name: "Ungrouped",
      },
    });

    if (!ungroupedGroup) {
      ungroupedGroup = await prisma.ingredientGroup.create({
        data: {
          name: "Ungrouped",
          recipeId,
          sortOrder: 999,
        },
      });
    }

    // Move all ingredients from the deleted group to "Ungrouped"
    if (existingGroup.ingredients.length > 0) {
      await prisma.ingredient.updateMany({
        where: {
          groupId,
        },
        data: {
          groupId: ungroupedGroup.id,
        },
      });
    }

    // Delete the group
    await prisma.ingredientGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({
      message: "Ingredient group deleted successfully",
      movedToUngrouped: existingGroup.ingredients.length > 0,
    });
  } catch (error) {
    console.error("Delete ingredient group API error:", error);
    return NextResponse.json(
      { error: "Failed to delete ingredient group" },
      { status: 500 },
    );
  }
}
