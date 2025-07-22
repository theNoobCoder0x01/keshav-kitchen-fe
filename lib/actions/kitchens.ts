"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getKitchens() {
  try {
    const kitchens = await prisma.kitchen.findMany({
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

    return kitchens
  } catch (error) {
    console.error("Error fetching kitchens:", error)
    throw new Error("Failed to fetch kitchens")
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
                category: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
        reports: {
          orderBy: {
            date: "desc",
          },
        },
      },
    })

    return kitchen
  } catch (error) {
    console.error("Error fetching kitchen:", error)
    throw new Error("Failed to fetch kitchen")
  }
}

export async function createKitchen(data: {
  name: string
  location?: string
  description?: string
}) {
  try {
    const kitchen = await prisma.kitchen.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
      },
    })

    revalidatePath("/")
    return kitchen
  } catch (error) {
    console.error("Error creating kitchen:", error)
    throw new Error("Failed to create kitchen")
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
    const kitchen = await prisma.kitchen.update({
      where: { id },
      data,
    })

    revalidatePath("/")
    return kitchen
  } catch (error) {
    console.error("Error updating kitchen:", error)
    throw new Error("Failed to update kitchen")
  }
}

export async function deleteKitchen(id: string) {
  try {
    await prisma.kitchen.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting kitchen:", error)
    throw new Error("Failed to delete kitchen")
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
      totalKitchens,
      totalUsers,
      totalMenus,
      totalReports,
      kitchens: stats,
    }
  } catch (error) {
    console.error("Error fetching kitchen stats:", error)
    throw new Error("Failed to fetch kitchen stats")
  }
}
