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

    const { searchParams } = new URL(request.url);
    const epochMs = parseInt(searchParams.get("epochMs") || "");

    if (!epochMs) {
      return NextResponse.json(
        { error: "epochMs is required" },
        { status: 400 },
      );
    }

    const date = new Date(epochMs);
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );

    const menus = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
        recipe: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          kitchen: {
            name: "asc",
          },
        },
        {
          mealType: "asc",
        },
        {
          recipe: {
            name: "asc",
          },
        },
      ],
    });

    const data = menus.map((menu) => ({
      kitchenId: menu.kitchenId,
      kitchenName: menu.kitchen.name,
      mealType: menu.mealType,
      recipeId: menu.recipeId,
      recipeName: menu.recipe.name,
      ghanFactor: menu.ghanFactor,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get cook report data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cook report data" },
      { status: 500 },
    );
  }
}
