import { z } from "zod"

export const menuSchema = z.object({
  date: z.string().min(1, "Date is required"),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"], {
    required_error: "Meal type is required",
  }),
  recipeId: z.string().min(1, "Recipe is required"),
  plannedServings: z.number().min(1, "Planned servings must be at least 1"),
  actualServings: z.number().min(0).optional(),
})

export type MenuFormData = z.infer<typeof menuSchema>

export const reportSchema = z.object({
  type: z.enum(["DAILY", "WEEKLY", "MONTHLY"], {
    required_error: "Report type is required",
  }),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
})

export type ReportFormData = z.infer<typeof reportSchema>
