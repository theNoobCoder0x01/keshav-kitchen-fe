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

// GET /api/reports/download?type=TYPE&date=YYYY-MM-DD&format=xlsx|csv|pdf
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "breakfast";
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const format = searchParams.get("format") || "xlsx";

  // Fetch report data from DB based on date
  let data;
  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    data = await prisma.report.findMany({
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
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    return new NextResponse("Failed to fetch report data", { status: 500 });
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
