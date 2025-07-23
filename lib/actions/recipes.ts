"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const RecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  ingredients: z.string(),
  instructions: z.string().min(1),
  servings: z.number().min(1),
  costPerServing: z.number().min(0),
})

export async function getRecipes() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const recipes = await prisma.recipe.findMany({
    where: {
      user: {
        kitchenId: session.user.kitchenId,
      },
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          menus: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return recipes
}

export async function getRecipe(id: string) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      user: {
        kitchenId: session.user.kitchenId,
      },
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  return recipe
}

export async function createRecipe(data: z.infer<typeof RecipeSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedData = RecipeSchema.parse(data)

  const recipe = await prisma.recipe.create({
    data: {
      ...validatedData,
      userId: session.user.id,
    },
  })

  revalidatePath("/recipes")
  return recipe
}

export async function updateRecipe(id: string, data: z.infer<typeof RecipeSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedData = RecipeSchema.parse(data)

  // Check if user owns the recipe or has admin/manager role
  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        {
          user: {
            kitchenId: session.user.kitchenId,
          },
        },
      ],
    },
  })

  if (!recipe) {
    throw new Error("Recipe not found or unauthorized")
  }

  if (recipe.userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  const updatedRecipe = await prisma.recipe.update({
    where: { id },
    data: validatedData,
  })

  revalidatePath("/recipes")
  return updatedRecipe
}

export async function deleteRecipe(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if user owns the recipe or has admin/manager role
  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        {
          user: {
            kitchenId: session.user.kitchenId,
          },
        },
      ],
    },
  })

  if (!recipe) {
    throw new Error("Recipe not found or unauthorized")
  }

  if (recipe.userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  await prisma.recipe.delete({
    where: { id },
  })

  revalidatePath("/recipes")
}

export async function getRecipeStats() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const [totalRecipes, avgCost, mostUsed] = await Promise.all([
    prisma.recipe.count({
      where: {
        user: {
          kitchenId: session.user.kitchenId,
        },
      },
    }),
    prisma.recipe.aggregate({
      where: {
        user: {
          kitchenId: session.user.kitchenId,
        },
      },
      _avg: {
        costPerServing: true,
      },
    }),
    prisma.recipe.findMany({
      where: {
        user: {
          kitchenId: session.user.kitchenId,
        },
      },
      include: {
        _count: {
          select: {
            menus: true,
          },
        },
      },
      orderBy: {
        menus: {
          _count: "desc",
        },
      },
      take: 1,
    }),
  ])

  return {
    totalRecipes,
    avgCostPerServing: avgCost._avg.costPerServing || 0,
    mostUsedRecipe: mostUsed[0] || null,
  }
}
