import { ERR } from "@/lib/api/errors";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { epochToDate } from "@/lib/utils/date";
import { endOfDay, startOfDay } from "date-fns";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export const GET = apiHandler({
  method: "GET",
  async handle({ ctx, req }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("qwerty1");

      throw respondError("Authentication required", 401, { code: ERR.AUTH });
    }

    const epochMs = ctx.searchParams.get("epochMs");
    const kitchenId = ctx.searchParams.get("kitchenId");

    if (!epochMs) {
      console.log("qwerty2");
      throw respondError("Date parameter is required", 400, {
        code: ERR.VALIDATION,
      });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { kitchen: true },
    });

    if (!user) {
      console.log("qwerty3");
      throw respondError("User not found", 404, { code: ERR.NOT_FOUND });
    }

    // Parse the date
    const targetDate = epochToDate(parseInt(epochMs));
    if (isNaN(targetDate.getTime())) {
      console.log("qwerty5");
      throw respondError("Invalid date format", 400, { code: ERR.VALIDATION });
    }

    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);

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

    console.log("qwerty6");

    return {
      events,
      date: targetDate.toISOString().split("T")[0],
    };
  },
});
