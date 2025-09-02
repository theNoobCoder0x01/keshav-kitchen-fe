import { z } from "zod";

export const IngredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().min(0.1, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.number().min(0).optional(),
});

export const RecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  preparedQuantity: z.number().min(1).optional(),
  preparedQuantityUnit: z.string().optional(),
  servingQuantity: z
    .number()
    .min(0, "Serving quantity must be at least 0")
    .optional(),
  servingQuantityUnit: z.string().optional(),
  quantityPerPiece: z
    .number()
    .min(0, "Serving quantity must be at least 0")
    .optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  ingredients: z
    .array(IngredientSchema)
    .min(1, "At least one ingredient is required"),
});

export type RecipeFormData = z.infer<typeof RecipeSchema>;
export type IngredientFormData = z.infer<typeof IngredientSchema>;
