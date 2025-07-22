import { z } from "zod"

export const CreateDailyMenuSchema = z.object({
  kitchenId: z.string().cuid(),
  menuDate: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string().cuid(),
  plannedServings: z.number().int().positive(),
  ghanMultiplier: z.number().positive().default(1),
})

export const UpdateDailyMenuSchema = CreateDailyMenuSchema.partial().extend({
  id: z.string().cuid(),
  actualServings: z.number().int().positive().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).optional(),
})

export type CreateDailyMenuInput = z.infer<typeof CreateDailyMenuSchema>
export type UpdateDailyMenuInput = z.infer<typeof UpdateDailyMenuSchema>
