"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getRecipes() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: true,
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
      createdAt: "desc",
    },
  })

  return recipes
}

export async function getRecipe(id: string) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
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
          kitchen: true,
        },
        orderBy: {
          date: "desc",
        },
        take: 10,
      },
    },
  })

  return recipe
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
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

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
    return { success: true, recipe }
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
      costPerUnit?: number
    }>
  },
) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  try {
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: true },
    })

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    // Check permissions
    if (existingRecipe.userId !== session.user.id && session.user.role !== "ADMIN") {
      throw new Error("You can only update your own recipes")
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        category: data.category,
        ...(data.ingredients && {
          ingredients: {
            deleteMany: {},
            create: data.ingredients.map((ing) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              costPerUnit: ing.costPerUnit,
            })),
          },
        }),
      },
      include: {
        ingredients: true,
      },
    })

    revalidatePath("/recipes")
    return { success: true, recipe }
  } catch (error) {
    console.error("Error updating recipe:", error)
    return { success: false, error: "Failed to update recipe" }
  }
}

export async function deleteRecipe(id: string) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  try {
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    })

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    // Check permissions
    if (existingRecipe.userId !== session.user.id && session.user.role !== "ADMIN") {
      throw new Error("You can only delete your own recipes")
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

export async function getRecipeStats() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const [totalRecipes, myRecipes, totalIngredients, avgCookTime] = await Promise.all([
    prisma.recipe.count(),
    prisma.recipe.count({
      where: { userId: session.user.id },
    }),
    prisma.ingredient.count(),
    prisma.recipe.aggregate({
      _avg: {
        cookTime: true,
      },
    }),
  ])

  return {
    totalRecipes,
    myRecipes,
    totalIngredients,
    avgCookTime: Math.round(avgCookTime._avg.cookTime || 0),
  }
}
