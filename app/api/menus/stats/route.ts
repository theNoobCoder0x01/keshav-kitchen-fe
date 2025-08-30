import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);

    const targetDate = searchParams.get("date") || new Date();
    const targetKitchenId = searchParams.get("kitchenId");

    if (!targetKitchenId) {
      return NextResponse.json(
        { error: "Kitchen Id is required." },
        { status: 400 }
      );
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalPlanned, mealTypeStats] = await Promise.all([
      prisma.menu.aggregate({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          kitchenId: targetKitchenId,
        },
        _sum: {
          servings: true,
        },
      }),
      prisma.menu.groupBy({
        by: ["mealType"],
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          kitchenId: targetKitchenId,
        },
        _sum: {
          servings: true,
        },
      }),
    ]);

    const byMealType = {
      BREAKFAST: 0,
      LUNCH: 0,
      DINNER: 0,
      SNACK: 0,
    };

    mealTypeStats.forEach((stat) => {
      byMealType[stat.mealType] = stat._sum.servings || 0;
    });

    return NextResponse.json({
      total: { planned: totalPlanned._sum.servings || 0 },
      byMealType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats." },
      { status: 500 }
    );
  }
}
