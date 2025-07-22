"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getKitchens() {
  try {
    const kitchens = await prisma.kitchen.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            dailyMenus: true,
          },
        },
      },
    })

    return kitchens.map((kitchen) => ({
      id: kitchen.id,
      name: kitchen.name,
      location: kitchen.location,
      isActive: kitchen.isActive,
      userCount: kitchen._count.users,
      menuCount: kitchen._count.dailyMenus,
      createdAt: kitchen.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching kitchens:", error)
    throw new Error("Failed to fetch kitchens")
  }
}

export async function createKitchen(data: {
  name: string
  location?: string
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name: data.name,
        location: data.location,
        isActive: true,
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
    isActive?: boolean
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

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
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    await prisma.kitchen.update({
      where: { id },
      data: { isActive: false },
    })

    revalidatePath("/")
  } catch (error) {
    console.error("Error deleting kitchen:", error)
    throw new Error("Failed to delete kitchen")
  }
}
