"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getKitchens() {
  try {
    const kitchens = await prisma.kitchen.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        menus: {
          select: {
            id: true,
            date: true,
            mealType: true,
          },
        },
        reports: {
          select: {
            id: true,
            date: true,
            visitorCount: true,
          },
        },
        _count: {
          select: {
            users: true,
            menus: true,
            reports: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return { success: true, data: kitchens }
  } catch (error) {
    console.error("Error fetching kitchens:", error)
    return { success: false, error: "Failed to fetch kitchens" }
  }
}

export async function getKitchenById(id: string) {
  try {
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
        menus: {
          include: {
            recipe: {
              select: {
                name: true,
                servings: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
          take: 10,
        },
        reports: {
          orderBy: {
            date: "desc",
          },
          take: 5,
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
  location: string
  description?: string
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
      },
    })

    revalidatePath("/kitchens")
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
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const kitchen = await prisma.kitchen.update({
      where: { id },
      data,
    })

    revalidatePath("/kitchens")
    return { success: true, data: kitchen }
  } catch (error) {
    console.error("Error updating kitchen:", error)
    return { success: false, error: "Failed to update kitchen" }
  }
}

export async function deleteKitchen(id: string) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.kitchen.delete({
      where: { id },
    })

    revalidatePath("/kitchens")
    return { success: true }
  } catch (error) {
    console.error("Error deleting kitchen:", error)
    return { success: false, error: "Failed to delete kitchen" }
  }
}

export async function getKitchenStats() {
  try {
    const stats = await prisma.kitchen.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
            menus: true,
            reports: true,
          },
        },
      },
    })

    const totalKitchens = stats.length
    const totalUsers = stats.reduce((sum, kitchen) => sum + kitchen._count.users, 0)
    const totalMenus = stats.reduce((sum, kitchen) => sum + kitchen._count.menus, 0)
    const totalReports = stats.reduce((sum, kitchen) => sum + kitchen._count.reports, 0)

    return {
      success: true,
      data: {
        totalKitchens,
        totalUsers,
        totalMenus,
        totalReports,
        kitchens: stats,
      },
    }
  } catch (error) {
    console.error("Error fetching kitchen stats:", error)
    return { success: false, error: "Failed to fetch kitchen stats" }
  }
}
