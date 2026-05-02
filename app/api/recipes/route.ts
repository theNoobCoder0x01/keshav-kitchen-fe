import { auth } from "@/lib/auth";
import { normalizeUnit } from "@/lib/constants/units";
import { prisma } from "@/lib/prisma";
import { sumCompatibleQuantities } from "@/lib/utils/unit-conversions";
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
            sequenceNumber: true,
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
    console.log(JSON.parse(JSON.stringify(recipes[0])));

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
      { status: 500 },
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
          preparedQuantity:
            data.preparedQuantity != null
              ? Number(data.preparedQuantity)
              : undefined,
          preparedQuantityUnit: data.preparedQuantityUnit
            ? normalizeUnit(data.preparedQuantityUnit)
            : undefined,
          servingQuantity:
            data.servingQuantity != null
              ? Number(data.servingQuantity)
              : undefined,
          servingQuantityUnit: data.servingQuantityUnit
            ? normalizeUnit(data.servingQuantityUnit)
            : undefined,
          quantityPerPiece:
            data.quantityPerPiece != null
              ? Number(data.quantityPerPiece)
              : undefined,
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
          quantity: Number(ingredient.quantity) || 0,
          unit: normalizeUnit(ingredient.unit),
          costPerUnit:
            ingredient.costPerUnit != null
              ? Number(ingredient.costPerUnit)
              : undefined,
          sequenceNumber:
            ingredient.sequenceNumber != null
              ? Number(ingredient.sequenceNumber)
              : null,
          groupId: finalGroupId,
        };
      });

      await tx.ingredient.createMany({
        data: ingredientData,
      });

      const aggregatedPreparedQuantity = sumCompatibleQuantities(
        ingredientData,
        {
          preferUnit: data.preparedQuantityUnit,
        },
      );

      if (aggregatedPreparedQuantity) {
        await tx.recipe.update({
          where: { id: newRecipe.id },
          data: {
            preparedQuantity: aggregatedPreparedQuantity.quantity,
            preparedQuantityUnit: aggregatedPreparedQuantity.unit,
          },
        });
      }

      // Return the complete recipe with relationships
      return await tx.recipe.findUnique({
        where: { id: newRecipe.id },
        include: {
          ingredients: {
            include: {
              group: true,
            },
            orderBy: [
              {
                sequenceNumber: "asc",
              },
            ],
          },
          ingredientGroups: {
            include: {
              ingredients: {
                orderBy: [
                  {
                    sequenceNumber: "asc",
                  },
                ],
              },
            },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      });
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Create recipe error:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 },
    );
  }
}
