import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createReportCSV,
  createReportPDF,
  createReportWorkbook,
} from "@/lib/reports/export";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/reports/generate?type=TYPE&date=YYYY-MM-DD&format=xlsx|csv|pdf
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "breakfast";
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const format = searchParams.get("format") || "pdf";

  // Get kitchen data and menu data based on date and type
  let data;
  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    if (type === "summary") {
      // For summary report, get all data for the day
      const menus = await prisma.menu.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          kitchen: {
            select: {
              name: true,
            },
          },
          recipe: {
            select: {
              title: true,
              description: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      data = {
        type: "summary",
        date: targetDate,
        totalMeals: menus.length,
        breakfastCount: menus.filter(m => m.mealType === "BREAKFAST").length,
        lunchCount: menus.filter(m => m.mealType === "LUNCH").length,
        dinnerCount: menus.filter(m => m.mealType === "DINNER").length,
        menus: menus,
      };
    } else {
      // For specific meal type reports
      const mealType = type.toUpperCase();
      const menus = await prisma.menu.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          mealType: mealType as any,
        },
        include: {
          kitchen: {
            select: {
              name: true,
            },
          },
          recipe: {
            select: {
              title: true,
              description: true,
              ingredients: {
                select: {
                  ingredient: {
                    select: {
                      name: true,
                      unit: true,
                    },
                  },
                  quantity: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      data = {
        type: mealType,
        date: targetDate,
        totalQuantity: menus.reduce((sum, menu) => sum + (menu.quantity || 0), 0),
        menus: menus,
      };
    }
  } catch (err) {
    console.error("Failed to fetch menu data:", err);
    return new NextResponse("Failed to fetch menu data", { status: 500 });
  }

  let buffer, contentType, fileExt;
  try {
    if (format === "csv") {
      buffer = await createReportCSV(data, type, date);
      contentType = "text/csv";
      fileExt = "csv";
    } else if (format === "pdf") {
      buffer = await createReportPDF(data, type, date);
      contentType = "application/pdf";
      fileExt = "pdf";
    } else {
      buffer = await createReportWorkbook(data, type, date);
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileExt = "xlsx";
    }
  } catch (err) {
    console.error("Failed to generate report file:", err);
    return new NextResponse("Failed to generate report file", { status: 500 });
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename=${type}-report-${date}.${fileExt}`,
    },
  });
}