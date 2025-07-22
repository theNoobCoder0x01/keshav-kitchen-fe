"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getRecipes(userId?: string) {
  try {
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        ingredients: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        menus: {
          select: {
            id: true,
            date: true,
            mealType: true,
            servings: true,
          },
        },
        _count: {
          select: {
            ingredients: true,
            menus: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return recipes
  } catch (error) {
    console.error("Error fetching recipes:", error)
    throw new Error("Failed to fetch recipes")
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
            role: true,
          },
        },
        menus: {
          include: {
            kitchen: {
              select: {
                name: true,
                location: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    })

    return recipe
  } catch (error) {
    console.error("Error fetching recipe:", error)
    throw new Error("Failed to fetch recipe")
  }
}

export async function createRecipe(data: {
  name: string
  description?: string
  instructions?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  category?: string
  userId: string
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    costPerUnit?: number
  }>
}) {
  try {
    const recipe = await prisma.recipe.create({
      data: {
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        category: data.category,
        userId: data.userId,
        ingredients: {
          create: data.ingredients,
        },
      },
      include: {
        ingredients: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath("/recipes")
    return recipe
  } catch (error) {
    console.error("Error creating recipe:", error)
    throw new Error("Failed to create recipe")
  }
}

export async function updateRecipe(
  id: string,
  data: {
    name?: string
    description?: string
    instructions?: string
    prepTime?: number
    cookTime?: number
    servings?: number
    category?: string
    ingredients?: Array<{
      id?: string
      name: string
      quantity: number
      unit: string
      costPerUnit?: number
    }>
  },
) {
  try {
    const updateData: any = {
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      category: data.category,
    }

    if (data.ingredients) {
      // Delete existing ingredients and create new ones
      await prisma.ingredient.deleteMany({
        where: { recipeId: id },
      })

      updateData.ingredients = {
        create: data.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          costPerUnit: ing.costPerUnit,
        })),
      }
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
      include: {
        ingredients: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath("/recipes")
    return recipe
  } catch (error) {
    console.error("Error updating recipe:", error)
    throw new Error("Failed to update recipe")
  }
}

export async function deleteRecipe(id: string) {
  try {
    await prisma.recipe.delete({
      where: { id },
    })

    revalidatePath("/recipes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting recipe:", error)
    throw new Error("Failed to delete recipe")
  }
}

export async function getRecipeStats() {
  try {
    const totalRecipes = await prisma.recipe.count()

    const recipesByCategory = await prisma.recipe.groupBy({
      by: ["category"],
      _count: {
        category: true,
      },
    })

    const avgPrepTime = await prisma.recipe.aggregate({
      _avg: {
        prepTime: true,
        cookTime: true,
        servings: true,
      },
    })

    const mostUsedRecipes = await prisma.recipe.findMany({
      include: {
        _count: {
          select: {
            menus: true,
          },
        },
      },
      orderBy: {
        menus: {
          _count: "desc",
        },
      },
      take: 5,
    })

    return {
      totalRecipes,
      recipesByCategory,
      avgPrepTime,
      mostUsedRecipes,
    }
  } catch (error) {
    console.error("Error fetching recipe stats:", error)
    throw new Error("Failed to fetch recipe stats")
  }
}
