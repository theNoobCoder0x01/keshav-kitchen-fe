"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getKitchens() {
  try {
    const session = await auth()

    if (!session?.user) {
      return []
    }

    // If user is not admin, only return their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      const kitchen = await prisma.kitchen.findUnique({
        where: { id: session.user.kitchenId },
        include: {
          _count: {
            select: {
              users: true,
              menus: true,
              reports: true,
            },
          },
        },
      })
      return kitchen ? [kitchen] : []
    }

    // Admin can see all kitchens
    const kitchens = await prisma.kitchen.findMany({
      include: {
        _count: {
          select: {
            users: true,
            menus: true,
            reports: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return kitchens
  } catch (error) {
    console.error("Get kitchens error:", error)
    return []
  }
}

export async function createKitchen(formData: FormData) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const name = formData.get("name") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string

    if (!name?.trim()) {
      return { success: false, error: "Kitchen name is required" }
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name: name.trim(),
        location: location?.trim() || null,
        description: description?.trim() || null,
      },
    })

    revalidatePath("/")
    return { success: true, kitchen }
  } catch (error) {
    console.error("Create kitchen error:", error)
    return { success: false, error: "Failed to create kitchen" }
  }
}

export async function updateKitchen(id: string, formData: FormData) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const name = formData.get("name") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string

    if (!name?.trim()) {
      return { success: false, error: "Kitchen name is required" }
    }

    const kitchen = await prisma.kitchen.update({
      where: { id },
      data: {
        name: name.trim(),
        location: location?.trim() || null,
        description: description?.trim() || null,
      },
    })

    revalidatePath("/")
    return { success: true, kitchen }
  } catch (error) {
    console.error("Update kitchen error:", error)
    return { success: false, error: "Failed to update kitchen" }
  }
}

export async function deleteKitchen(id: string) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // Check if kitchen has users or menus
    const kitchen = await prisma.kitchen.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, menus: true },
        },
      },
    })

    if (!kitchen) {
      return { success: false, error: "Kitchen not found" }
    }

    if (kitchen._count.users > 0 || kitchen._count.menus > 0) {
      return { success: false, error: "Cannot delete kitchen with existing users or menus" }
    }

    await prisma.kitchen.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Delete kitchen error:", error)
    return { success: false, error: "Failed to delete kitchen" }
  }
}
