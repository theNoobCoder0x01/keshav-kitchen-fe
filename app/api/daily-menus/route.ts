import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all daily menus or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const dailyMenu = await prisma.dailyMenu.findUnique({ where: { id } });
      if (!dailyMenu)
        return NextResponse.json(
          { error: "Daily menu not found." },
          { status: 404 },
        );
      return NextResponse.json(dailyMenu);
    }
    const dailyMenus = await prisma.dailyMenu.findMany();
    return NextResponse.json(dailyMenus);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch daily menus." },
      { status: 500 },
    );
  }
}

// POST create daily menu
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const dailyMenu = await prisma.dailyMenu.create({ data });
    return NextResponse.json(dailyMenu, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create daily menu." },
      { status: 400 },
    );
  }
}

// PUT update daily menu by id (via ?id=)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Daily menu id required." },
        { status: 400 },
      );
    const data = await request.json();
    const dailyMenu = await prisma.dailyMenu.update({ where: { id }, data });
    return NextResponse.json(dailyMenu);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update daily menu." },
      { status: 400 },
    );
  }
}

// DELETE daily menu by id (via ?id=)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Daily menu id required." },
        { status: 400 },
      );
    await prisma.dailyMenu.delete({ where: { id } });
    return NextResponse.json({ message: "Daily menu deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete daily menu." },
      { status: 400 },
    );
  }
}
