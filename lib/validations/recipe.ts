import { z } from "zod"

export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.number().min(0, "Cost per unit must be non-negative").optional(),
})

export const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Description is required"),
  instructions: z.string().min(1, "Instructions are required"),
  prepTime: z.number().min(0, "Prep time must be non-negative").optional(),
  cookTime: z.number().min(0, "Cook time must be non-negative").optional(),
  servings: z.number().positive("Servings must be positive"),
  category: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
})

export type RecipeFormData = z.infer<typeof recipeSchema>
export type IngredientFormData = z.infer<typeof ingredientSchema>
