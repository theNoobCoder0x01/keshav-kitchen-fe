import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST assign ingredient to group
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.ingredientId || !data.menuId) {
      return NextResponse.json(
        { error: "Missing required fields: ingredientId, menuId" },
        { status: 400 },
      );
    }

    // Verify menu exists and user has access
    const menu = await prisma.menu.findUnique({
      where: { id: data.menuId },
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

    // Verify ingredient exists and belongs to this menu
    const ingredient = await prisma.menuIngredient.findUnique({
      where: { id: data.ingredientId },
    });

    if (!ingredient || ingredient.menuId !== data.menuId) {
      return NextResponse.json(
        { error: "Ingredient not found" },
        { status: 404 },
      );
    }

    // If groupId is provided, verify it exists and belongs to this menu
    if (data.groupId) {
      const group = await prisma.menuIngredientGroup.findUnique({
        where: { id: data.groupId },
      });

      if (!group || group.menuId !== data.menuId) {
        return NextResponse.json(
          { error: "Ingredient group not found" },
          { status: 404 },
        );
      }
    }

    // Update the ingredient's group
    const updatedIngredient = await prisma.menuIngredient.update({
      where: { id: data.ingredientId },
      data: { groupId: data.groupId || null },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
          },
        },
      },
    });

    return NextResponse.json(updatedIngredient);
  } catch (error) {
    console.error("Failed to assign ingredient to group:", error);
    return NextResponse.json(
      { error: "Failed to assign ingredient to group" },
      { status: 500 },
    );
  }
}

// PUT bulk assign ingredients to group
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (
      !data.ingredientIds ||
      !Array.isArray(data.ingredientIds) ||
      !data.menuId
    ) {
      return NextResponse.json(
        { error: "Missing required fields: ingredientIds (array), menuId" },
        { status: 400 },
      );
    }

    // Verify menu exists and user has access
    const menu = await prisma.menu.findUnique({
      where: { id: data.menuId },
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

    // If groupId is provided, verify it exists and belongs to this menu
    if (data.groupId) {
      const group = await prisma.menuIngredientGroup.findUnique({
        where: { id: data.groupId },
      });

      if (!group || group.menuId !== data.menuId) {
        return NextResponse.json(
          { error: "Ingredient group not found" },
          { status: 404 },
        );
      }
    }

    // Verify all ingredients exist and belong to this menu
    const ingredients = await prisma.menuIngredient.findMany({
      where: {
        id: { in: data.ingredientIds },
        menuId: data.menuId,
      },
    });

    if (ingredients.length !== data.ingredientIds.length) {
      return NextResponse.json(
        { error: "Some ingredients not found or don't belong to this menu" },
        { status: 400 },
      );
    }

    // Update all ingredients' groups
    const updatedIngredients = await prisma.menuIngredient.updateMany({
      where: {
        id: { in: data.ingredientIds },
        menuId: data.menuId,
      },
      data: { groupId: data.groupId || null },
    });

    return NextResponse.json({
      message: `Updated ${updatedIngredients.count} ingredients`,
      count: updatedIngredients.count,
    });
  } catch (error) {
    console.error("Failed to bulk assign ingredients to group:", error);
    return NextResponse.json(
      { error: "Failed to bulk assign ingredients to group" },
      { status: 500 },
    );
  }
}
