import { z } from "zod"

export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.number().positive("Cost per unit must be positive").optional(),
})

export const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTime: z.number().positive("Prep time must be positive").optional(),
  cookTime: z.number().positive("Cook time must be positive").optional(),
  servings: z.number().positive("Servings must be positive").optional(),
  category: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
})

export type RecipeFormData = z.infer<typeof recipeSchema>
export type IngredientFormData = z.infer<typeof ingredientSchema>
