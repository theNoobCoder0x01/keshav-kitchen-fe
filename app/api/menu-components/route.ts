import { prisma } from "@/lib/prisma";
import { MealType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get("mealType") as MealType | null;
    const menuComponents = await prisma.menuComponent.findMany({
      where: mealType ? { mealType } : {},
      orderBy: [{ sequenceNumber: "asc" }],
    });
    return NextResponse.json(menuComponents);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch menu components" },
      { status: 500 }
    );
  }
}
