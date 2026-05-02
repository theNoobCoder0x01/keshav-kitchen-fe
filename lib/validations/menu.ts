import { MealType } from "@prisma/client";
import { isValidUnit, normalizeUnit } from "@/lib/constants/units";
import { z } from "zod";

const unitSchema = z
  .string()
  .trim()
  .min(1, "Unit is required")
  .refine((value) => isValidUnit(value), "Unit is invalid")
  .transform((value) => normalizeUnit(value));

const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Ingredient name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: unitSchema,
  costPerUnit: z.number().min(0).nullable().optional(),
  sequenceNumber: z.number().int().positive().nullable().optional(),
  groupId: z.string().nullable().optional(),
});

export const MenuSchema = z.object({
  date: z.date(),
  mealType: z.enum([
    MealType.BREAKFAST,
    MealType.LUNCH,
    MealType.DINNER,
    MealType.SNACK,
  ]),
  recipeId: z.string().nullable().optional(),
  kitchenId: z.string().min(1, "Kitchen is required"),
  ghanFactor: z.number().min(0.1).max(5.0).default(1.0),
  notes: z.string().optional(),
  preparedQuantity: z.number().positive().optional(),
  preparedQuantityUnit: unitSchema.optional(),
  servingQuantity: z.number().positive().optional(),
  servingQuantityUnit: unitSchema.optional(),
  quantityPerPiece: z.number().positive().nullable().optional(),
  ingredients: z.array(ingredientSchema).optional(),
});

export const MenuUpdateSchema = z.object({
  ghanFactor: z.number().min(0.1).max(5.0).optional(),
  notes: z.string().optional(),
  preparedQuantity: z.number().positive().optional(),
  preparedQuantityUnit: unitSchema.optional(),
  servingQuantity: z.number().positive().optional(),
  servingQuantityUnit: unitSchema.optional(),
  quantityPerPiece: z.number().positive().nullable().optional(),
  ingredients: z.array(ingredientSchema).optional(),
});

export type MenuFormData = z.infer<typeof MenuSchema>;
export type MenuUpdateData = z.infer<typeof MenuUpdateSchema>;
