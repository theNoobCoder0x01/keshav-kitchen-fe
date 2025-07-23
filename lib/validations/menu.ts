import { z } from "zod"

export const CreateDailyMenuSchema = z.object({
  kitchenId: z.string().min(1, "Kitchen is required"),
  menuDate: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string().min(1, "Recipe is required"),
  plannedServings: z.number().min(1, "Planned servings must be at least 1").max(10000),
  ghanMultiplier: z.number().min(0.1, "Ghan multiplier must be at least 0.1").max(100),
})

export const UpdateDailyMenuSchema = z.object({
  id: z.string().min(1, "Menu ID is required"),
  actualServings: z.number().min(0).max(10000).optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  plannedServings: z.number().min(1).max(10000).optional(),
  ghanMultiplier: z.number().min(0.1).max(100).optional(),
})

export type CreateDailyMenuInput = z.infer<typeof CreateDailyMenuSchema>
export type UpdateDailyMenuInput = z.infer<typeof UpdateDailyMenuSchema>
