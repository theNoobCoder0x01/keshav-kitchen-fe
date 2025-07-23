import { z } from "zod"

export const menuSchema = z.object({
  date: z.string().min(1, "Date is required"),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"], {
    required_error: "Meal type is required",
  }),
  recipeId: z.string().min(1, "Recipe is required"),
  servings: z.number().positive("Servings must be positive"),
  ghanFactor: z.number().positive("Ghan factor must be positive").default(1.0),
  notes: z.string().optional(),
})

export const menuUpdateSchema = z.object({
  servings: z.number().positive("Servings must be positive"),
  ghanFactor: z.number().positive("Ghan factor must be positive"),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  actualCount: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export type MenuFormData = z.infer<typeof menuSchema>
export type MenuUpdateData = z.infer<typeof menuUpdateSchema>
