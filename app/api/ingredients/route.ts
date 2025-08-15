import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { respondError } from "@/lib/api/response";
import { ERR } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

const IngredientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  cost: z.number().min(0, "Cost must be positive").optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

// GET all ingredients or by id (via ?id=)
export const GET = apiHandler({
  method: "GET",
  async handle({ ctx }) {
    const id = ctx.searchParams.get("id");
    
    if (id) {
      const ingredient = await prisma.ingredient.findUnique({ where: { id } });
      if (!ingredient) {
        throw respondError("Ingredient not found", 404, { code: ERR.NOT_FOUND });
      }
      return { ingredient };
    }
    
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
    });
    return { ingredients };
  },
});

// POST create ingredient
export const POST = apiHandler({
  method: "POST",
  bodySchema: IngredientSchema,
  async handle({ body }) {
    const ingredient = await prisma.ingredient.create({ data: body });
    return { ingredient };
  },
});

// PUT update ingredient by id (via ?id=)
export const PUT = apiHandler({
  method: "PUT",
  bodySchema: IngredientSchema.partial(),
  async handle({ body, ctx }) {
    const id = ctx.searchParams.get("id");
    if (!id) {
      throw respondError("Ingredient ID is required", 400, { code: ERR.VALIDATION });
    }
    
    const ingredient = await prisma.ingredient.update({ 
      where: { id }, 
      data: body 
    }).catch(() => {
      throw respondError("Ingredient not found", 404, { code: ERR.NOT_FOUND });
    });
    
    return { ingredient };
  },
});

// DELETE ingredient by id (via ?id=)
export const DELETE = apiHandler({
  method: "DELETE",
  async handle({ ctx }) {
    const id = ctx.searchParams.get("id");
    if (!id) {
      throw respondError("Ingredient ID is required", 400, { code: ERR.VALIDATION });
    }
    
    await prisma.ingredient.delete({ where: { id } }).catch(() => {
      throw respondError("Ingredient not found", 404, { code: ERR.NOT_FOUND });
    });
    
    return { message: "Ingredient deleted successfully" };
  },
});
