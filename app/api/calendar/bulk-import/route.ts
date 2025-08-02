import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface ImportEvent {
  uid?: string;
  summary: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  location?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { events, clearExisting = false } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "Events array is required and must not be empty" },
        { status: 400 },
      );
    }

    // Validate events structure
    for (const event of events) {
      if (!event.summary || !event.startDate) {
        return NextResponse.json(
          { error: "Each event must have summary and startDate" },
          { status: 400 },
        );
      }
    }

    // Get user and kitchen info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { kitchen: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const kitchenId = user.kitchenId;
    if (!kitchenId) {
      return NextResponse.json(
        { error: "User not associated with any kitchen" },
        { status: 400 },
      );
    }

    // Clear existing calendar events if requested
    if (clearExisting) {
      await prisma.calendarEvent.deleteMany({
        where: { kitchenId },
      });
    }

    // Prepare data for bulk insert
    const calendarEventData = events.map((event: ImportEvent) => ({
      uid:
        event.uid ||
        (event.summary.replace(/\s+/g, "-").toLowerCase() +
          "-" +
          new Date(event.startDate).getTime()),
      summary: event.summary,
      description: event.description || null,
      startDate: new Date(event.startDate),
      endDate: event.endDate ? new Date(event.endDate) : null,
      location: event.location || null,
      url: event.url || null,
      userId: user.id,
      kitchenId: kitchenId,
    }));

    // Bulk insert all calendar events
    const result = await prisma.calendarEvent.createMany({
      data: calendarEventData,
      skipDuplicates: true, // Skip any events with duplicate UIDs
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.count} calendar events`,
      eventsCount: result.count,
      skipped: events.length - result.count,
    });
  } catch (error) {
    console.error("Error importing calendar events:", error);
    return NextResponse.json(
      { error: "Failed to import calendar events" },
      { status: 500 },
    );
  }
}