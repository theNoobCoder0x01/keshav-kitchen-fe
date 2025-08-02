import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all reports or by id (via ?id=)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const report = await prisma.report.findUnique({ where: { id } });
      if (!report)
        return NextResponse.json(
          { error: "Report not found." },
          { status: 404 },
        );
      return NextResponse.json(report);
    }
    const reports = await prisma.report.findMany();
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reports." },
      { status: 500 },
    );
  }
}

// POST create report
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const report = await prisma.report.create({ data });
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create report." },
      { status: 400 },
    );
  }
}

// PUT update report by id (via ?id=)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Report id required." },
        { status: 400 },
      );
    const data = await request.json();
    const report = await prisma.report.update({ where: { id }, data });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update report." },
      { status: 400 },
    );
  }
}

// DELETE report by id (via ?id=)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Report id required." },
        { status: 400 },
      );
    await prisma.report.delete({ where: { id } });
    return NextResponse.json({ message: "Report deleted." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete report." },
      { status: 400 },
    );
  }
}
