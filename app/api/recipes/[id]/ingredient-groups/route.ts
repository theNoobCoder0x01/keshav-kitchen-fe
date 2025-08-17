import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IngredientGroupInput } from "@/types/recipes";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const IngredientGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Group name too long"),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const dynamic = "force-dynamic";

// GET /api/recipes/[id]/ingredient-groups - Get all ingredient groups for a recipe
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;

    // Verify recipe exists and user has access
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        userId: session.user.id,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found or access denied" },
        { status: 404 }
      );
    }

    const ingredientGroups = await prisma.ingredientGroup.findMany({
      where: {
        recipeId,
      },
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ ingredientGroups });
  } catch (error) {
    console.error("Get ingredient groups API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingredient groups" },
      { status: 500 }
    );
  }
}

// POST /api/recipes/[id]/ingredient-groups - Create new ingredient group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipeId = params.id;
    const body = await request.json();
    
    const validatedData = IngredientGroupSchema.parse(body);

    // Verify recipe exists and user has access
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        userId: session.user.id,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found or access denied" },
        { status: 404 }
      );
    }

    // Check if group name already exists for this recipe
    const existingGroup = await prisma.ingredientGroup.findFirst({
      where: {
        recipeId,
        name: validatedData.name,
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: "A group with this name already exists for this recipe" },
        { status: 400 }
      );
    }

    const ingredientGroup = await prisma.ingredientGroup.create({
      data: {
        name: validatedData.name,
        sortOrder: validatedData.sortOrder,
        recipeId,
      },
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
          },
        },
      },
    });

    return NextResponse.json({ ingredientGroup }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create ingredient group API error:", error);
    return NextResponse.json(
      { error: "Failed to create ingredient group" },
      { status: 500 }
    );
  }
}