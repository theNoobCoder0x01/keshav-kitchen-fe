import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;

    if (!id)
      return NextResponse.json(
        { error: "Premise id required." },
        { status: 400 },
      );

    const premise = await prisma.premise.findUnique({
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

    return NextResponse.json(premise);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch premise." },
      { status: 500 },
    );
  }
}

// PUT update premise by id (via ?id=)
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

    if (!id)
      return NextResponse.json(
        { error: "Premise id required." },
        { status: 400 },
      );

    const data = await request.json();

    const premise = await prisma.premise.update({
      where: { id },
      data,
    });

    return NextResponse.json(premise);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update premise." },
      { status: 500 },
    );
  }
}

// DELETE premise by id (via ?id=)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id } = await params;

    if (!id)
      return NextResponse.json(
        { error: "Premise id required." },
        { status: 400 },
      );

    await prisma.premise.delete({ where: { id } });

    return NextResponse.json({ message: "Premise deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete premise." },
      { status: 400 },
    );
  }
}
