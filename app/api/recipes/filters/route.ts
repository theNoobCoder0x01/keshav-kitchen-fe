import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/recipes/filters?category=CategoryName
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryParam = (searchParams.get("category") || "").trim();
    const categoryFilter = categoryParam && categoryParam !== "all" ? categoryParam : undefined;

    // Fetch distinct categories
    const categoriesRows = await prisma.recipe.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    const categories = categoriesRows
      .map((r) => r.category)
      .filter((c) => !!c && c.trim() !== "");

    // Fetch distinct subcategories, optionally filtered by category
    const subcategoriesRows = await prisma.recipe.findMany({
      where: categoryFilter ? { category: categoryFilter } : undefined,
      select: { subcategory: true },
      distinct: ["subcategory"],
      orderBy: { subcategory: "asc" },
    });
    const subcategories = subcategoriesRows
      .map((r) => r.subcategory)
      .filter((s) => !!s && s.trim() !== "");

    return NextResponse.json({ categories, subcategories });
  } catch (error) {
    console.error("Recipes filters API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 },
    );
  }
}
