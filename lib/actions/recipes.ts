"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const IngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0.01),
  unit: z.string().min(1),
  costPerUnit: z.number().min(0).optional(),
})

const RecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  instructions: z.string().min(1),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  servings: z.number().min(1),
  category: z.string().optional(),
  ingredients: z.array(IngredientSchema).min(1),
})

export async function getRecipes() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const recipes = await prisma.recipe.findMany({
    where: {
      user: {
        kitchenId: session.user.kitchenId,
      },
    },
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
      createdAt: "desc",
    },
  })

  return recipes
}

export async function getRecipe(id: string) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      user: {
        kitchenId: session.user.kitchenId,
      },
    },
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
          role: true,
        },
      },
      menus: {
        select: {
          id: true,
          date: true,
          mealType: true,
          servings: true,
          status: true,
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

  return recipe
}

export async function createRecipe(data: z.infer<typeof RecipeSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedData = RecipeSchema.parse(data)

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
        create: validatedData.ingredients,
      },
    },
    include: {
      ingredients: true,
    },
  })

  revalidatePath("/recipes")
  return recipe
}

export async function updateRecipe(id: string, data: z.infer<typeof RecipeSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedData = RecipeSchema.parse(data)

  // Check if user owns the recipe or has admin/manager role
  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      user: {
        kitchenId: session.user.kitchenId,
      },
    },
  })

  if (!recipe) {
    throw new Error("Recipe not found or unauthorized")
  }

  if (recipe.userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  const updatedRecipe = await prisma.recipe.update({
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
        deleteMany: {},
        create: validatedData.ingredients,
      },
    },
    include: {
      ingredients: true,
    },
  })

  revalidatePath("/recipes")
  return updatedRecipe
}

export async function deleteRecipe(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if user owns the recipe or has admin/manager role
  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      user: {
        kitchenId: session.user.kitchenId,
      },
    },
  })

  if (!recipe) {
    throw new Error("Recipe not found or unauthorized")
  }

  if (recipe.userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  // Check if recipe is used in any menus
  const menuCount = await prisma.menu.count({
    where: { recipeId: id },
  })

  if (menuCount > 0) {
    throw new Error("Cannot delete recipe that is used in menus")
  }

  await prisma.recipe.delete({
    where: { id },
  })

  revalidatePath("/recipes")
}

export async function getRecipeStats() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const [totalRecipes, myRecipes, avgCost, mostUsed] = await Promise.all([
    prisma.recipe.count({
      where: {
        user: {
          kitchenId: session.user.kitchenId,
        },
      },
    }),
    prisma.recipe.count({
      where: {
        userId: session.user.id,
      },
    }),
    prisma.ingredient.aggregate({
      where: {
        recipe: {
          user: {
            kitchenId: session.user.kitchenId,
          },
        },
      },
      _avg: {
        costPerUnit: true,
      },
    }),
    prisma.recipe.findMany({
      where: {
        user: {
          kitchenId: session.user.kitchenId,
        },
      },
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
      take: 1,
    }),
  ])

  return {
    totalRecipes,
    myRecipes,
    avgIngredientCost: Math.round((avgCost._avg.costPerUnit || 0) * 100) / 100,
    mostUsedRecipe: mostUsed[0] || null,
  }
}

export async function calculateRecipeCost(recipeId: string, servings?: number) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      user: {
        kitchenId: session.user.kitchenId,
      },
    },
    include: {
      ingredients: true,
    },
  })

  if (!recipe) {
    throw new Error("Recipe not found")
  }

  const totalCost = recipe.ingredients.reduce((sum, ingredient) => {
    return sum + ingredient.quantity * (ingredient.costPerUnit || 0)
  }, 0)

  const targetServings = servings || recipe.servings
  const costPerServing = totalCost / recipe.servings
  const totalCostForServings = costPerServing * targetServings

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPerServing: Math.round(costPerServing * 100) / 100,
    targetServings,
    totalCostForServings: Math.round(totalCostForServings * 100) / 100,
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      totalCost: Math.round(ing.quantity * (ing.costPerUnit || 0) * 100) / 100,
    })),
  }
}
