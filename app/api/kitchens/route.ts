import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all kitchens or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const kitchen = await prisma.kitchen.findUnique({ where: { id } });
      if (!kitchen)
        return NextResponse.json(
          { error: "Kitchen not found." },
          { status: 404 },
        );
      return NextResponse.json(kitchen);
    }
    const kitchens = await prisma.kitchen.findMany();
    return NextResponse.json(kitchens);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch kitchens." },
      { status: 500 },
    );
  }
}

// POST create kitchen
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const kitchen = await prisma.kitchen.create({ data });
    return NextResponse.json(kitchen, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create kitchen." },
      { status: 400 },
    );
  }
}

// PUT update kitchen by id (via ?id=)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Kitchen id required." },
        { status: 400 },
      );
    const data = await request.json();
    const kitchen = await prisma.kitchen.update({ where: { id }, data });
    return NextResponse.json(kitchen);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update kitchen." },
      { status: 400 },
    );
  }
}

// DELETE kitchen by id (via ?id=)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Kitchen id required." },
        { status: 400 },
      );
    await prisma.kitchen.delete({ where: { id } });
    return NextResponse.json({ message: "Kitchen deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete kitchen." },
      { status: 400 },
    );
  }
}
