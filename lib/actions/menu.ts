"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const MenuSchema = z.object({
  date: z.string(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string(),
  plannedServings: z.number().min(1),
})

export async function getDailyMenus(date?: string) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const targetDate = date ? new Date(date) : new Date()

  const menus = await prisma.menu.findMany({
    where: {
      kitchenId: session.user.kitchenId,
      date: {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      recipe: {
        select: {
          id: true,
          name: true,
          description: true,
          costPerServing: true,
        },
      },
    },
    orderBy: {
      mealType: "asc",
    },
  })

  return menus.reduce(
    (acc, menu) => {
      if (!acc[menu.mealType]) {
        acc[menu.mealType] = []
      }
      acc[menu.mealType].push(menu)
      return acc
    },
    {} as Record<string, typeof menus>,
  )
}

export async function getMenuStats() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const today = new Date()
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))

  const [todayMenus, weekMenus, totalRecipes] = await Promise.all([
    prisma.menu.count({
      where: {
        kitchenId: session.user.kitchenId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.menu.findMany({
      where: {
        kitchenId: session.user.kitchenId,
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      select: {
        plannedServings: true,
        actualServings: true,
      },
    }),
    prisma.recipe.count({
      where: {
        user: {
          kitchenId: session.user.kitchenId,
        },
      },
    }),
  ])

  const totalPlannedServings = weekMenus.reduce((sum, menu) => sum + (menu.plannedServings || 0), 0)
  const totalActualServings = weekMenus.reduce((sum, menu) => sum + (menu.actualServings || 0), 0)

  return {
    todayMenus,
    weeklyServings: totalPlannedServings,
    actualServings: totalActualServings,
    totalRecipes,
  }
}

export async function createDailyMenu(data: z.infer<typeof MenuSchema>) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  const validatedData = MenuSchema.parse(data)

  const menu = await prisma.menu.create({
    data: {
      ...validatedData,
      date: new Date(validatedData.date),
      kitchenId: session.user.kitchenId,
    },
    include: {
      recipe: {
        select: {
          name: true,
          costPerServing: true,
        },
      },
    },
  })

  revalidatePath("/")
  return menu
}

export async function updateDailyMenu(id: string, data: Partial<z.infer<typeof MenuSchema>>) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  const menu = await prisma.menu.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  })

  revalidatePath("/")
  return menu
}

export async function deleteDailyMenu(id: string) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  await prisma.menu.delete({
    where: { id },
  })

  revalidatePath("/")
}
