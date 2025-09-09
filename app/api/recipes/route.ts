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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { subcategory: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (subcategory && subcategory !== "all") {
      where.subcategory = { equals: subcategory, mode: "insensitive" };
    }

    // Get total count for pagination
    const totalCount = await prisma.recipe.count({ where });

    const recipes = await prisma.recipe.findMany({
      where,
      skip,
      take: limit,
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
            createdAt: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                sortOrder: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
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
                  quantity: "desc",
                },
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
      orderBy: [
        {
          category: "asc",
        },
        {
          subcategory: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      recipes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get recipes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const data = await request.json();

    const recipe = await prisma.$transaction(async (tx) => {
      // Create the recipe first
      const newRecipe = await tx.recipe.create({
        data: {
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          preparedQuantity: data.preparedQuantity,
          preparedQuantityUnit: data.preparedQuantityUnit,
          servingQuantity: data.servingQuantity,
          servingQuantityUnit: data.servingQuantityUnit,
          quantityPerPiece: data.quantityPerPiece,
          category: data.category,
          subcategory: data.subcategory,
          userId: session.user.id,
        },
      });

      // Create ingredient groups if provided
      const groupIdMap = new Map<string, string>();
      if (data.ingredientGroups) {
        for (const group of data.ingredientGroups) {
          const createdGroup = await tx.ingredientGroup.create({
            data: {
              name: group.name,
              sortOrder: group.sortOrder,
              recipeId: newRecipe.id,
            },
          });
          if (group.id) {
            groupIdMap.set(group.id, createdGroup.id);
          }
        }
      }

      // Create ingredients with proper group assignments
      const ingredientData = data.ingredients.map((ingredient: any) => {
        let finalGroupId = null;

        if (ingredient.groupId) {
          // If groupId is a temp ID, map it to the real ID
          if (groupIdMap.has(ingredient.groupId)) {
            finalGroupId = groupIdMap.get(ingredient.groupId);
          } else {
            finalGroupId = ingredient.groupId;
          }
        }

        return {
          recipeId: newRecipe.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit ?? undefined,
          groupId: finalGroupId,
        };
      });

      await tx.ingredient.createMany({
        data: ingredientData,
      });

      // Calculate preparedQuantity as sum of ingredient quantities
      const totalQuantity = ingredientData.reduce((sum: number, ing: any) => sum + (Number(ing.quantity) || 0), 0);

      // Update the recipe with calculated preparedQuantity
      await tx.recipe.update({
        where: { id: newRecipe.id },
        data: {
          preparedQuantity: totalQuantity,
          preparedQuantityUnit: ingredientData.length > 0 ? ingredientData[0].unit : data.preparedQuantityUnit,
        },
      });

      // Return the complete recipe with relationships
      return await tx.recipe.findUnique({
        where: { id: newRecipe.id },
        include: {
          ingredients: {
            include: {
              group: true,
            },
          },
          ingredientGroups: {
            include: {
              ingredients: true,
            },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      });
    });

    return recipe;
  } catch (error) {
    console.error("Create recipe error:", error);
    throw error;
  }
}
