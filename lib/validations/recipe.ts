import { z } from "zod"

export const CreateRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  servings: z.number().min(1, "Servings must be at least 1").max(1000),
  prepTime: z.number().min(0, "Prep time cannot be negative").max(480),
  cookTime: z.number().min(0, "Cook time cannot be negative").max(480),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  category: z.enum(["APPETIZER", "MAIN_COURSE", "SIDE_DISH", "DESSERT", "BEVERAGE", "SALAD", "SOUP"]),
  instructions: z.string().min(1, "Instructions are required").max(2000),
})

export const UpdateRecipeSchema = CreateRecipeSchema.extend({
  id: z.string().min(1, "Recipe ID is required"),
})

export const CreateIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").max(100),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.enum(["GRAMS", "KG", "ML", "LITERS", "PIECES", "CUPS", "TBSP", "TSP"]),
  costPerUnit: z.number().min(0, "Cost cannot be negative"),
})

export const UpdateIngredientSchema = CreateIngredientSchema.extend({
  id: z.string().min(1, "Ingredient ID is required"),
})

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>
export type CreateIngredientInput = z.infer<typeof CreateIngredientSchema>
export type UpdateIngredientInput = z.infer<typeof UpdateIngredientSchema>
