"use server"

import { revalidatePath } from "next/cache"
import prisma from "../prisma"
import { auth } from "../auth"
import { z } from "zod"
import { recipeSchema } from "../validations/recipe"

export async function getRecipes() {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true,
        user: {
          select: {
            id: true,
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
    })

    return { success: true, data: recipes }
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return { success: false, error: "Failed to fetch recipes" }
  }
}

export async function getRecipeById(id: string) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        menus: {
          include: {
            kitchen: true,
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

export async function createRecipe(data: z.infer<typeof recipeSchema>) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Validate data
    const validatedData = recipeSchema.parse(data)

    // Create recipe with ingredients
    const recipe = await prisma.recipe.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        instructions: validatedData.instructions,
        prepTime: validatedData.prepTime,
        cookTime: validatedData.cookTime,
        servings: validatedData.servings,
        category: validatedData.category,
        userId: session.user.id,
        ingredients: {
          create: validatedData.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
          })),
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
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create recipe" }
  }
}

export async function updateRecipe(id: string, data: z.infer<typeof recipeSchema>) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Validate data
    const validatedData = recipeSchema.parse(data)

    // Get the current recipe
    const currentRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
      },
    })

    if (!currentRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    // Check if user has permission to update this recipe
    if (session.user.role !== "ADMIN" && session.user.id !== currentRecipe.userId) {
      throw new Error("Unauthorized to update this recipe")
    }

    // Delete existing ingredients and create new ones
    await prisma.ingredient.deleteMany({
      where: {
        recipeId: id,
      },
    })

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        instructions: validatedData.instructions,
        prepTime: validatedData.prepTime,
        cookTime: validatedData.cookTime,
        servings: validatedData.servings,
        category: validatedData.category,
        ingredients: {
          create: validatedData.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
          })),
        },
      },
      include: {
        ingredients: true,
      },
    })

    revalidatePath("/recipes")
    return { success: true, data: recipe }
  } catch (error) {
    console.error("Error updating recipe:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update recipe" }
  }
}

export async function deleteRecipe(id: string) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Get the current recipe
    const currentRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            menus: true,
          },
        },
      },
    })

    if (!currentRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    // Check if user has permission to delete this recipe
    if (session.user.role !== "ADMIN" && session.user.id !== currentRecipe.userId) {
      throw new Error("Unauthorized to delete this recipe")
    }

    // Check if recipe is used in any menus
    if (currentRecipe._count.menus > 0) {
      return {
        success: false,
        error: "Cannot delete recipe that is used in menus",
      }
    }

    // Delete recipe and its ingredients (cascade)
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
