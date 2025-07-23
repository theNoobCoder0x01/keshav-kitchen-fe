"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getRecipes() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
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
      orderBy: {
        name: "asc",
      },
    })

    return { success: true, data: recipes }
  } catch (error) {
    console.error("Get recipes error:", error)
    return { success: false, error: "Failed to fetch recipes" }
  }
}

export async function getRecipeById(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
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
            id: true,
            name: true,
          },
        },
        menus: {
          select: {
            id: true,
            date: true,
            mealType: true,
            servings: true,
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
    })

    if (!recipe) {
      return { success: false, error: "Recipe not found" }
    }

    return { success: true, data: recipe }
  } catch (error) {
    console.error("Get recipe by ID error:", error)
    return { success: false, error: "Failed to fetch recipe" }
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
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    costPerUnit?: number
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
          create: data.ingredients.map((ingredient) => ({
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
    console.error("Create recipe error:", error)
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
      costPerUnit?: number
    }>
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if recipe exists and user has permission
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.role !== "CHEF" && existingRecipe.userId !== session.user.id) {
      return { success: false, error: "Access denied" }
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
        create: data.ingredients.map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit,
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

    // Check if recipe exists and user has permission
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.role !== "CHEF" && existingRecipe.userId !== session.user.id) {
      return { success: false, error: "Access denied" }
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

export async function getRecipeStats() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const [totalRecipes, recipesByCategory, mostUsedRecipes, recentRecipes] = await Promise.all([
      prisma.recipe.count(),
      prisma.recipe.groupBy({
        by: ["category"],
        _count: {
          category: true,
        },
        orderBy: {
          _count: {
            category: "desc",
          },
        },
      }),
      prisma.recipe.findMany({
        select: {
          id: true,
          name: true,
          category: true,
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
      }),
      prisma.recipe.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ])

    return {
      success: true,
      data: {
        totalRecipes,
        recipesByCategory,
        mostUsedRecipes,
        recentRecipes,
      },
    }
  } catch (error) {
    console.error("Get recipe stats error:", error)
    return { success: false, error: "Failed to fetch recipe statistics" }
  }
}
