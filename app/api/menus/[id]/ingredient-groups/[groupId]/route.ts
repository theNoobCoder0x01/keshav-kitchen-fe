import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PUT update ingredient group
export async function PUT(
  request: Request,
  { params }: { params: { id: string; groupId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: menuId, groupId } = params;
    const data = await request.json();

    // Validate required fields
    if (!data.name || typeof data.name !== "string") {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 },
      );
    }

    // Verify menu exists and user has access
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        user: { select: { id: true } },
        kitchen: { select: { id: true } },
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Check if user has access to this menu's kitchen
    if (
      menu.user.id !== session.user.id &&
      menu.kitchen.id !== session.user.kitchenId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if group exists
    const existingGroup = await prisma.menuIngredientGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Ingredient group not found" },
        { status: 404 },
      );
    }

    // Check if new name conflicts with other groups
    const conflictingGroup = await prisma.menuIngredientGroup.findFirst({
      where: {
        menuId,
        name: data.name.trim(),
        id: { not: groupId },
      },
    });

    if (conflictingGroup) {
      return NextResponse.json(
        { error: "Group name already exists for this menu" },
        { status: 400 },
      );
    }

    // Update the group
    const updatedGroup = await prisma.menuIngredientGroup.update({
      where: { id: groupId },
      data: {
        name: data.name.trim(),
        sortOrder:
          data.sortOrder !== undefined
            ? data.sortOrder
            : existingGroup.sortOrder,
      },
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Failed to update menu ingredient group:", error);
    return NextResponse.json(
      { error: "Failed to update ingredient group" },
      { status: 500 },
    );
  }
}

// DELETE ingredient group
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; groupId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: menuId, groupId } = params;

    // Verify menu exists and user has access
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        user: { select: { id: true } },
        kitchen: { select: { id: true } },
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Check if user has access to this menu's kitchen
    if (
      menu.user.id !== session.user.id &&
      menu.kitchen.id !== session.user.kitchenId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if group exists
    const existingGroup = await prisma.menuIngredientGroup.findUnique({
      where: { id: groupId },
      include: { ingredients: true },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Ingredient group not found" },
        { status: 404 },
      );
    }

    // Move all ingredients to ungrouped (set groupId to null)
    if (existingGroup.ingredients.length > 0) {
      await prisma.menuIngredient.updateMany({
        where: { groupId },
        data: { groupId: null },
      });
    }

    // Delete the group
    await prisma.menuIngredientGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({
      message: "Ingredient group deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete menu ingredient group:", error);
    return NextResponse.json(
      { error: "Failed to delete ingredient group" },
      { status: 500 },
    );
  }
}
