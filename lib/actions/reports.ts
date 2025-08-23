"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { epochToDate } from "../utils/date";

export async function getReports() {
  try {
    const session = await auth();

    if (!session?.user) {
      return [];
    }

    const whereClause: any = {};

    // If user is not admin, filter by their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId;
    }

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        kitchen: {
          select: {
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return reports;
  } catch (error) {
    console.error("Get reports error:", error);
    return [];
  }
}

export async function getReport(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        kitchen: {
          select: {
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Check access permissions
    if (
      session.user.role !== "ADMIN" &&
      report.kitchenId !== session.user.kitchenId
    ) {
      throw new Error("Access denied");
    }

    return report;
  } catch (error) {
    console.error("Get report error:", error);
    throw error;
  }
}

export async function createReport(data: {
  date: Date;
  kitchenId: string;
  visitorCount: number;
  mealsCounted: number;
  notes?: string;
}) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    if (
      session.user.role === "STAFF" &&
      data.kitchenId !== session.user.kitchenId
    ) {
      throw new Error("Access denied for this kitchen");
    }

    const report = await prisma.report.create({
      data: {
        date: data.date,
        kitchenId: data.kitchenId,
        userId: session.user.id,
        visitorCount: data.visitorCount,
        mealsCounted: data.mealsCounted,
        notes: data.notes,
      },
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
      },
    });

    revalidatePath("/reports");
    return report;
  } catch (error) {
    console.error("Create report error:", error);
    throw error;
  }
}

export async function updateReport(
  id: string,
  data: {
    visitorCount?: number;
    mealsCounted?: number;
    notes?: string;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Check if report exists and user has permission
    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { kitchenId: true, userId: true },
    });

    if (!existingReport) {
      throw new Error("Report not found");
    }

    // Check permissions
    if (
      session.user.role === "STAFF" &&
      existingReport.userId !== session.user.id
    ) {
      throw new Error("Access denied");
    }

    const report = await prisma.report.update({
      where: { id },
      data,
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
      },
    });

    revalidatePath("/reports");
    return report;
  } catch (error) {
    console.error("Update report error:", error);
    throw error;
  }
}

export async function deleteReport(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Check if report exists and user has permission
    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { kitchenId: true, userId: true },
    });

    if (!existingReport) {
      throw new Error("Report not found");
    }

    // Check permissions
    if (
      session.user.role === "STAFF" &&
      existingReport.userId !== session.user.id
    ) {
      throw new Error("Access denied");
    }

    await prisma.report.delete({
      where: { id },
    });

    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("Delete report error:", error);
    throw error;
  }
}

export async function getReportStats() {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        totalReports: 0,
        avgVisitorCount: 0,
        avgMealsCounted: 0,
        efficiency: 0,
      };
    }

    const whereClause: any = {};

    // If user is not admin, filter by their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId;
    }

    const [totalReports, avgStats] = await Promise.all([
      prisma.report.count({
        where: whereClause,
      }),
      prisma.report.aggregate({
        where: whereClause,
        _avg: {
          visitorCount: true,
          mealsCounted: true,
        },
      }),
    ]);

    const avgVisitorCount = avgStats._avg.visitorCount || 0;
    const avgMealsCounted = avgStats._avg.mealsCounted || 0;
    const efficiency =
      avgVisitorCount > 0 ? (avgMealsCounted / avgVisitorCount) * 100 : 0;

    return {
      totalReports,
      avgVisitorCount: Math.round(avgVisitorCount),
      avgMealsCounted: Math.round(avgMealsCounted),
      efficiency: Math.round(efficiency * 100) / 100,
    };
  } catch (error) {
    console.error("Get report stats error:", error);
    return {
      totalReports: 0,
      avgVisitorCount: 0,
      avgMealsCounted: 0,
      efficiency: 0,
    };
  }
}

export async function getCookReport(epochMs: number) {
  // Fetch report data from DB based on date
  let data;
  try {
    const targetDate = epochMs ? epochToDate(Number(epochMs)) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    data = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ mealType: "asc" }, { date: "asc" }],
      select: {
        kitchenId: true,
        mealType: true,
        recipeId: true,
        ghanFactor: true,
        recipe: { select: { name: true } },
        kitchen: { select: { name: true } },
      },
    });

    // Transform into flat structure like SQL result
    data = data.map((m) => ({
      kitchenId: m.kitchenId,
      kitchenName: m.kitchen.name,
      mealType: m.mealType,
      recipeId: m.recipeId,
      recipeName: m.recipe.name,
      ghanFactor: m.ghanFactor,
    }));

    return data;
  } catch (error) {
    console.error("Get cook report error:", error);
    return [];
  }
}

export async function getSupplierReport(epochMs: number) {
  // Fetch report data from DB based on date
  let data;
  try {
    const targetDate = epochMs ? epochToDate(Number(epochMs)) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    data = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ mealType: "asc" }, { date: "asc" }],
      select: {
        kitchenId: true,
        mealType: true,
        recipeId: true,
        ghanFactor: true,
        recipe: { select: { name: true } },
        kitchen: { select: { name: true } },
      },
    });

    // Transform into flat structure like SQL result
    data = data.map((m) => ({
      kitchenId: m.kitchenId,
      kitchenName: m.kitchen.name,
      mealType: m.mealType,
      recipeId: m.recipeId,
      recipeName: m.recipe.name,
      ghanFactor: m.ghanFactor,
      totalQuantity: m.ghanFactor, // TODO: calculate sum of all the ingredients
    }));

    return data;
  } catch (error) {
    console.error("Get cook report error:", error);
    return [];
  }
}

export async function getRecipesReport(epochMs: number) {
  // Fetch report data from DB based on date
  let data;
  try {
    const targetDate = epochMs ? epochToDate(Number(epochMs)) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    data = await prisma.menu.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ mealType: "asc" }, { date: "asc" }],
      select: {
        kitchenId: true,
        mealType: true,
        recipeId: true,
        ghanFactor: true,
        recipe: { select: { name: true } },
        kitchen: { select: { name: true } },
        ingredients: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
          },
        },
      },
    });

    // Transform into flat structure like SQL result
    data = data.map((m) => ({
      kitchenId: m.kitchenId,
      kitchenName: m.kitchen.name,
      mealType: m.mealType,
      recipeId: m.recipeId,
      recipeName: m.recipe.name,
      ghanFactor: m.ghanFactor,
      ingredients: m.ingredients.map((i) => ({
        ...i,
        quantity: m.ghanFactor * i.quantity,
      })),
    }));

    return data;
  } catch (error) {
    console.error("Get cook report error:", error);
    return [];
  }
}
