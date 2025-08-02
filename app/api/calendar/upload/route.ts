import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAllICSEvents } from "@/lib/utils/ics-parser";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".ics")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an ICS file." },
        { status: 400 },
      );
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 1MB" },
        { status: 400 },
      );
    }

    // Read file content
    const content = await file.text();

    // Validate ICS format
    if (
      !content.includes("BEGIN:VCALENDAR") ||
      !content.includes("END:VCALENDAR")
    ) {
      return NextResponse.json(
        { error: "Invalid ICS file format" },
        { status: 400 },
      );
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

    // Parse ALL events from ICS file (not filtered by date)
    const parsedData = parseAllICSEvents(content);

    if (parsedData.events.length === 0) {
      return NextResponse.json(
        { error: "No valid events found in the ICS file" },
        { status: 400 },
      );
    }

    // Clear existing calendar events for this kitchen
    await prisma.calendarEvent.deleteMany({
      where: { kitchenId },
    });

    // Prepare all events for bulk insertion
    const eventsToCreate = parsedData.events.map((event) => ({
      uid:
        event.summary.replace(/\s+/g, "-").toLowerCase() +
        "-" +
        event.startDate.getTime(),
      summary: event.summary,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      userId: user.id,
      kitchenId: kitchenId,
    }));

    // Bulk insert all events at once
    const calendarEvents = await prisma.calendarEvent.createMany({
      data: eventsToCreate,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${calendarEvents.count} calendar events`,
      eventsCount: calendarEvents.count,
    });
  } catch (error) {
    console.error("Error uploading calendar file:", error);
    return NextResponse.json(
      { error: "Failed to process calendar file" },
      { status: 500 },
    );
  }
}
