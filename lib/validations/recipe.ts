import { z } from "zod"

export const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Description is required"),
  ingredients: z.string().min(1, "Ingredients are required"),
  instructions: z.string().min(1, "Instructions are required"),
  servings: z.number().min(1, "Servings must be at least 1"),
  costPerServing: z.number().min(0, "Cost per serving must be non-negative"),
})

export type RecipeFormData = z.infer<typeof recipeSchema>

export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.string().min(1, "Quantity is required"),
  cost: z.number().min(0, "Cost must be non-negative"),
})

export type IngredientData = z.infer<typeof ingredientSchema>
