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

    // Fetch distinct categories
    const categoriesResult = await prisma.recipe.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    });

    // Fetch distinct subcategories
    const subcategoriesResult = await prisma.recipe.findMany({
      select: {
        subcategory: true,
      },
      distinct: ["subcategory"],
      where: {
        subcategory: {
          not: undefined,
        },
      },
      orderBy: {
        subcategory: "asc",
      },
    });

    const categories = categoriesResult
      .map((item) => item.category)
      .filter(Boolean);

    const subcategories = subcategoriesResult
      .map((item) => item.subcategory)
      .filter(Boolean) as string[];

    return NextResponse.json({
      categories,
      subcategories,
    });
  } catch (error) {
    console.error("Get recipe filters API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe filters" },
      { status: 500 }
    );
  }
}
