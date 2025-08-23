import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createReportCSV,
  createReportPDF,
  createReportWorkbook,
} from "@/lib/reports/export";
import {
  epochToDate,
  formatEpochToDate,
  formatEpochToTime,
} from "@/lib/utils/date";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/reports/ingredients?epochMs=1724352000000&format=xlsx|csv|pdf
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const epochMs = searchParams.get("epochMs");
  const format = searchParams.get("format") || "xlsx";

  // Fetch report data from DB based on date
  let data;
  try {
    const targetDate = epochMs ? epochToDate(Number(epochMs)) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    data = await prisma.menuIngredient.groupBy({
      by: ["name", "unit"],
      where: {
        menu: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
      _sum: {
        quantity: true,
      },
      _avg: {
        costPerUnit: true,
      },
    });

    console.log(startOfDay, endOfDay);
    console.log(data);
  } catch (err) {
    return new NextResponse("Failed to fetch report data", { status: 500 });
  }

  let buffer, contentType, fileExt;
  try {
    if (format === "csv") {
      buffer = await createReportCSV(data, []);
      contentType = "text/csv";
      fileExt = "csv";
    } else if (format === "pdf") {
      buffer = await createReportPDF(data, []);
      contentType = "application/pdf";
      fileExt = "pdf";
    } else {
      buffer = await createReportWorkbook(data, []);
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileExt = "xlsx";
    }
  } catch (err) {
    return new NextResponse("Failed to generate report file", { status: 500 });
  }

  // Ensure proper response body type
  const body: any = buffer;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition":
        format === "pdf"
          ? "inline"
          : `attachment; filename=ingredients-report-${formatEpochToDate(Number(epochMs))} ${formatEpochToTime(Number(epochMs))}.${fileExt}`,
    },
  });
}
