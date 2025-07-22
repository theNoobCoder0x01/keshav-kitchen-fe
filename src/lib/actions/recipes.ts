"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { CreateRecipeSchema, UpdateRecipeSchema } from "@/lib/validations/recipe"
import { revalidatePath } from "next/cache"

export async function createRecipe(formData: FormData) {
  try {
    const session = await requireAuth()

    const rawData = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      instructions: formData.get("instructions") as string,
      prepTime: formData.get("prepTime") ? Number.parseInt(formData.get("prepTime") as string) : undefined,
      cookTime: formData.get("cookTime") ? Number.parseInt(formData.get("cookTime") as string) : undefined,
      servings: formData.get("servings") ? Number.parseInt(formData.get("servings") as string) : undefined,
      ingredients: JSON.parse((formData.get("ingredients") as string) || "[]"),
    }

    const validatedData = CreateRecipeSchema.parse(rawData)

    const recipe = await prisma.recipe.create({
      data: {
        name: validatedData.name,
        type: validatedData.type as any,
        description: validatedData.description,
        instructions: validatedData.instructions,
        prepTime: validatedData.prepTime,
        cookTime: validatedData.cookTime,
        servings: validatedData.servings,
        createdBy: session.user.id,
        ingredients: {
          create: validatedData.ingredients.map((ingredient) => ({
            ingredientName: ingredient.ingredientName,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
            notes: ingredient.notes,
          })),
        },
      },
      include: {
        ingredients: true,
        creator: {
          select: { name: true },
        },
      },
    })

    revalidatePath("/recipes")
    return { success: true, recipe }
  } catch (error) {
    console.error("Create recipe error:", error)
    return { success: false, error: "Failed to create recipe" }
  }
}

export async function updateRecipe(formData: FormData) {
  try {
    const session = await requireAuth()

    const rawData = {
      id: formData.get("id") as string,
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      instructions: formData.get("instructions") as string,
      prepTime: formData.get("prepTime") ? Number.parseInt(formData.get("prepTime") as string) : undefined,
      cookTime: formData.get("cookTime") ? Number.parseInt(formData.get("cookTime") as string) : undefined,
      servings: formData.get("servings") ? Number.parseInt(formData.get("servings") as string) : undefined,
      ingredients: JSON.parse((formData.get("ingredients") as string) || "[]"),
    }

    const validatedData = UpdateRecipeSchema.parse(rawData)

    // Check if user owns the recipe or is admin
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: validatedData.id },
    })

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    if (existingRecipe.createdBy !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const recipe = await prisma.recipe.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        type: validatedData.type as any,
        description: validatedData.description,
        instructions: validatedData.instructions,
        prepTime: validatedData.prepTime,
        cookTime: validatedData.cookTime,
        servings: validatedData.servings,
        ingredients: {
          deleteMany: {},
          create:
            validatedData.ingredients?.map((ingredient) => ({
              ingredientName: ingredient.ingredientName,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              costPerUnit: ingredient.costPerUnit,
              notes: ingredient.notes,
            })) || [],
        },
      },
      include: {
        ingredients: true,
        creator: {
          select: { name: true },
        },
      },
    })

    revalidatePath("/recipes")
    return { success: true, recipe }
  } catch (error) {
    console.error("Update recipe error:", error)
    return { success: false, error: "Failed to update recipe" }
  }
}

export async function deleteRecipe(recipeId: string) {
  try {
    const session = await requireAuth()

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    })

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" }
    }

    if (existingRecipe.createdBy !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.recipe.delete({
      where: { id: recipeId },
    })

    revalidatePath("/recipes")
    return { success: true }
  } catch (error) {
    console.error("Delete recipe error:", error)
    return { success: false, error: "Failed to delete recipe" }
  }
}

export async function getRecipes(page = 1, limit = 10, search?: string) {
  try {
    const session = await requireAuth()

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          ingredients: true,
          creator: {
            select: { name: true },
          },
          _count: {
            select: { dailyMenus: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ])

    return {
      recipes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error("Get recipes error:", error)
    throw new Error("Failed to fetch recipes")
  }
}

export async function getRecipeById(id: string) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        creator: {
          select: { name: true, email: true },
        },
      },
    })

    return recipe
  } catch (error) {
    console.error("Get recipe error:", error)
    throw new Error("Failed to fetch recipe")
  }
}
