import { getHomeStats } from "@/lib/actions/home";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await getHomeStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching home stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch home stats" },
      { status: 500 }
    );
  }
}
