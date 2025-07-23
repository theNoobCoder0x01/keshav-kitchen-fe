"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function getKitchens() {
  try {
    const session = await requireAuth()

    // If user has a specific kitchen, only return that kitchen
    if (session.user.kitchenId && session.user.role !== "ADMIN") {
      const kitchen = await prisma.kitchen.findUnique({
        where: {
          id: session.user.kitchenId,
          isActive: true,
        },
      })
      return kitchen ? [kitchen] : []
    }

    // Admin can see all kitchens
    const kitchens = await prisma.kitchen.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })

    return kitchens
  } catch (error) {
    console.error("Get kitchens error:", error)
    return []
  }
}

export async function getKitchenById(id: string) {
  try {
    const session = await requireAuth()

    // Check if user has access to this kitchen
    if (session.user.kitchenId && session.user.role !== "ADMIN" && session.user.kitchenId !== id) {
      throw new Error("Access denied")
    }

    const kitchen = await prisma.kitchen.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            dailyMenus: true,
            reports: true,
          },
        },
      },
    })

    return kitchen
  } catch (error) {
    console.error("Get kitchen by ID error:", error)
    return null
  }
}
