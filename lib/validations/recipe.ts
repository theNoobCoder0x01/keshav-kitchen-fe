import { isValidUnit, normalizeUnit } from "@/lib/constants/units";
import { z } from "zod";

const unitSchema = z
  .string()
  .trim()
  .min(1, "Unit is required")
  .refine((value) => isValidUnit(value), "Unit is invalid")
  .transform((value) => normalizeUnit(value));

export const IngredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().min(0.1, "Quantity must be greater than 0"),
  unit: unitSchema,
  costPerUnit: z.number().min(0).optional(),
});

export const RecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  preparedQuantity: z.number().min(1).optional(),
  preparedQuantityUnit: unitSchema.optional(),
  servingQuantity: z
    .number()
    .min(0, "Serving quantity must be at least 0")
    .optional(),
  servingQuantityUnit: unitSchema.optional(),
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
