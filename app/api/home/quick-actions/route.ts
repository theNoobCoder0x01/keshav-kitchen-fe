import { getQuickActionsData } from "@/lib/actions/home";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const quickActionsData = await getQuickActionsData();
    return NextResponse.json(quickActionsData);
  } catch (error) {
    console.error("Error fetching quick actions data:", error);
    return NextResponse.json(
      { error: "Failed to fetch quick actions data" },
      { status: 500 },
    );
  }
}
