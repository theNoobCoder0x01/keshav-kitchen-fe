import { z } from "zod";

export const MenuSchema = z.object({
  date: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string().min(1, "Recipe is required"),
  kitchenId: z.string().min(1, "Kitchen is required"),
  servings: z.number().min(1, "Servings must be at least 1"),
  ghanFactor: z.number().min(0.1).max(5.0).default(1.0),
  notes: z.string().optional(),
});

export const MenuUpdateSchema = z.object({
  servings: z.number().min(1).optional(),
  ghanFactor: z.number().min(0.1).max(5.0).optional(),
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
  actualCount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type MenuFormData = z.infer<typeof MenuSchema>;
export type MenuUpdateData = z.infer<typeof MenuUpdateSchema>;
