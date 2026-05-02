import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function parsePayload(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const sequenceNumber = Number(body.sequenceNumber);

  return { name, description, sequenceNumber };
}

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; personTypeId: string }>;
  },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id: kitchenId, personTypeId } = await params;

    if (!kitchenId || !personTypeId) {
      return NextResponse.json(
        { error: "Kitchen person type id required." },
        { status: 400 },
      );
    }

    const existingPersonType = await prisma.kitchenPersonType.findFirst({
      where: { id: personTypeId, kitchenId },
      select: { id: true },
    });

    if (!existingPersonType) {
      return NextResponse.json(
        { error: "Kitchen person type not found." },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, description, sequenceNumber } = parsePayload(body);

    if (!name || Number.isNaN(sequenceNumber)) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const updatedPersonType = await prisma.kitchenPersonType.update({
      where: { id: personTypeId },
      data: {
        name,
        description: description || null,
        sequenceNumber,
      },
    });

    return NextResponse.json(updatedPersonType);
  } catch {
    return NextResponse.json(
      { error: "Failed to update kitchen person type." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; personTypeId: string }>;
  },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id: kitchenId, personTypeId } = await params;

    if (!kitchenId || !personTypeId) {
      return NextResponse.json(
        { error: "Kitchen person type id required." },
        { status: 400 },
      );
    }

    const existingPersonType = await prisma.kitchenPersonType.findFirst({
      where: { id: personTypeId, kitchenId },
      select: { id: true },
    });

    if (!existingPersonType) {
      return NextResponse.json(
        { error: "Kitchen person type not found." },
        { status: 404 },
      );
    }

    await prisma.kitchenPersonType.delete({
      where: { id: personTypeId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete kitchen person type." },
      { status: 500 },
    );
  }
}
