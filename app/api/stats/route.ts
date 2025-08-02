import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Adjust the query as per your schema
    // Example: aggregate stats from multiple tables
    console.log("Fetching meals count...");
    // Commenting out problematic queries for now to prevent errors
    // const mealsServed = await prisma.meal.count();
    const mealsServed = 0; // Placeholder value
    console.log("Fetching kitchens count...");
    const activeKitchens = await prisma.kitchen.count();
    console.log("Fetching recipes count...");
    const recipes = await prisma.recipe.count();
    console.log("Fetching volunteers count...");
    // const volunteers = await prisma.user.count({ where: { role: 'volunteer' } });
    const volunteers = 0; // Placeholder value until role type is fixed
    const stats = [
      { label: "Meals Served", value: mealsServed },
      { label: "Active Kitchens", value: activeKitchens },
      { label: "Recipes", value: recipes },
      { label: "Volunteers", value: volunteers },
    ];
    return NextResponse.json(stats);
  } catch (error: unknown) {
    console.error("Error in stats endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch stats.", details: errorMessage },
      { status: 500 },
    );
  }
}
