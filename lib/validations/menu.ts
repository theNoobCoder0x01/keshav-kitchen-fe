import { z } from "zod"

export const menuSchema = z.object({
  date: z.string(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string(),
  kitchenId: z.string(),
  servings: z.number().int().min(1, "Servings must be at least 1"),
  ghanFactor: z.number().min(0.1).default(1.0),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PLANNED"),
  actualCount: z.number().int().min(0).optional(),
  notes: z.string().optional(),
})
