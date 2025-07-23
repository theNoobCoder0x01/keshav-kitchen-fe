import { z } from "zod"

export const menuSchema = z.object({
  date: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string().min(1, "Recipe is required"),
  kitchenId: z.string().min(1, "Kitchen is required"),
  servings: z.number().positive("Servings must be positive"),
  ghanFactor: z.number().min(0.1).max(5.0),
  notes: z.string().optional(),
})

export const reportSchema = z.object({
  date: z.date(),
  kitchenId: z.string().min(1, "Kitchen is required"),
  visitorCount: z.number().min(0, "Visitor count must be non-negative"),
  mealsCounted: z.number().min(0, "Meals counted must be non-negative"),
  notes: z.string().optional(),
})

export type MenuFormData = z.infer<typeof menuSchema>
export type ReportFormData = z.infer<typeof reportSchema>
