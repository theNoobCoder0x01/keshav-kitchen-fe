"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  servings?: number;
  category: string;
  subcategory: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    costPerUnit?: number;
  }>;
}) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const recipe = await prisma.recipe.create({
      data: {
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        servings: data.servings,
        category: data.category,
        subcategory: data.subcategory,
        userId: session.user.id,
        ingredients: {
          create: data.ingredients,
        },
      },
      include: {
        ingredients: true,
      },
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
    servings?: number;
    category?: string;
    subcategory?: string;
    ingredients?: Array<{
      id?: string;
      name: string;
      quantity: number;
      unit: string;
      costPerUnit?: number;
    }>;
  },
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

    if (
      existingRecipe.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      throw new Error("Unauthorized to update this recipe");
    }

    const updateData = {
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      servings: data.servings,
      category: data.category,
      subcategory: data.subcategory,
    };

    if (data.ingredients) {
      await prisma.ingredient.deleteMany({
        where: { recipeId: id },
      });
      await prisma.ingredient.createMany({
        data: data.ingredients.map((ingredient) => ({
          recipeId: id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit,
        })),
      });
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
      include: {
        ingredients: true,
      },
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

    if (
      existingRecipe.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      throw new Error("Unauthorized to delete this recipe");
    }

    if (existingRecipe._count.menus > 0) {
      throw new Error(
        "Cannot delete recipe that is part of a menu. Remove it from all menus first.",
      );
    }

    await prisma.recipe.delete({
      where: { id },
    });

    revalidatePath("/recipes");
  } catch (error) {
    console.error("Delete recipe error:", error);
    throw error;
  }
}

export async function getRecipeById(id: string) {
  try {
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
