import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { ERR } from "@/lib/api/errors";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const DELETE = apiHandler({
  method: "DELETE",
  async handle({ ctx, req }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      throw respondError("Authentication required", 401, { code: ERR.AUTH });
    }

    const kitchenId = ctx.searchParams.get("kitchenId");

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

    // Delete all calendar events for this kitchen
    const result = await prisma.calendarEvent.deleteMany({
      where: { kitchenId: targetKitchenId },
    });

    return {
      deletedCount: result.count,
      kitchenId: targetKitchenId,
    };
  },
});
