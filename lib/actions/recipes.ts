"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  category?: string;
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
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        category: data.category,
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
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    category?: string;
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

    // Check if user owns this recipe or is admin
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
      throw new Error("Access denied");
    }

    const updateData: any = {
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      category: data.category,
    };

    // Handle ingredients update if provided
    if (data.ingredients) {
      // Delete existing ingredients and create new ones
      await prisma.ingredient.deleteMany({
        where: { recipeId: id },
      });

      updateData.ingredients = {
        create: data.ingredients.map(({ id, ...ingredient }) => ingredient),
      };
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
      include: {
        ingredients: true,
      },
    });

    revalidatePath("/recipes");
    return recipe;
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

    // Check if user owns this recipe or is admin
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: { userId: true },
      include: {
        _count: {
          select: {
            menus: true,
          },
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
      throw new Error("Access denied");
    }

    if (existingRecipe._count.menus > 0) {
      throw new Error("Cannot delete recipe that is used in menus");
    }

    await prisma.recipe.delete({
      where: { id },
    });

    revalidatePath("/recipes");
    return { success: true };
  } catch (error) {
    console.error("Delete recipe error:", error);
    throw error;
  }
}
