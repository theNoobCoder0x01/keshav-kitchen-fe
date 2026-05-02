import { prisma } from "@/lib/prisma";
import { MenuComponentSchema } from "@/lib/validations/menu-component";
import { MealType } from "@prisma/client";
import { NextResponse } from "next/server";

const menuComponentInclude = {
  averages: {
    include: {
      personType: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      personType: {
        sequenceNumber: "asc",
      },
    },
  },
} as const;

// GET: List menu components for a kitchen
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitchenId } = await params;

  const { searchParams } = new URL(request.url);
  const mealType = searchParams.get("mealType");

  const whereClause: {
    kitchenId: string;
    mealType?: MealType;
  } = {
    kitchenId,
  };

  if (mealType && Object.values(MealType).includes(mealType as MealType)) {
    whereClause["mealType"] = mealType as MealType;
  }

  try {
    const menuComponents = await prisma.menuComponent.findMany({
      where: whereClause,
      orderBy: { sequenceNumber: "asc" },
      include: menuComponentInclude,
    });
    return NextResponse.json(menuComponents);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch menu components" },
      { status: 500 },
    );
  }
}

// POST: Add a new menu component to a kitchen
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitchenId } = await params;
  try {
    const body = await request.json();
    const parsed = MenuComponentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid menu component payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const personTypeIds = parsed.data.averages.map(
      (average) => average.personTypeId,
    );
    const personTypeCount = await prisma.kitchenPersonType.count({
      where: {
        kitchenId,
        id: {
          in: personTypeIds,
        },
      },
    });

    if (personTypeCount !== personTypeIds.length) {
      return NextResponse.json(
        { error: "One or more person types do not belong to this kitchen" },
        { status: 400 },
      );
    }

    const menuComponent = await prisma.menuComponent.create({
      data: {
        name: parsed.data.name,
        label: parsed.data.label,
        mealType: parsed.data.mealType,
        sequenceNumber: parsed.data.sequenceNumber,
        kitchenId,
        averages: {
          create: parsed.data.averages.map((average) => ({
            personTypeId: average.personTypeId,
            quantity: average.quantity,
            unit: average.unit,
            weightPerPiece:
              average.unit === "pcs" ? average.weightPerPiece : null,
            weightPerPieceUnit:
              average.unit === "pcs" ? average.weightPerPieceUnit : null,
          })),
        },
      },
      include: menuComponentInclude,
    });
    return NextResponse.json(menuComponent, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create menu component" },
      { status: 500 },
    );
  }
}
