import { ERR } from "@/lib/api/errors";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseICSFileForImport } from "@/lib/utils/ics-parser";
import { getServerSession } from "next-auth";

export const POST = apiHandler({
  method: "POST",
  async handle({ ctx, req }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      throw respondError("Authentication required", 401, { code: ERR.AUTH });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("CHeck");

      throw respondError("No file provided", 400, { code: ERR.VALIDATION });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".ics")) {
      console.log("CHeck2");

      throw respondError("Invalid file type. Please upload an ICS file.", 400, {
        code: ERR.VALIDATION,
      });
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      console.log("CHeck3");

      throw respondError("File size must be less than 1MB", 400, {
        code: ERR.VALIDATION,
      });
    }

    // Read file content
    const content = await file.text();

    // Validate ICS format
    if (
      !content.includes("BEGIN:VCALENDAR") ||
      !content.includes("END:VCALENDAR")
    ) {
      console.log("Check4");

      throw respondError("Invalid ICS file format", 400, {
        code: ERR.VALIDATION,
      });
    }

    // Get user and kitchen info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { kitchen: true },
    });

    if (!user) {
      console.log("Check5");

      throw respondError("User not found", 404, { code: ERR.NOT_FOUND });
    }

    // Parse ICS file - get ALL events
    const parsedData = parseICSFileForImport(content);

    if (parsedData.events.length === 0) {
      console.log("Check7");

      throw respondError("No valid events found in the ICS file", 400, {
        code: ERR.VALIDATION,
      });
    }

    console.log("Test123");

    // Clear existing calendar events for this kitchen
    await prisma.calendarEvent.deleteMany({});
    console.log("Test12323");

    // Prepare data for bulk insert
    const calendarEventData = parsedData.events.map((event) => {
      const start =
        typeof event.startDate === "string"
          ? new Date(event.startDate)
          : event.startDate;
      const end = event.endDate
        ? typeof event.endDate === "string"
          ? new Date(event.endDate)
          : event.endDate
        : null;
      return {
        uid:
          event.uid ||
          event.summary.replace(/\s+/g, "-").toLowerCase() +
            "-" +
            start.getTime(),
        summary: event.summary,
        description: event.description,
        startDate: start,
        endDate: end,
        location: event.location,
        userId: user.id,
      };
    });

    console.log("Create pehla");

    // Bulk insert all calendar events
    const result = await prisma.calendarEvent.createMany({
      data: calendarEventData,
      skipDuplicates: true, // Skip any events with duplicate UIDs
    });
    console.log("Create pachhi");

    return {
      eventsCount: result.count,
      fileName: file.name,
      fileSize: file.size,
    };
  },
});
