import { ERR } from "@/lib/api/errors";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTithi } from "@/lib/utils/ics-parser";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export const GET = apiHandler({
  method: "GET",
  async handle({ ctx, req }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      throw respondError("Authentication required", 401, { code: ERR.AUTH });
    }

    const startEpochMs = parseInt(ctx.searchParams.get("startEpochMs") ?? "");
    const endEpochMs = parseInt(ctx.searchParams.get("endEpochMs") ?? "");

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { kitchen: true },
    });

    if (!user) {
      throw respondError("User not found", 404, { code: ERR.NOT_FOUND });
    }

    // Calculate date range for the day
    const startOfTargetDay = new Date(startEpochMs);
    const endOfTargetDay = new Date(endEpochMs);

    // Get events for the specified date
    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: startOfTargetDay,
          lt: endOfTargetDay,
        },
      },
      orderBy: [
        {
          startDate: "asc",
        },
      ],
    });

    // Extract tithi and event information
    let tithi: string | undefined;
    let eventSummary: string[] = [];

    if (events.length > 0) {
      // Try to extract tithi from the first event that contains tithi information
      for (const event of events) {
        const extractedTithi = extractTithi(
          event.summary,
          event.description ?? undefined,
        );
        if (extractedTithi) {
          tithi = extractedTithi;
          break;
        }
      }

      eventSummary = events.map((e) => e.summary);
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
      tithi,
      eventSummary,
      eventsCount: events.length,
      events: events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        startDate: event.startDate.getTime(),
        endDate: event.endDate?.getTime(),
        location: event.location,
      })),
    };
  },
});
