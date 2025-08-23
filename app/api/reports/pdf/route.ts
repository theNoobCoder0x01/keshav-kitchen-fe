import { authOptions } from "@/lib/auth";
import { createReportPDF } from "@/lib/reports/export";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/reports/pdf?url=http://localhost:3000/reports/cook
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Failed to generate report file", { status: 500 });
  }

  let buffer, contentType, fileExt;
  buffer = await createReportPDF(url);
  contentType = "application/pdf";
  fileExt = "pdf";
  // Ensure proper response body type
  const body: any = buffer;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      //   "Content-Disposition": `attachment; filename=cook-report-${formatEpochToDate(Number(new Date().getTime()))} ${formatEpochToTime(Number(new Date().getTime()))}.${fileExt}`,
    },
  });
}
