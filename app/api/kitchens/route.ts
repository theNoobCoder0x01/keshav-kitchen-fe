import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const kitchens = await prisma.kitchen.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(kitchens);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch kitchens." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.name || !String(data.name).trim()) {
      return NextResponse.json(
        { error: "Kitchen name is required." },
        { status: 400 },
      );
    }

    const kitchen = await prisma.kitchen.create({
      data: {
        name: String(data.name).trim(),
        description: data.description ? String(data.description).trim() : null,
        defaultCook: data.defaultCook ? String(data.defaultCook).trim() : null,
      },
    });

    return NextResponse.json(kitchen, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create kitchen." },
      { status: 500 },
    );
  }
}
