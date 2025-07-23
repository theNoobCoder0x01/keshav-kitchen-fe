"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getRecipes() {
  try {
    const session = await auth()

    if (!session?.user) {
      return []
    }

    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            menus: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return recipes
  } catch (error) {
    console.error("Get recipes error:", error)
    return []
  }
}

export async function getRecipe(id: string) {
  try {
    const session = await auth()

    if (!session?.user) {
      return null
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return recipe
  } catch (error) {
    console.error("Get recipe error:", error)
    return null
  }
}

export async function createRecipe(formData: FormData) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const instructions = formData.get("instructions") as string
    const prepTime = Number.parseInt(formData.get("prepTime") as string) || null
    const cookTime = Number.parseInt(formData.get("cookTime") as string) || null
    const servings = Number.parseInt(formData.get("servings") as string) || null
    const category = formData.get("category") as string

    // Parse ingredients from form data
    const ingredientsData = formData.get("ingredients") as string
    let ingredients = []

    try {
      ingredients = JSON.parse(ingredientsData || "[]")
    } catch (e) {
      return { success: false, error: "Invalid ingredients format" }
    }

    if (!name?.trim()) {
      return { success: false, error: "Recipe name is required" }
    }

    const recipe = await prisma.recipe.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        instructions: instructions?.trim() || null,
        prepTime,
        cookTime,
        servings,
        category: category?.trim() || null,
        userId: session.user.id,
        ingredients: {
          create: ingredients.map((ing: any) => ({
            name: ing.name,
            quantity: Number.parseFloat(ing.quantity),
            unit: ing.unit,
            costPerUnit: Number.parseFloat(ing.costPerUnit) || 0,
          })),
        },
      },
      include: {
        ingredients: true,
      },
    })

    revalidatePath("/recipes")
    return { success: true, recipe }
  } catch (error) {
    console.error("Create recipe error:", error)
    return { success: false, error: "Failed to create recipe" }
  }
}

export async function updateRecipe(id: string, formData: FormData) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const instructions = formData.get("instructions") as string
    const prepTime = Number.parseInt(formData.get("prepTime") as string) || null
    const cookTime = Number.parseInt(formData.get("cookTime") as string) || null
    const servings = Number.parseInt(formData.get("servings") as string) || null
    const category = formData.get("category") as string

    const ingredientsData = formData.get("ingredients") as string
    let ingredients = []

    try {
      ingredients = JSON.parse(ingredientsData || "[]")
    } catch (e) {
      return { success: false, error: "Invalid ingredients format" }
    }

    if (!name?.trim()) {
      return { success: false, error: "Recipe name is required" }
    }

    // Update recipe and replace ingredients
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        instructions: instructions?.trim() || null,
        prepTime,
        cookTime,
        servings,
        category: category?.trim() || null,
        ingredients: {
          deleteMany: {},
          create: ingredients.map((ing: any) => ({
            name: ing.name,
            quantity: Number.parseFloat(ing.quantity),
            unit: ing.unit,
            costPerUnit: Number.parseFloat(ing.costPerUnit) || 0,
          })),
        },
      },
      include: {
        ingredients: true,
      },
    })

    revalidatePath("/recipes")
    return { success: true, recipe }
  } catch (error) {
    console.error("Update recipe error:", error)
    return { success: false, error: "Failed to update recipe" }
  }
}

export async function deleteRecipe(id: string) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
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
    console.error("Delete recipe error:", error)
    return { success: false, error: "Failed to delete recipe" }
  }
}
