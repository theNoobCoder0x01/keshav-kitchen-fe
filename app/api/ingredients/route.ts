import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all ingredients or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const ingredient = await prisma.ingredient.findUnique({ where: { id } });
      if (!ingredient)
        return NextResponse.json(
          { error: "Ingredient not found." },
          { status: 404 },
        );
      return NextResponse.json(ingredient);
    }
    const ingredients = await prisma.ingredient.findMany();
    return NextResponse.json(ingredients);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch ingredients." },
      { status: 500 },
    );
  }
}

// POST create ingredient
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const ingredient = await prisma.ingredient.create({ data });
    return NextResponse.json(ingredient, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create ingredient." },
      { status: 400 },
    );
  }
}

// PUT update ingredient by id (via ?id=)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Ingredient id required." },
        { status: 400 },
      );
    const data = await request.json();
    const ingredient = await prisma.ingredient.update({ where: { id }, data });
    return NextResponse.json(ingredient);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update ingredient." },
      { status: 400 },
    );
  }
}

// DELETE ingredient by id (via ?id=)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Ingredient id required." },
        { status: 400 },
      );
    await prisma.ingredient.delete({ where: { id } });
    return NextResponse.json({ message: "Ingredient deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete ingredient." },
      { status: 400 },
    );
  }
}
