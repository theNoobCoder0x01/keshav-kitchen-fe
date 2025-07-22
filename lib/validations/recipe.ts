import { z } from "zod"

export const RecipeIngredientSchema = z.object({
  ingredientName: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.number().positive().optional(),
  notes: z.string().optional(),
})

export const CreateRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  type: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTime: z.number().positive().optional(),
  cookTime: z.number().positive().optional(),
  servings: z.number().positive().optional(),
  ingredients: z.array(RecipeIngredientSchema).optional(),
})

export const UpdateRecipeSchema = CreateRecipeSchema.extend({
  id: z.string().min(1, "Recipe ID is required"),
})

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>
export type RecipeIngredientInput = z.infer<typeof RecipeIngredientSchema>
