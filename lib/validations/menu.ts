import { z } from "zod"

export const menuSchema = z.object({
  date: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string().min(1, "Recipe is required"),
  kitchenId: z.string().min(1, "Kitchen is required"),
  servings: z.number().positive("Servings must be positive"),
  ghanFactor: z.number().positive("Ghan factor must be positive").default(1.0),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PLANNED"),
})

export const updateMenuSchema = menuSchema.partial()

export type MenuFormData = z.infer<typeof menuSchema>
