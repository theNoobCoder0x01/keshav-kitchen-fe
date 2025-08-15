import { ERR } from "@/lib/api/errors";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DailyMenuSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  recipes: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// GET all daily menus or by id (via ?id=)
export const GET = apiHandler({
  method: "GET",
  async handle({ ctx }) {
    const id = ctx.searchParams.get("id");

    if (id) {
      const dailyMenu = await prisma.dailyMenu.findUnique({ where: { id } });
      if (!dailyMenu) {
        throw respondError("Daily menu not found", 404, {
          code: ERR.NOT_FOUND,
        });
      }
      return { dailyMenu };
    }

    const dailyMenus = await prisma.dailyMenu.findMany({
      orderBy: { date: "desc" },
    });
    return { dailyMenus };
  },
});

// POST create daily menu
export const POST = apiHandler({
  method: "POST",
  bodySchema: DailyMenuSchema,
  async handle({ body }) {
    const dailyMenu = await prisma.dailyMenu.create({
      data: {
        ...body,
        date: new Date(body.date),
      },
    });
    return { dailyMenu };
  },
});

// PUT update daily menu by id (via ?id=)
export const PUT = apiHandler({
  method: "PUT",
  bodySchema: DailyMenuSchema.partial(),
  async handle({ body, ctx }) {
    const id = ctx.searchParams.get("id");
    if (!id) {
      throw respondError("Daily menu ID is required", 400, {
        code: ERR.VALIDATION,
      });
    }

    const updateData = { ...body };
    if (body.date) {
      updateData.date = new Date(body.date);
    }

    const dailyMenu = await prisma.dailyMenu
      .update({
        where: { id },
        data: updateData,
      })
      .catch(() => {
        throw respondError("Daily menu not found", 404, {
          code: ERR.NOT_FOUND,
        });
      });

    return { dailyMenu };
  },
});

// DELETE daily menu by id (via ?id=)
export const DELETE = apiHandler({
  method: "DELETE",
  async handle({ ctx }) {
    const id = ctx.searchParams.get("id");
    if (!id) {
      throw respondError("Daily menu ID is required", 400, {
        code: ERR.VALIDATION,
      });
    }

    await prisma.dailyMenu.delete({ where: { id } }).catch(() => {
      throw respondError("Daily menu not found", 404, { code: ERR.NOT_FOUND });
    });

    return { message: "Daily menu deleted successfully" };
  },
});
