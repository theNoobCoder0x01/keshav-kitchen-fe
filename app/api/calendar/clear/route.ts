import { ERR } from "@/lib/api/errors";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
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

    const premiseId = ctx.searchParams.get("premiseId");

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { premise: true },
    });

    if (!user) {
      throw respondError("User not found", 404, { code: ERR.NOT_FOUND });
    }

    // Use provided premiseId or user's premiseId
    const targetPremiseId = premiseId || user.premiseId;

    if (!targetPremiseId) {
      throw respondError("No premise specified", 400, { code: ERR.VALIDATION });
    }

    // Delete all calendar events for this premise
    const result = await prisma.calendarEvent.deleteMany({
      where: { premiseId: targetPremiseId },
    });

    return {
      deletedCount: result.count,
      premiseId: targetPremiseId,
    };
  },
});
