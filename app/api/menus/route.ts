import { authOptions } from "@/lib/auth";
import { normalizeUnit } from "@/lib/constants/units";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createEndOfDayUTC,
  createStartOfDayUTC,
  parseISOString,
} from "@/lib/utils/date";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET all menus or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const premiseId = searchParams.get("premiseId");
    const epochMs = searchParams.get("epochMs");
    const dateISOString = searchParams.get("date");
    const date = epochMs
      ? new Date(parseInt(epochMs))
      : dateISOString
        ? parseISOString(dateISOString)
        : new Date();

    // Build where clause for filtering
    const where: any = {};

    if (premiseId) {
      where.premiseId = premiseId;
    }

    if (date) {
      // Parse date string and create UTC day boundaries for database queries
      const targetDate = date;
      const startOfDay = createStartOfDayUTC(targetDate);
      const endOfDay = createEndOfDayUTC(targetDate);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        menuComponent: {
          select: {
            id: true,
            name: true,
            label: true,
            mealType: true,
            sequenceNumber: true,
          },
        },
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
        premise: {
          select: {
            id: true,
            name: true,
            sequenceNumber: true,
          },
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
      orderBy: [
        { premise: { sequenceNumber: "asc" } },
        { mealType: "asc" },
        { createdAt: "asc" },
      ],
    });
    return NextResponse.json(menus);
  } catch (error) {
    console.error("Failed to fetch menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus." },
      { status: 500 },
    );
  }
}

const menuWriteInclude: Prisma.MenuInclude = {
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
  premise: { select: { id: true, name: true } },
  kitchen: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
};

// POST create (or upsert) a menu.
//
// The Daily Menu Builder treats each premise + day + mealType + menuComponent
// "slot" as holding a single menu, so when a slot already has a menu we update
// it in place instead of creating a duplicate. Ad-hoc rows (no menuComponentId)
// always create, then the client switches to PUT using the returned id.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.mealType || !data.premiseId || !data.userId || !data.kitchenId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: mealType, premiseId, userId, kitchenId",
        },
        { status: 400 },
      );
    }

    // Normalize date if epochMs provided
    if (data.epochMs) {
      data.date = new Date(data.epochMs);
    }

    // Extract ingredients and ingredientGroups from payload
    const {
      ingredients = [],
      ingredientGroups = [],
      deletedIngredientGroupIds,
      epochMs,
      ...menuData
    } = data;

    menuData.recipeId = menuData.recipeId || null;

    const scalarData = {
      ...menuData,
      // `notes` is nullable in the Prisma schema, but some databases have it as
      // NOT NULL (migration drift). The existing dialog always sends a notes
      // string so it never hits this; default null/blank to "" to stay safe.
      notes: menuData.notes ?? "",
      preparedQuantity:
        menuData.preparedQuantity != null
          ? Number(menuData.preparedQuantity)
          : undefined,
      preparedQuantityUnit: menuData.preparedQuantityUnit
        ? normalizeUnit(menuData.preparedQuantityUnit)
        : undefined,
      servingQuantity:
        menuData.servingQuantity != null
          ? Number(menuData.servingQuantity)
          : undefined,
      servingQuantityUnit: menuData.servingQuantityUnit
        ? normalizeUnit(menuData.servingQuantityUnit)
        : undefined,
      quantityPerPiece:
        menuData.quantityPerPiece != null
          ? Number(menuData.quantityPerPiece)
          : undefined,
      ghanFactor:
        menuData.ghanFactor != null ? Number(menuData.ghanFactor) : undefined,
      date: data.date ?? undefined,
    };

    const menu = await prisma.$transaction(async (tx) => {
      // Resolve an existing slot menu (idempotent upsert) when this is a
      // component slot rather than an ad-hoc row.
      let existingId: string | null = null;
      if (menuData.menuComponentId && data.date) {
        const existing = await tx.menu.findFirst({
          where: {
            premiseId: menuData.premiseId,
            mealType: menuData.mealType,
            menuComponentId: menuData.menuComponentId,
            date: {
              gte: createStartOfDayUTC(data.date),
              lte: createEndOfDayUTC(data.date),
            },
          },
          select: { id: true },
        });
        existingId = existing?.id ?? null;
      }

      let menuId: string;
      if (existingId) {
        await tx.menu.update({ where: { id: existingId }, data: scalarData });
        // Replace ingredients/groups wholesale (delete children first).
        await tx.menuIngredient.deleteMany({ where: { menuId: existingId } });
        await tx.menuIngredientGroup.deleteMany({
          where: { menuId: existingId },
        });
        menuId = existingId;
      } else {
        const created = await tx.menu.create({ data: scalarData });
        menuId = created.id;
      }

      // Recreate ingredient groups, mapping any temporary frontend ids -> real ids.
      const groupIdMap = new Map<string, string>();
      if (Array.isArray(ingredientGroups) && ingredientGroups.length > 0) {
        for (const group of ingredientGroups) {
          const createdGroup = await tx.menuIngredientGroup.create({
            data: {
              name: group.name,
              sortOrder: group.sortOrder ?? 0,
              menuId,
            },
          });
          if (group.id) {
            groupIdMap.set(group.id, createdGroup.id);
          }
        }
      }

      const ingredientData = (ingredients || []).map((ingredient: any) => {
        let finalGroupId: string | null = null;
        if (ingredient.groupId) {
          finalGroupId =
            groupIdMap.get(ingredient.groupId) ?? ingredient.groupId;
        }
        // costPerUnit is NOT NULL in the schema — coerce blanks/NaN to 0.
        const cost = Number(ingredient.costPerUnit);
        return {
          menuId,
          name: ingredient.name,
          quantity: Number(ingredient.quantity) || 0,
          unit: normalizeUnit(ingredient.unit),
          costPerUnit: Number.isFinite(cost) ? cost : 0,
          sequenceNumber:
            ingredient.sequenceNumber != null
              ? Number(ingredient.sequenceNumber)
              : null,
          groupId: finalGroupId,
        };
      });

      if (ingredientData.length > 0) {
        await tx.menuIngredient.createMany({ data: ingredientData });
      }

      return await tx.menu.findUnique({
        where: { id: menuId },
        include: menuWriteInclude,
      });
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error: any) {
    console.error("Create menu API error:", error);
    return NextResponse.json(
      {
        error: "Failed to create menu.",
        detail: error?.message,
        code: error?.code,
      },
      { status: 500 },
    );
  }
}
