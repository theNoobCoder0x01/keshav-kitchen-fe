import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET menu by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
          },
        },
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            costPerUnit: true,
            sequenceNumber: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
                sortOrder: true,
              },
            },
          },
          orderBy: [
            {
              sequenceNumber: "asc",
            },
          ],
        },
        ingredientGroups: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        kitchen: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found." }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu." },
      { status: 500 }
    );
  }
}

// PUT/PATCH update menu by id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const data = await request.json();

    // Extract ingredients and ingredient groups management fields from data
    const {
      ingredients = [],
      deletedIngredientGroupIds = [],
      ingredientGroups = [],
      ...menuData
    } = data || {};

    // Perform all updates in a single transaction to keep IDs in sync
    const updatedMenu = await prisma.$transaction(async (tx: any) => {
      // Handle deleted groups first (if any)
      if (Array.isArray(deletedIngredientGroupIds) && deletedIngredientGroupIds.length > 0) {
        await tx.menuIngredientGroup.deleteMany({
          where: { id: { in: deletedIngredientGroupIds }, menuId: id },
        });
      }

      // Upsert/update ingredient groups and build id map for temporary IDs
      const groupIdMap = new Map<string, string>();
      if (Array.isArray(ingredientGroups)) {
        for (const group of ingredientGroups as Array<{ id?: string; name: string; sortOrder?: number }>) {
          const sortOrder = group.sortOrder ?? 0;
          if (group.id && !group.id.startsWith("temp_")) {
            const existing = await tx.menuIngredientGroup.findFirst({
              where: { id: group.id, menuId: id },
              select: { id: true },
            });
            if (existing) {
              await tx.menuIngredientGroup.update({
                where: { id: group.id },
                data: { name: group.name, sortOrder },
              });
              groupIdMap.set(group.id, group.id);
            } else {
              const created = await tx.menuIngredientGroup.create({
                data: { name: group.name, sortOrder, menuId: id },
              });
              groupIdMap.set(group.id, created.id);
            }
          } else {
            const created = await tx.menuIngredientGroup.create({
              data: { name: group.name, sortOrder, menuId: id },
            });
            if (group.id) {
              groupIdMap.set(group.id, created.id);
            }
          }
        }
      }

      // Update the menu core fields
      await tx.menu.update({ where: { id }, data: { ...menuData } });

      // Recreate ingredients with correct group associations
      await tx.menuIngredient.deleteMany({ where: { menuId: id } });
      if (Array.isArray(ingredients) && ingredients.length > 0) {
        const ingredientData = ingredients.map((ing: any) => {
          let finalGroupId: string | null = null;
          if (ing.groupId) {
            finalGroupId = groupIdMap.get(ing.groupId) ?? ing.groupId;
          }
          return {
            menuId: id,
            name: ing.name,
            quantity: Number(ing.quantity) || 0,
            unit: ing.unit,
            costPerUnit: ing.costPerUnit != null ? Number(ing.costPerUnit) : null,
            sequenceNumber:
              ing.sequenceNumber != null ? Number(ing.sequenceNumber) : null,
            groupId: finalGroupId,
          };
        });
        await tx.menuIngredient.createMany({ data: ingredientData });
      }

      // Return the updated menu with relations
      return await tx.menu.findUnique({
        where: { id },
        include: {
          recipe: {
            select: { id: true, name: true, description: true, category: true },
          },
          ingredients: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unit: true,
              costPerUnit: true,
              sequenceNumber: true,
              groupId: true,
              group: { select: { id: true, name: true, sortOrder: true } },
            },
            orderBy: [{ sequenceNumber: "asc" }],
          },
          ingredientGroups: {
            select: { id: true, name: true, sortOrder: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
          kitchen: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      });
    });

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error("Update menu API error:", error);
    return NextResponse.json(
      { error: "Failed to update menu." },
      { status: 400 }
    );
  }
}

// DELETE menu by id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ message: "Menu deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete menu." },
      { status: 400 }
    );
  }
}
