import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                sortOrder: true,
              },
            },
          },
        },
        ingredientGroups: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
            ingredients: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unit: true,
                costPerUnit: true,
              },
              orderBy: {
                name: "asc",
              },
            },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            menus: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Get recipes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}
