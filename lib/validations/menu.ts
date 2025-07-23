import { z } from "zod"
import { MealType, Status } from "@prisma/client"

export const menuSchema = z.object({
  date: z.date(),
  mealType: z.nativeEnum(MealType),
  recipeId: z.string().min(1, "Recipe is required"),
  kitchenId: z.string().min(1, "Kitchen is required"),
  servings: z.number().positive("Servings must be positive"),
  ghanFactor: z.number().positive("Ghan factor must be positive").optional(),
  notes: z.string().optional(),
})

export const menuUpdateSchema = z.object({
  servings: z.number().positive("Servings must be positive").optional(),
  ghanFactor: z.number().positive("Ghan factor must be positive").optional(),
  status: z.nativeEnum(Status).optional(),
  actualCount: z.number().optional(),
  notes: z.string().optional(),
})

export type MenuFormData = z.infer<typeof menuSchema>
export type MenuUpdateData = z.infer<typeof menuUpdateSchema>
