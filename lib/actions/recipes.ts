"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getRecipes() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true,
        user: {
          select: {
            name: true,
            role: true,
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
    })

    return { success: true, data: recipes }
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return { success: false, error: "Failed to fetch recipes" }
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
            role: true,
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
          take: 5,
        },
      },
    })

    if (!recipe) {
      return { success: false, error: "Recipe not found" }
    }

    return { success: true, data: recipe }
  } catch (error) {
    console.error("Error fetching recipe:", error)
    return { success: false, error: "Failed to fetch recipe" }
  }
}

export async function createRecipe(data: {
  name: string
  description: string
  instructions: string
  prepTime: number
  cookTime: number
  servings: number
  category?: string
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    costPerUnit: number
  }>
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
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
    })

    revalidatePath("/recipes")
    return { success: true, data: recipe }
  } catch (error) {
    console.error("Error creating recipe:", error)
    return { success: false, error: "Failed to create recipe" }
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
      costPerUnit: number
    }>
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the recipe to check permissions
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    })

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && existingRecipe.userId !== session.user.id) {
      return { success: false, error: "Unauthorized to edit this recipe" }
    }

    const updateData: any = {
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      category: data.category,
    }

    // Handle ingredients update if provided
    if (data.ingredients) {
      // Delete existing ingredients and create new ones
      updateData.ingredients = {
        deleteMany: {},
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
      },
    })

    revalidatePath("/recipes")
    return { success: true, data: recipe }
  } catch (error) {
    console.error("Error updating recipe:", error)
    return { success: false, error: "Failed to update recipe" }
  }
}

export async function deleteRecipe(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the recipe to check permissions
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    })

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && existingRecipe.userId !== session.user.id) {
      return { success: false, error: "Unauthorized to delete this recipe" }
    }

    // Check if recipe is used in any menus
    const menuCount = await prisma.menu.count({
      where: { recipeId: id },
    })

    if (menuCount > 0) {
      return { success: false, error: "Cannot delete recipe that is used in menus" }
    }

    await prisma.recipe.delete({
      where: { id },
    })

    revalidatePath("/recipes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting recipe:", error)
    return { success: false, error: "Failed to delete recipe" }
  }
}

export async function getRecipesByCategory() {
  try {
    const recipes = await prisma.recipe.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
    })

    return { success: true, data: recipes }
  } catch (error) {
    console.error("Error fetching recipes by category:", error)
    return { success: false, error: "Failed to fetch recipes by category" }
  }
}

export async function calculateRecipeCost(recipeId: string, servings?: number) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: true,
      },
    })

    if (!recipe) {
      return { success: false, error: "Recipe not found" }
    }

    const totalCost = recipe.ingredients.reduce((sum, ingredient) => {
      return sum + ingredient.quantity * ingredient.costPerUnit
    }, 0)

    const targetServings = servings || recipe.servings
    const costPerServing = totalCost / recipe.servings
    const totalCostForServings = costPerServing * targetServings

    return {
      success: true,
      data: {
        totalCost,
        costPerServing,
        targetServings,
        totalCostForServings,
        ingredients: recipe.ingredients.map((ing) => ({
          ...ing,
          totalCost: ing.quantity * ing.costPerUnit,
        })),
      },
    }
  } catch (error) {
    console.error("Error calculating recipe cost:", error)
    return { success: false, error: "Failed to calculate recipe cost" }
  }
}
