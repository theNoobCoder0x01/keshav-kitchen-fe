"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const MenuSchema = z.object({
  date: z.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  recipeId: z.string(),
  kitchenId: z.string(),
  servings: z.number().min(1),
  ghanFactor: z.number().min(0.1).max(5.0),
  notes: z.string().optional(),
})

export async function getDailyMenus(date?: Date) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const targetDate = date || new Date()
  targetDate.setHours(0, 0, 0, 0)

  const menus = await prisma.menu.findMany({
    where: {
      date: targetDate,
      kitchenId: session.user.kitchenId,
    },
    include: {
      recipe: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          ingredients: {
            select: {
              name: true,
              quantity: true,
              unit: true,
              costPerUnit: true,
            },
          },
        },
      },
      kitchen: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      {
        mealType: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  })

  // Group by meal type
  const groupedMenus = {
    BREAKFAST: menus.filter((m) => m.mealType === "BREAKFAST"),
    LUNCH: menus.filter((m) => m.mealType === "LUNCH"),
    DINNER: menus.filter((m) => m.mealType === "DINNER"),
    SNACK: menus.filter((m) => m.mealType === "SNACK"),
  }

  return groupedMenus
}

export async function getMenuStats() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayMenus, weekMenus, totalServings, avgGhanFactor] = await Promise.all([
    prisma.menu.count({
      where: {
        date: today,
        kitchenId: session.user.kitchenId,
      },
    }),
    prisma.menu.count({
      where: {
        date: {
          gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
        kitchenId: session.user.kitchenId,
      },
    }),
    prisma.menu.aggregate({
      where: {
        date: today,
        kitchenId: session.user.kitchenId,
      },
      _sum: {
        servings: true,
      },
    }),
    prisma.menu.aggregate({
      where: {
        kitchenId: session.user.kitchenId,
      },
      _avg: {
        ghanFactor: true,
      },
    }),
  ])

  return {
    todayMenus,
    weekMenus,
    totalServingsToday: totalServings._sum.servings || 0,
    avgGhanFactor: Math.round((avgGhanFactor._avg.ghanFactor || 1.0) * 100) / 100,
  }
}

export async function createDailyMenu(data: z.infer<typeof MenuSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if user has permission to create menus for this kitchen
  if (session.user.role === "STAFF" && data.kitchenId !== session.user.kitchenId) {
    throw new Error("Insufficient permissions")
  }

  const validatedData = MenuSchema.parse(data)

  const menu = await prisma.menu.create({
    data: {
      ...validatedData,
      userId: session.user.id,
      status: "PLANNED",
    },
    include: {
      recipe: {
        select: {
          name: true,
          category: true,
        },
      },
    },
  })

  revalidatePath("/")
  return menu
}

export async function updateDailyMenu(
  id: string,
  data: Partial<z.infer<typeof MenuSchema>> & {
    status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
    actualCount?: number
  },
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if menu exists and user has permission
  const existingMenu = await prisma.menu.findFirst({
    where: {
      id,
      OR: [{ userId: session.user.id }, { kitchenId: session.user.kitchenId }],
    },
  })

  if (!existingMenu) {
    throw new Error("Menu not found or unauthorized")
  }

  // Staff can only update their own menus
  if (session.user.role === "STAFF" && existingMenu.userId !== session.user.id) {
    throw new Error("Insufficient permissions")
  }

  const menu = await prisma.menu.update({
    where: { id },
    data,
    include: {
      recipe: {
        select: {
          name: true,
          category: true,
        },
      },
    },
  })

  revalidatePath("/")
  return menu
}

export async function deleteDailyMenu(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if menu exists and user has permission
  const existingMenu = await prisma.menu.findFirst({
    where: {
      id,
      OR: [{ userId: session.user.id }, { kitchenId: session.user.kitchenId }],
    },
  })

  if (!existingMenu) {
    throw new Error("Menu not found or unauthorized")
  }

  // Staff can only delete their own menus, others need manager+ role
  if (session.user.role === "STAFF" && existingMenu.userId !== session.user.id) {
    throw new Error("Insufficient permissions")
  }

  await prisma.menu.delete({
    where: { id },
  })

  revalidatePath("/")
}

export async function getMenuHistory(recipeId?: string, limit = 10) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const menus = await prisma.menu.findMany({
    where: {
      kitchenId: session.user.kitchenId,
      ...(recipeId && { recipeId }),
    },
    include: {
      recipe: {
        select: {
          name: true,
          category: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    take: limit,
  })

  return menus
}
