import { getRecentActivity } from "@/lib/actions/home";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const activity = await getRecentActivity();
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}
