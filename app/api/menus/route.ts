import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all menus or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const menu = await prisma.menu.findUnique({
        where: { id },
        include: { recipe: true, kitchen: true, user: true },
      });
      if (!menu)
        return NextResponse.json({ error: "Menu not found." }, { status: 404 });
      return NextResponse.json(menu);
    }
    const menus = await prisma.menu.findMany({
      include: { recipe: true, kitchen: true, user: true },
    });
    return NextResponse.json(menus);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch menus." },
      { status: 500 },
    );
  }
}

// POST create menu
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const menu = await prisma.menu.create({ data });
    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create menu." },
      { status: 400 },
    );
  }
}

// PUT update menu by id (via ?id=)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Menu id required." }, { status: 400 });
    const data = await request.json();
    const menu = await prisma.menu.update({ where: { id }, data });
    return NextResponse.json(menu);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update menu." },
      { status: 400 },
    );
  }
}

// DELETE menu by id (via ?id=)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Menu id required." }, { status: 400 });
    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ message: "Menu deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete menu." },
      { status: 400 },
    );
  }
}
