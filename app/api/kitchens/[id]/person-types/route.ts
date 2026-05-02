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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id: kitchenId } = await params;

    if (!kitchenId) {
      return NextResponse.json(
        { error: "Kitchen id required." },
        { status: 400 },
      );
    }

    const personTypes = await prisma.kitchenPersonType.findMany({
      where: { kitchenId },
      orderBy: [{ sequenceNumber: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(personTypes);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch kitchen person types." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const { id: kitchenId } = await params;

    if (!kitchenId) {
      return NextResponse.json(
        { error: "Kitchen id required." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name, description, sequenceNumber } = parsePayload(body);

    if (
      !name ||
      !Number.isFinite(sequenceNumber) ||
      !Number.isInteger(sequenceNumber) ||
      sequenceNumber < 1
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const personType = await prisma.kitchenPersonType.create({
      data: {
        name,
        description: description || null,
        sequenceNumber,
        kitchenId,
      },
    });

    return NextResponse.json(personType, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create kitchen person type." },
      { status: 500 },
    );
  }
}
