import { prisma } from "@/lib/prisma";
import { MealType } from "@prisma/client";
import { NextResponse } from "next/server";

// GET: List menu components for a kitchen
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: kitchenId } = await params;

  const { searchParams } = new URL(request.url);
  const mealType = searchParams.get("mealType");

  if (!mealType || !Object.values(MealType).includes(mealType as MealType))
    return NextResponse.json(
      { error: "Failed to fetch menu components" },
      { status: 500 }
    );
  try {
    const menuComponents = await prisma.menuComponent.findMany({
      where: { kitchenId, mealType: mealType as MealType },
      orderBy: { sequenceNumber: "asc" },
    });
    return NextResponse.json(menuComponents);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch menu components" },
      { status: 500 }
    );
  }
}

// POST: Add a new menu component to a kitchen
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: kitchenId } = await params;
  try {
    const body = await request.json();
    const { name, label, mealType, sequenceNumber } = body;
    if (!name || !label || !mealType || sequenceNumber === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const menuComponent = await prisma.menuComponent.create({
      data: {
        name,
        label,
        mealType,
        sequenceNumber,
        kitchenId,
      },
    });
    return NextResponse.json(menuComponent, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create menu component" },
      { status: 500 }
    );
  }
}
