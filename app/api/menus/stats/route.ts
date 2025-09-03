import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MealType } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);

    const epochMs = searchParams.get("epochMs");
    const targetDate = epochMs ? new Date(parseInt(epochMs)) : new Date();
    const targetKitchenId = searchParams.get("kitchenId");

    if (!targetKitchenId) {
      return NextResponse.json(
        { error: "Kitchen Id is required." },
        { status: 400 }
      );
    }

    const startOfTargetDay = startOfDay(targetDate);

    const endOfTargetDay = endOfDay(targetDate);

    const [totalPlanned, mealTypeStats] = await Promise.all([
      prisma.menu.aggregate({
        where: {
          date: {
            gte: startOfTargetDay,
            lte: endOfTargetDay,
          },
          kitchenId: targetKitchenId,
        },
        _sum: {
          servingQuantity: true,
        },
      }),
      prisma.menu.groupBy({
        by: ["mealType"],
        where: {
          date: {
            gte: startOfTargetDay,
            lte: endOfTargetDay,
          },
          kitchenId: targetKitchenId,
        },
        _sum: {
          servingQuantity: true,
        },
      }),
    ]);

    const byMealType = {
      [MealType.BREAKFAST]: 0,
      [MealType.LUNCH]: 0,
      [MealType.DINNER]: 0,
      [MealType.SNACK]: 0,
    };

    mealTypeStats.forEach((stat) => {
      byMealType[stat.mealType as MealType] = stat._sum.servingQuantity || 0;
    });

    return NextResponse.json({
      total: { planned: totalPlanned._sum.servingQuantity || 0 },
      byMealType,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch stats." },
      { status: 500 }
    );
  }
}
