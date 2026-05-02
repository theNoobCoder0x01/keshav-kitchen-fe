import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStartOfDayUTC, parseISOString } from "@/lib/utils/date";
import { MealType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseDateFromRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const epochMs = searchParams.get("epochMs");
  const dateISOString = searchParams.get("date");
  const date = epochMs
    ? new Date(parseInt(epochMs))
    : dateISOString
      ? parseISOString(dateISOString)
      : new Date();

  return createStartOfDayUTC(date);
}

function isMealType(value: string | null): value is MealType {
  return !!value && Object.values(MealType).includes(value as MealType);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: kitchenId } = await params;
    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get("mealType");
    const date = parseDateFromRequest(request);

    const counts = await prisma.kitchenMealPersonCount.findMany({
      where: {
        kitchenId,
        date,
        ...(isMealType(mealType) ? { mealType } : {}),
      },
      include: {
        personType: {
          select: {
            id: true,
            name: true,
            description: true,
            sequenceNumber: true,
          },
        },
      },
      orderBy: [
        { mealType: "asc" },
        { personType: { sequenceNumber: "asc" } },
      ],
    });

    return NextResponse.json(counts);
  } catch (error) {
    console.error("Failed to fetch meal person counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal person counts." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: kitchenId } = await params;
    const body = await request.json();
    const date = body.epochMs
      ? createStartOfDayUTC(new Date(Number(body.epochMs)))
      : body.date
        ? createStartOfDayUTC(parseISOString(body.date))
        : null;

    if (
      !date ||
      !isMealType(body.mealType) ||
      !body.personTypeId ||
      body.count == null
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: epochMs/date, mealType, personTypeId, count",
        },
        { status: 400 },
      );
    }

    const count = Math.max(0, Math.floor(Number(body.count) || 0));

    const personType = await prisma.kitchenPersonType.findFirst({
      where: {
        id: body.personTypeId,
        kitchenId,
      },
      select: { id: true },
    });

    if (!personType) {
      return NextResponse.json(
        { error: "Person type does not belong to this kitchen." },
        { status: 400 },
      );
    }

    if (count === 0) {
      await prisma.kitchenMealPersonCount.deleteMany({
        where: {
          date,
          kitchenId,
          mealType: body.mealType,
          personTypeId: body.personTypeId,
        },
      });

      return NextResponse.json({ success: true, count: null });
    }

    const saved = await prisma.kitchenMealPersonCount.upsert({
      where: {
        date_kitchenId_mealType_personTypeId: {
          date,
          kitchenId,
          mealType: body.mealType,
          personTypeId: body.personTypeId,
        },
      },
      create: {
        date,
        kitchenId,
        mealType: body.mealType,
        personTypeId: body.personTypeId,
        count,
      },
      update: {
        count,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Failed to save meal person count:", error);
    return NextResponse.json(
      { error: "Failed to save meal person count." },
      { status: 500 },
    );
  }
}
