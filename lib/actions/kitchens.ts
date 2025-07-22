"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

export async function getKitchens() {
  try {
    const session = await requireAuth()

    // If user is not admin, only return their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      const kitchen = await prisma.kitchen.findUnique({
        where: {
          id: session.user.kitchenId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              users: true,
              dailyMenus: true,
            },
          },
        },
      })
      return kitchen ? [kitchen] : []
    }

    const kitchens = await prisma.kitchen.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            users: true,
            dailyMenus: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return kitchens
  } catch (error) {
    console.error("Get kitchens error:", error)
    return []
  }
}

export async function createKitchen(formData: FormData) {
  try {
    await requireRole(["ADMIN"])

    const name = formData.get("name") as string
    const location = formData.get("location") as string

    if (!name?.trim()) {
      return { success: false, error: "Kitchen name is required" }
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name: name.trim(),
        location: location?.trim() || null,
        isActive: true,
      },
    })

    revalidatePath("/")
    return { success: true, kitchen }
  } catch (error) {
    console.error("Create kitchen error:", error)
    return { success: false, error: "Failed to create kitchen" }
  }
}

export async function updateKitchen(formData: FormData) {
  try {
    await requireRole(["ADMIN"])

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const location = formData.get("location") as string
    const isActive = formData.get("isActive") === "true"

    if (!name?.trim()) {
      return { success: false, error: "Kitchen name is required" }
    }

    const kitchen = await prisma.kitchen.update({
      where: { id },
      data: {
        name: name.trim(),
        location: location?.trim() || null,
        isActive,
      },
    })

    revalidatePath("/")
    return { success: true, kitchen }
  } catch (error) {
    console.error("Update kitchen error:", error)
    return { success: false, error: "Failed to update kitchen" }
  }
}

export async function deleteKitchen(kitchenId: string) {
  try {
    await requireRole(["ADMIN"])

    // Soft delete by setting isActive to false
    const kitchen = await prisma.kitchen.update({
      where: { id: kitchenId },
      data: { isActive: false },
    })

    revalidatePath("/")
    return { success: true, kitchen }
  } catch (error) {
    console.error("Delete kitchen error:", error)
    return { success: false, error: "Failed to delete kitchen" }
  }
}
