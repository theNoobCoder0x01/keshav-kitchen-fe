import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT: Update a menu component
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; componentId: string }> },
) {
  const { id: kitchenId, componentId } = await params;
  try {
    const body = await request.json();
    const { name, label, mealType, sequenceNumber } = body;
    const updated = await prisma.menuComponent.update({
      where: { id: componentId },
      data: {
        name,
        label,
        mealType,
        sequenceNumber,
        kitchenId,
      },
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
  const { componentId } = await params;
  try {
    await prisma.menuComponent.delete({
      where: { id: componentId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete menu component" },
      { status: 500 },
    );
  }
}
