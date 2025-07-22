"use server"

import { revalidatePath } from "next/cache"
import prisma from "../prisma"
import { auth } from "../auth"

export async function getKitchens() {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Admin can see all kitchens, others only see their assigned kitchen
    if (session.user.role === "ADMIN") {
      const kitchens = await prisma.kitchen.findMany({
        include: {
          _count: {
            select: {
              users: true,
              menus: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      })

      return { success: true, data: kitchens }
    } else {
      // For non-admin users, only return their assigned kitchen
      if (!session.user.kitchenId) {
        return { success: true, data: [] }
      }

      const kitchen = await prisma.kitchen.findUnique({
        where: {
          id: session.user.kitchenId,
        },
        include: {
          _count: {
            select: {
              users: true,
              menus: true,
            },
          },
        },
      })

      return { success: true, data: kitchen ? [kitchen] : [] }
    }
  } catch (error) {
    console.error("Error fetching kitchens:", error)
    return { success: false, error: "Failed to fetch kitchens" }
  }
}

export async function getKitchenById(id: string) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Check if user has access to this kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== id) {
      throw new Error("Unauthorized to access this kitchen")
    }

    const kitchen = await prisma.kitchen.findUnique({
      where: { id },
      include: {
        users: true,
        _count: {
          select: {
            menus: true,
            reports: true,
          },
        },
      },
    })

    if (!kitchen) {
      return { success: false, error: "Kitchen not found" }
    }

    return { success: true, data: kitchen }
  } catch (error) {
    console.error("Error fetching kitchen:", error)
    return { success: false, error: "Failed to fetch kitchen" }
  }
}

export async function createKitchen(data: {
  name: string
  location?: string
  description?: string
}) {
  try {
    const session = await auth()

    if (!session || !session.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name: data.name,
        location: data.location || "",
        description: data.description || "",
      },
    })

    revalidatePath("/")
    return { success: true, data: kitchen }
  } catch (error) {
    console.error("Error creating kitchen:", error)
    return { success: false, error: "Failed to create kitchen" }
  }
}

export async function updateKitchen(
  id: string,
  data: {
    name?: string
    location?: string
    description?: string
  },
) {
  try {
    const session = await auth()

    if (!session || !session.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const kitchen = await prisma.kitchen.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
      },
    })

    revalidatePath("/")
    return { success: true, data: kitchen }
  } catch (error) {
    console.error("Error updating kitchen:", error)
    return { success: false, error: "Failed to update kitchen" }
  }
}

export async function deleteKitchen(id: string) {
  try {
    const session = await auth()

    if (!session || !session.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    // Check if kitchen has users
    const kitchenWithUsers = await prisma.kitchen.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (kitchenWithUsers?._count.users && kitchenWithUsers._count.users > 0) {
      return {
        success: false,
        error: "Cannot delete kitchen with assigned users",
      }
    }

    await prisma.kitchen.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting kitchen:", error)
    return { success: false, error: "Failed to delete kitchen" }
  }
}
