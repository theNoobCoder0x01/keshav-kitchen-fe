import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { ERR } from "@/lib/api/errors";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export const GET = apiHandler({
  method: "GET",
  async handle({ ctx, req }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      throw respondError("Authentication required", 401, { code: ERR.AUTH });
    }

    const date = ctx.searchParams.get("date");
    const kitchenId = ctx.searchParams.get("kitchenId");

    if (!date) {
      throw respondError("Date parameter is required", 400, { code: ERR.VALIDATION });
    }

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

    // Parse the date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      throw respondError("Invalid date format", 400, { code: ERR.VALIDATION });
    }

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

    return {
      events,
      date: targetDate.toISOString().split("T")[0],
      kitchenId: targetKitchenId,
    };
  },
});
