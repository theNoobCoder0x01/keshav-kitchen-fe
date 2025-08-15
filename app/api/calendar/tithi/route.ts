import { ERR } from "@/lib/api/errors";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTithi } from "@/lib/utils/ics-parser";
import { getServerSession } from "next-auth";

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

export const GET = apiHandler({
  method: "GET",
  async handle({ ctx, req }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      throw respondError("Authentication required", 401, { code: ERR.AUTH });
    }

    const dateParam = ctx.searchParams.get("date");
    const kitchenId = ctx.searchParams.get("kitchenId");

    // Use provided date or default to today
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { kitchen: true },
    });

    if (!user) {
      throw respondError("User not found", 404, { code: ERR.NOT_FOUND });
    }

    // Use provided kitchenId or user's kitchenId
    const targetKitchenId = kitchenId || user.kitchenId;

    if (!targetKitchenId) {
      throw respondError("No kitchen specified", 400, { code: ERR.VALIDATION });
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

    return {
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
    };
  },
});
