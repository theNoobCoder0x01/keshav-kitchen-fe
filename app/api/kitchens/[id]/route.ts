import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;

    if (!id)
      return NextResponse.json(
        { error: "Kitchen id required." },
        { status: 400 }
      );

    const kitchen = await prisma.kitchen.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            menus: true,
            reports: true,
          },
        },
      },
    });

    return NextResponse.json(kitchen);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch kitchen." },
      { status: 500 }
    );
  }
}

// PUT update kitchen by id (via ?id=)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;

    if (!id)
      return NextResponse.json(
        { error: "Kitchen id required." },
        { status: 400 }
      );

    const data = await request.json();

    const kitchen = await prisma.kitchen.update({
      where: { id },
      data,
    });

    return NextResponse.json(kitchen);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update kitchen." },
      { status: 500 }
    );
  }
}

// DELETE kitchen by id (via ?id=)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;

    if (!id)
      return NextResponse.json(
        { error: "Kitchen id required." },
        { status: 400 }
      );

    await prisma.kitchen.delete({ where: { id } });

    return NextResponse.json({ message: "Kitchen deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete kitchen." },
      { status: 400 }
    );
  }
}
