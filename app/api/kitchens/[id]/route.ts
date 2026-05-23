import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET kitchen by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;

    const kitchen = await prisma.kitchen.findUnique({
      where: { id },
    });

    if (!kitchen) {
      return NextResponse.json({ error: "Kitchen not found." }, { status: 404 });
    }

    return NextResponse.json(kitchen);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch kitchen." },
      { status: 500 },
    );
  }
}

// PUT update kitchen
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    if (!data.name || !String(data.name).trim()) {
      return NextResponse.json(
        { error: "Kitchen name is required." },
        { status: 400 },
      );
    }

    const kitchen = await prisma.kitchen.update({
      where: { id },
      data: {
        name: String(data.name).trim(),
        description: data.description ? String(data.description).trim() : null,
        defaultCook: data.defaultCook ? String(data.defaultCook).trim() : null,
      },
    });

    return NextResponse.json(kitchen);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update kitchen." },
      { status: 500 },
    );
  }
}

// DELETE kitchen
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.kitchen.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // FK constraint: menus reference this kitchen
    if (error?.code === "P2003" || error?.code === "P2025") {
      return NextResponse.json(
        { error: "Cannot delete a kitchen that has associated menus." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to delete kitchen." },
      { status: 500 },
    );
  }
}
