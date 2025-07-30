import { NextResponse } from "next/server";
import * as console from "node:console";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subcategory } = body;

    // Check if user owns this recipe or is admin
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (
      existingRecipe.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Unauthorized to update this recipe" },
        { status: 403 },
      );
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id: params.id },
      // @ts-ignore
      data: { subcategory },
      select: { id: true },
    });

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error("PATCH /api/recipes/[id]/subcategory error:", error);
    return NextResponse.json(
      { error: "Failed to update recipe subcategory" },
      { status: 500 },
    );
  }
}
