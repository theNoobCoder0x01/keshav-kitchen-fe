"use server"

import { prisma, sql } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { UpdateRecipeSchema } from "@/lib/validations/recipe"
import { revalidatePath } from "next/cache"

export async function createRecipe(formData: FormData) {
  try {
    const session = await requireAuth()

    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const description = formData.get("description") as string
    const instructions = formData.get("instructions") as string
    const prepTime = formData.get("prepTime") ? Number.parseInt(formData.get("prepTime") as string) : null
    const cookTime = formData.get("cookTime") ? Number.parseInt(formData.get("cookTime") as string) : null
    const servings = formData.get("servings") ? Number.parseInt(formData.get("servings") as string) : null
    const ingredients = JSON.parse((formData.get("ingredients") as string) || "[]")

    if (!name?.trim()) {
      return { success: false, error: "Recipe name is required" }
    }

    const recipeId = `recipe_${Date.now()}`

    // Create recipe
    await sql`
      INSERT INTO recipes (id, name, type, description, instructions, prep_time, cook_time, servings, created_by)
      VALUES (${recipeId}, ${name.trim()}, ${type}, ${description || null}, ${instructions || null}, ${prepTime}, ${cookTime}, ${servings}, ${session.user.id})
    `

    // Add ingredients
    for (const ingredient of ingredients) {
      const ingredientId = `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await sql`
        INSERT INTO recipe_ingredients (id, recipe_id, ingredient_name, quantity, unit, cost_per_unit, notes)
        VALUES (${ingredientId}, ${recipeId}, ${ingredient.ingredientName}, ${ingredient.quantity}, ${ingredient.unit}, ${ingredient.costPerUnit || null}, ${ingredient.notes || null})
      `
    }

    revalidatePath("/recipes")
    return { success: true, recipeId }
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
    const offset = (page - 1) * limit

    let whereClause = ""
    let params: any[] = []

    if (search) {
      whereClause = "WHERE r.name ILIKE $1 OR r.description ILIKE $1"
      params = [`%${search}%`]
    }

    const recipes = await sql`
      SELECT r.*, 
             u.name as creator_name,
             COUNT(DISTINCT ri.id) as ingredient_count,
             COUNT(DISTINCT dm.id) as menu_usage_count
      FROM recipes r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN daily_menus dm ON r.id = dm.recipe_id
      ${search ? sql`WHERE r.name ILIKE ${`%${search}%`} OR r.description ILIKE ${`%${search}%`}` : sql``}
      GROUP BY r.id, r.name, r.type, r.description, r.instructions, r.prep_time, r.cook_time, r.servings, r.cost_per_serving, r.image_url, r.created_by, r.created_at, r.updated_at, u.name
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const totalResult = await sql`
      SELECT COUNT(*) as total FROM recipes r
      ${search ? sql`WHERE r.name ILIKE ${`%${search}%`} OR r.description ILIKE ${`%${search}%`}` : sql``}
    `

    const total = Number(totalResult[0].total)

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
    const recipe = await sql`
      SELECT r.*, u.name as creator_name, u.email as creator_email
      FROM recipes r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ${id}
    `

    if (recipe.length === 0) {
      return null
    }

    const ingredients = await sql`
      SELECT * FROM recipe_ingredients 
      WHERE recipe_id = ${id}
      ORDER BY ingredient_name
    `

    return {
      ...recipe[0],
      ingredients,
    }
  } catch (error) {
    console.error("Get recipe error:", error)
    throw new Error("Failed to fetch recipe")
  }
}
