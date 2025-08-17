import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const AssignIngredientGroupSchema = z.object({
  ingredientId: z.string().cuid("Invalid ingredient ID"),
  groupId: z.string().cuid("Invalid group ID").nullable(),
  recipeId: z.string().cuid("Invalid recipe ID"),
});

const BulkAssignSchema = z.object({
  ingredientIds: z.array(z.string().cuid("Invalid ingredient ID")),
  groupId: z.string().cuid("Invalid group ID").nullable(),
  recipeId: z.string().cuid("Invalid recipe ID"),
});

export const dynamic = "force-dynamic";

// POST /api/ingredients/assign-group - Assign ingredient to group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = AssignIngredientGroupSchema.parse(body);

    // Verify recipe exists and user has access
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: validatedData.recipeId,
        userId: session.user.id,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found or access denied" },
        { status: 404 }
      );
    }

    // Verify ingredient exists and belongs to this recipe
    const ingredient = await prisma.ingredient.findFirst({
      where: {
        id: validatedData.ingredientId,
        recipeId: validatedData.recipeId,
      },
    });

    if (!ingredient) {
      return NextResponse.json(
        { error: "Ingredient not found or doesn't belong to this recipe" },
        { status: 404 }
      );
    }

    // If groupId is provided, verify the group exists and belongs to this recipe
    if (validatedData.groupId) {
      const group = await prisma.ingredientGroup.findFirst({
        where: {
          id: validatedData.groupId,
          recipeId: validatedData.recipeId,
        },
      });

      if (!group) {
        return NextResponse.json(
          { error: "Ingredient group not found or doesn't belong to this recipe" },
          { status: 404 }
        );
      }
    }

    // Update ingredient's group assignment
    const updatedIngredient = await prisma.ingredient.update({
      where: { id: validatedData.ingredientId },
      data: { groupId: validatedData.groupId },
      include: {
        group: true,
      },
    });

    return NextResponse.json({ 
      ingredient: updatedIngredient,
      message: validatedData.groupId 
        ? `Ingredient assigned to group successfully`
        : `Ingredient unassigned from group successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Assign ingredient to group API error:", error);
    return NextResponse.json(
      { error: "Failed to assign ingredient to group" },
      { status: 500 }
    );
  }
}

// PUT /api/ingredients/assign-group - Bulk assign ingredients to group
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BulkAssignSchema.parse(body);

    // Verify recipe exists and user has access
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: validatedData.recipeId,
        userId: session.user.id,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found or access denied" },
        { status: 404 }
      );
    }

    // Verify all ingredients exist and belong to this recipe
    const ingredients = await prisma.ingredient.findMany({
      where: {
        id: { in: validatedData.ingredientIds },
        recipeId: validatedData.recipeId,
      },
    });

    if (ingredients.length !== validatedData.ingredientIds.length) {
      return NextResponse.json(
        { error: "One or more ingredients not found or don't belong to this recipe" },
        { status: 404 }
      );
    }

    // If groupId is provided, verify the group exists and belongs to this recipe
    if (validatedData.groupId) {
      const group = await prisma.ingredientGroup.findFirst({
        where: {
          id: validatedData.groupId,
          recipeId: validatedData.recipeId,
        },
      });

      if (!group) {
        return NextResponse.json(
          { error: "Ingredient group not found or doesn't belong to this recipe" },
          { status: 404 }
        );
      }
    }

    // Bulk update ingredients' group assignment
    const updateResult = await prisma.ingredient.updateMany({
      where: {
        id: { in: validatedData.ingredientIds },
      },
      data: {
        groupId: validatedData.groupId,
      },
    });

    return NextResponse.json({ 
      updatedCount: updateResult.count,
      message: validatedData.groupId 
        ? `${updateResult.count} ingredients assigned to group successfully`
        : `${updateResult.count} ingredients unassigned from groups successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Bulk assign ingredients to group API error:", error);
    return NextResponse.json(
      { error: "Failed to assign ingredients to group" },
      { status: 500 }
    );
  }
}