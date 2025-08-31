"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import type {
  RecipeIngredientBase,
  RecipeIngredientInput,
} from "@/types/recipes";

export async function getRecipes() {
  try {
    const session = await auth();

    if (!session?.user) {
      return [];
    }

    const recipes = await prisma.recipe.findMany({
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
      orderBy: {
        name: "asc",
      },
    });

    return recipes;
  } catch (error) {
    console.error("Get recipes error:", error);
    return [];
  }
}

export async function getRecipe(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        menus: {
          include: {
            kitchen: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
          take: 10,
        },
      },
    });

    return recipe;
  } catch (error) {
    console.error("Get recipe error:", error);
    throw error;
  }
}

export async function createRecipe(data: {
  name: string;
  description?: string;
  instructions?: string;
  preparedQuantity?: number;
  preparedQuantityUnit?: string;
  category: string;
  subcategory: string;
  ingredients: (RecipeIngredientInput & { groupId?: string | null })[];
  ingredientGroups?: Array<{
    id?: string;
    name: string;
    sortOrder: number;
  }>;
}) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const recipe = await prisma.$transaction(async (tx) => {
      // Create the recipe first
      const newRecipe = await tx.recipe.create({
        data: {
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          preparedQuantity: data.preparedQuantity,
          preparedQuantityUnit: data.preparedQuantityUnit,
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
      const ingredientData = data.ingredients.map((ingredient) => {
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

    revalidatePath("/recipes");
    return recipe;
  } catch (error) {
    console.error("Create recipe error:", error);
    throw error;
  }
}

export async function updateRecipe(
  id: string,
  data: {
    name?: string;
    description?: string;
    instructions?: string;
    preparedQuantity?: number;
    preparedQuantityUnit?: string;
    category?: string;
    subcategory?: string;
    ingredients?: (RecipeIngredientBase & { groupId?: string | null })[];
    ingredientGroups?: Array<{
      id?: string;
      name: string;
      sortOrder: number;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingRecipe) {
      throw new Error("Recipe not found");
    }

    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // Update basic recipe data
      const updateData = {
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        preparedQuantity: data.preparedQuantity,
        preparedQuantityUnit: data.preparedQuantityUnit,
        category: data.category,
        subcategory: data.subcategory,
      };

      await tx.recipe.update({
        where: { id },
        data: updateData,
      });

      // Handle ingredient groups and ingredients if provided
      if (data.ingredients !== undefined) {
        // Delete existing ingredients and groups
        await tx.ingredient.deleteMany({
          where: { recipeId: id },
        });
        await tx.ingredientGroup.deleteMany({
          where: { recipeId: id },
        });

        // Create new ingredient groups if provided
        const groupIdMap = new Map<string, string>();
        if (data.ingredientGroups) {
          for (const group of data.ingredientGroups) {
            const createdGroup = await tx.ingredientGroup.create({
              data: {
                name: group.name,
                sortOrder: group.sortOrder,
                recipeId: id,
              },
            });
            if (group.id) {
              groupIdMap.set(group.id, createdGroup.id);
            }
          }
        }

        // Create new ingredients with proper group assignments
        const ingredientData = data.ingredients.map((ingredient) => {
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
            recipeId: id,
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
      }

      // Return the complete updated recipe with relationships
      return await tx.recipe.findUnique({
        where: { id },
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

    revalidatePath("/recipes");
    return updatedRecipe;
  } catch (error) {
    console.error("Update recipe error:", error);
    throw error;
  }
}

export async function deleteRecipe(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        _count: {
          select: { menus: true },
        },
      },
    });

    if (!existingRecipe) {
      throw new Error("Recipe not found");
    }

    if (existingRecipe._count.menus > 0) {
      throw new Error("Cannot delete recipe with existing menus");
    }

    const recipe = await prisma.recipe.delete({
      where: { id },
    });

    revalidatePath("/recipes");
    return recipe;
  } catch (error) {
    console.error("Delete recipe error:", error);
    throw error;
  }
}

export async function getRecipeById(request: Request, id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        menus: {
          select: {
            id: true,
            date: true,
            mealType: true,
            kitchen: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
          take: 10,
        },
      },
    });
    return recipe;
  } catch (error) {
    console.error("Get recipe by ID error:", error);
    throw error;
  }
}
