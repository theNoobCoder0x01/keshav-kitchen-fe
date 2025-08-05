import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTithi } from "@/lib/utils/ics-parser";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  uid: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const kitchenId = searchParams.get("kitchenId");

    // Use provided date or default to today
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { kitchen: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use provided kitchenId or user's kitchenId
    const targetKitchenId = kitchenId || user.kitchenId;

    if (!targetKitchenId) {
      return NextResponse.json(
        { error: "No kitchen specified" },
        { status: 400 },
      );
    }

    // Calculate date range for the day
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get events for the specified date
    const events = await prisma.calendarEvent.findMany({
      where: {
        kitchenId: targetKitchenId,
        startDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    // Extract tithi and event information
    let tithi: string | undefined;
    let eventSummary: string | undefined;

    if (events.length > 0) {
      // Try to extract tithi from the first event that contains tithi information
      for (const event of events) {
        const extractedTithi = extractTithi(event.summary, event.description);
        if (extractedTithi) {
          tithi = extractedTithi;
          break;
        }
      }

      // Create event summary
      if (events.length === 1) {
        eventSummary = events[0].summary;
      } else {
        eventSummary = events.map((event) => event.summary).join(", ");
      }
    }

    // If no tithi found in events, provide a default or fallback
    if (!tithi && events.length > 0) {
      // Use the first event's summary as tithi if it contains common Gujarati terms
      const firstEvent = events[0];
      const summary = firstEvent.summary.toLowerCase();

      // Check if the summary itself is a tithi
      const tithiKeywords = [
        "sud",
        "vad",
        "panam",
        "purnima",
        "amavasya",
        "ekadashi",
        "chaturdashi",
        "ashtami",
        "navami",
        "dashami",
        "trayodashi",
        "dwadashi",
        "saptami",
        "shashthi",
        "panchami",
        "chaturthi",
        "tritiya",
        "dwitiya",
        "pratipada",
      ];

      if (tithiKeywords.some((keyword) => summary.includes(keyword))) {
        tithi = firstEvent.summary;
      }
    }

    return NextResponse.json({
      success: true,
      date: targetDate.toISOString().split("T")[0],
      tithi,
      eventSummary,
      eventsCount: events.length,
      events: events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString(),
        location: event.location,
      })),
    });
  } catch (error) {
    console.error("Error fetching tithi information:", error);
    return NextResponse.json(
      { error: "Failed to fetch tithi information" },
      { status: 500 },
    );
  }
}
