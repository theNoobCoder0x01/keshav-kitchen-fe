import { z } from "zod"

export const menuSchema = z.object({
  date: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string().min(1, "Recipe is required"),
  kitchenId: z.string().min(1, "Kitchen is required"),
  servings: z.number().positive("Servings must be positive"),
  ghanFactor: z.number().positive("Ghan factor must be positive"),
  notes: z.string().optional(),
})

export const menuUpdateSchema = z.object({
  servings: z.number().positive("Servings must be positive").optional(),
  ghanFactor: z.number().positive("Ghan factor must be positive").optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  actualCount: z.number().positive("Actual count must be positive").optional(),
  notes: z.string().optional(),
})

export type MenuFormData = z.infer<typeof menuSchema>
export type MenuUpdateData = z.infer<typeof menuUpdateSchema>
