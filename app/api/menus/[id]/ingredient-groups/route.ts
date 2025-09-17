import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET all ingredient groups for a menu
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const menuId = params.id;

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

    const ingredientGroups = await prisma.menuIngredientGroup.findMany({
      where: { menuId },
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
            sequenceNumber: true,
          },
          orderBy: [
            {
              sequenceNumber: "asc",
            },
          ],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(ingredientGroups);
  } catch (error) {
    console.error("Failed to fetch menu ingredient groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingredient groups" },
      { status: 500 },
    );
  }
}

// POST create new ingredient group
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const menuId = params.id;
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

    // Check if group name already exists for this menu
    const existingGroup = await prisma.menuIngredientGroup.findFirst({
      where: {
        menuId,
        name: data.name.trim(),
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: "Group name already exists for this menu" },
        { status: 400 },
      );
    }

    // Get the highest sort order and add 1
    const maxSortOrder = await prisma.menuIngredientGroup.aggregate({
      where: { menuId },
      _max: { sortOrder: true },
    });

    const newGroup = await prisma.menuIngredientGroup.create({
      data: {
        name: data.name.trim(),
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
        menuId,
      },
      include: {
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
            sequenceNumber: true,
          },
          orderBy: [
            {
              sequenceNumber: "asc",
            },
          ],
        },
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Failed to create menu ingredient group:", error);
    return NextResponse.json(
      { error: "Failed to create ingredient group" },
      { status: 500 },
    );
  }
}
