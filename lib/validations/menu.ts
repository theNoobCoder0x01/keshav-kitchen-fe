import { z } from "zod"

export const CreateDailyMenuSchema = z.object({
  kitchenId: z.string().min(1, "Kitchen is required"),
  menuDate: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string().min(1, "Recipe is required"),
  plannedServings: z.number().positive("Planned servings must be positive"),
  ghanMultiplier: z.number().positive().default(1),
})

export const UpdateDailyMenuSchema = z.object({
  id: z.string().min(1, "Menu ID is required"),
  actualServings: z.number().positive().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).optional(),
  plannedServings: z.number().positive().optional(),
  ghanMultiplier: z.number().positive().optional(),
})

export type CreateDailyMenuInput = z.infer<typeof CreateDailyMenuSchema>
export type UpdateDailyMenuInput = z.infer<typeof UpdateDailyMenuSchema>
