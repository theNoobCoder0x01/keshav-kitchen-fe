import { ERR } from "@/lib/api/errors";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { z } from "zod";

const ImportEventSchema = z.object({
  uid: z.string().optional(),
  summary: z.string().min(1, "Event summary is required"),
  description: z.string().optional(),
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid end date")
    .optional(),
  location: z.string().optional(),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

const BulkImportSchema = z.object({
  events: z.array(ImportEventSchema).min(1, "Events array must not be empty"),
  clearExisting: z.boolean().default(false),
});

export const POST = apiHandler({
  method: "POST",
  bodySchema: BulkImportSchema,
  async handle({ body, req }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      throw respondError("Authentication required", 401, { code: ERR.AUTH });
    }

    const { events, clearExisting } = body;

    // Get user and kitchen info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { kitchen: true },
    });

    if (!user) {
      throw respondError("User not found", 404, { code: ERR.NOT_FOUND });
    }

    const kitchenId = user.kitchenId;
    if (!kitchenId) {
      throw respondError("User not associated with any kitchen", 400, {
        code: ERR.VALIDATION,
      });
    }

    // Clear existing calendar events if requested
    if (clearExisting) {
      await prisma.calendarEvent.deleteMany({
        where: { kitchenId },
      });
    }

    // Prepare data for bulk insert
    const calendarEventData = events.map((event) => ({
      uid:
        event.uid ||
        event.summary.replace(/\s+/g, "-").toLowerCase() +
          "-" +
          new Date(event.startDate).getTime(),
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

    return {
      eventsImported: result.count,
      eventsSkipped: events.length - result.count,
      totalEvents: events.length,
    };
  },
});
