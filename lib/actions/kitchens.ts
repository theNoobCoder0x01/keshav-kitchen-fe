"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getKitchens() {
  try {
    const session = await auth();

    if (!session?.user) {
      return [];
    }

    const kitchens = await prisma.kitchen.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            users: true,
            menus: true,
            reports: true,
          },
        },
      },
    });
    return kitchens;
  } catch (error) {
    console.error("Get kitchens error:", error);
    return [];
  }
}

export async function getKitchen(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
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
            menus: true,
            reports: true,
          },
        },
      },
    });

    return kitchen;
  } catch (error) {
    console.error("Get kitchen error:", error);
    throw error;
  }
}

export async function createKitchen(data: {
  name: string;
  location?: string;
  description?: string;
}) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
      },
    });

    revalidatePath("/");
    return kitchen;
  } catch (error) {
    console.error("Create kitchen error:", error);
    throw error;
  }
}

export async function updateKitchen(
  id: string,
  data: {
    name?: string;
    location?: string;
    description?: string;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const kitchen = await prisma.kitchen.update({
      where: { id },
      data,
    });

    revalidatePath("/");
    return kitchen;
  } catch (error) {
    console.error("Update kitchen error:", error);
    throw error;
  }
}

export async function deleteKitchen(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Check if kitchen has any users or menus
    const kitchen = await prisma.kitchen.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            menus: true,
            reports: true,
          },
        },
      },
    });

    if (!kitchen) {
      throw new Error("Kitchen not found");
    }

    if (
      kitchen._count.users > 0 ||
      kitchen._count.menus > 0 ||
      kitchen._count.reports > 0
    ) {
      throw new Error(
        "Cannot delete kitchen with existing users, menus, or reports"
      );
    }

    await prisma.kitchen.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete kitchen error:", error);
    throw error;
  }
}
