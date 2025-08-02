import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all recipes...");

    const session = await getServerSession(authOptions);

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
          },
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

    console.log(`Found ${recipes.length} recipes`);
    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Get recipes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 },
    );
  }
}
