import { z } from "zod"

export const CreateRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(255),
  type: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  ingredients: z
    .array(
      z.object({
        ingredientName: z.string().min(1, "Ingredient name is required"),
        quantity: z.number().positive("Quantity must be positive"),
        unit: z.string().min(1, "Unit is required"),
        costPerUnit: z.number().positive().optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1, "At least one ingredient is required"),
})

export const UpdateRecipeSchema = CreateRecipeSchema.partial().extend({
  id: z.string().cuid(),
})

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>
