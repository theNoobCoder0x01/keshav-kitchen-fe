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
      description: formData.get("description") as string,
      servings: Number.parseInt(formData.get("servings") as string),
      prepTime: Number.parseInt(formData.get("prepTime") as string),
      cookTime: Number.parseInt(formData.get("cookTime") as string),
      difficulty: formData.get("difficulty") as string,
      category: formData.get("category") as string,
      instructions: formData.get("instructions") as string,
    }

    const validatedData = CreateRecipeSchema.parse(rawData)

    // Parse ingredients from form data
    const ingredientsData = []
    let index = 0
    while (formData.get(`ingredients[${index}][name]`)) {
      ingredientsData.push({
        name: formData.get(`ingredients[${index}][name]`) as string,
        quantity: Number.parseFloat(formData.get(`ingredients[${index}][quantity]`) as string),
        unit: formData.get(`ingredients[${index}][unit]`) as string,
        costPerUnit: Number.parseFloat(formData.get(`ingredients[${index}][costPerUnit]`) as string),
      })
      index++
    }

    const recipe = await prisma.recipe.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        ingredients: {
          create: ingredientsData,
        },
      },
      include: {
        ingredients: true,
        user: {
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
      description: formData.get("description") as string,
      servings: Number.parseInt(formData.get("servings") as string),
      prepTime: Number.parseInt(formData.get("prepTime") as string),
      cookTime: Number.parseInt(formData.get("cookTime") as string),
      difficulty: formData.get("difficulty") as string,
      category: formData.get("category") as string,
      instructions: formData.get("instructions") as string,
    }

    const validatedData = UpdateRecipeSchema.parse(rawData)

    const recipe = await prisma.recipe.update({
      where: { id: validatedData.id },
      data: validatedData,
      include: {
        ingredients: true,
        user: {
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

    const skip = (page - 1) * limit
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          ingredients: true,
          user: {
            select: { name: true },
          },
          _count: {
            select: { dailyMenus: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ])

    return {
      recipes,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error) {
    console.error("Get recipes error:", error)
    return {
      recipes: [],
      total: 0,
      pages: 0,
      currentPage: 1,
    }
  }
}

export async function getRecipeById(id: string) {
  try {
    const session = await requireAuth()

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        user: {
          select: { name: true },
        },
        dailyMenus: {
          include: {
            kitchen: {
              select: { name: true },
            },
          },
          orderBy: { menuDate: "desc" },
          take: 10,
        },
      },
    })

    return recipe
  } catch (error) {
    console.error("Get recipe by ID error:", error)
    return null
  }
}
