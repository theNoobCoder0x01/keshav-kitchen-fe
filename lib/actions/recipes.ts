"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const RecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  type: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  servings: z.number().min(1).optional(),
  costPerServing: z.number().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
})

const IngredientSchema = z.object({
  ingredientName: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export async function getRecipes(kitchenId?: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true,
        creator: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            dailyMenus: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      type: recipe.type,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      costPerServing: recipe.costPerServing,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients,
      creator: recipe.creator.name,
      usageCount: recipe._count.dailyMenus,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    }))
  } catch (error) {
    console.error("Error fetching recipes:", error)
    throw new Error("Failed to fetch recipes")
  }
}

export async function getRecipe(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        creator: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!recipe) {
      throw new Error("Recipe not found")
    }

    return recipe
  } catch (error) {
    console.error("Error fetching recipe:", error)
    throw new Error("Failed to fetch recipe")
  }
}

export async function createRecipe(
  data: z.infer<typeof RecipeSchema> & {
    ingredients: z.infer<typeof IngredientSchema>[]
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const validatedData = RecipeSchema.parse(data)
    const validatedIngredients = data.ingredients.map((ingredient) => IngredientSchema.parse(ingredient))

    // Calculate cost per serving if ingredients have costs
    let totalCost = 0
    let hasCosts = false

    for (const ingredient of validatedIngredients) {
      if (ingredient.costPerUnit) {
        totalCost += ingredient.quantity * ingredient.costPerUnit
        hasCosts = true
      }
    }

    const costPerServing =
      hasCosts && validatedData.servings ? totalCost / validatedData.servings : validatedData.costPerServing

    const recipe = await prisma.recipe.create({
      data: {
        ...validatedData,
        costPerServing,
        createdBy: session.user.id,
        ingredients: {
          create: validatedIngredients,
        },
      },
      include: {
        ingredients: true,
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
  data: z.infer<typeof RecipeSchema> & {
    ingredients: (z.infer<typeof IngredientSchema> & { id?: string })[]
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const validatedData = RecipeSchema.parse(data)
    const validatedIngredients = data.ingredients.map((ingredient) => IngredientSchema.parse(ingredient))

    // Calculate cost per serving if ingredients have costs
    let totalCost = 0
    let hasCosts = false

    for (const ingredient of validatedIngredients) {
      if (ingredient.costPerUnit) {
        totalCost += ingredient.quantity * ingredient.costPerUnit
        hasCosts = true
      }
    }

    const costPerServing =
      hasCosts && validatedData.servings ? totalCost / validatedData.servings : validatedData.costPerServing

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...validatedData,
        costPerServing,
        ingredients: {
          deleteMany: {},
          create: validatedIngredients,
        },
      },
      include: {
        ingredients: true,
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
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // Check if recipe is used in any menus
    const menuCount = await prisma.dailyMenu.count({
      where: { recipeId: id },
    })

    if (menuCount > 0) {
      throw new Error("Cannot delete recipe that is used in menus")
    }

    await prisma.recipe.delete({
      where: { id },
    })

    revalidatePath("/recipes")
  } catch (error) {
    console.error("Error deleting recipe:", error)
    throw new Error("Failed to delete recipe")
  }
}

export async function getRecipeStats() {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const [totalRecipes, recipesByType, avgCostPerServing] = await Promise.all([
      prisma.recipe.count(),
      prisma.recipe.groupBy({
        by: ["type"],
        _count: {
          id: true,
        },
      }),
      prisma.recipe.aggregate({
        _avg: {
          costPerServing: true,
        },
      }),
    ])

    return {
      totalRecipes,
      recipesByType: recipesByType.reduce(
        (acc, item) => {
          acc[item.type] = item._count.id
          return acc
        },
        {} as Record<string, number>,
      ),
      avgCostPerServing: avgCostPerServing._avg.costPerServing || 0,
    }
  } catch (error) {
    console.error("Error fetching recipe stats:", error)
    throw new Error("Failed to fetch recipe stats")
  }
}
