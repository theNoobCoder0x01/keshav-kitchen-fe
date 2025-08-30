import {
  getHomeStats,
  getQuickActionsData,
  getRecentActivity,
} from "@/lib/actions/home";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all home data in parallel
    const [stats, activity, quickActions] = await Promise.all([
      getHomeStats(),
      getRecentActivity(),
      getQuickActionsData(),
    ]);

    return NextResponse.json({
      stats,
      activity,
      quickActions,
    });
  } catch (error) {
    console.error("Error fetching home data:", error);
    return NextResponse.json(
      { error: "Failed to fetch home data" },
      { status: 500 }
    );
  }
}
