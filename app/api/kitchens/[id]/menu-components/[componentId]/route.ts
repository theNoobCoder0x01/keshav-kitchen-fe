import { prisma } from "@/lib/prisma";
import { MenuComponentSchema } from "@/lib/validations/menu-component";
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

// PUT: Update a menu component
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; componentId: string }> },
) {
  const { id: kitchenId, componentId } = await params;
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

    const existingComponent = await prisma.menuComponent.findFirst({
      where: {
        id: componentId,
        kitchenId,
      },
      select: {
        id: true,
      },
    });

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Menu component not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.menuComponent.update({
      where: { id: componentId },
      data: {
        name: parsed.data.name,
        label: parsed.data.label,
        mealType: parsed.data.mealType,
        sequenceNumber: parsed.data.sequenceNumber,
        kitchenId,
        averages: {
          deleteMany: {},
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
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update menu component" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a menu component
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; componentId: string }> },
) {
  const { id: kitchenId, componentId } = await params;
  try {
    const deletedCount = await prisma.menuComponent.deleteMany({
      where: {
        id: componentId,
        kitchenId,
      },
    });

    if (deletedCount.count === 0) {
      return NextResponse.json(
        { error: "Menu component not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete menu component" },
      { status: 500 },
    );
  }
}
