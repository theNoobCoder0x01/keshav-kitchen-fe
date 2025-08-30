import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const kitchens = await prisma.kitchen.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(kitchens);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch kitchens." },
      { status: 500 }
    );
  }
}

// POST create kitchen
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const data = await request.json();

    const kitchen = await prisma.kitchen.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
      },
    });

    return NextResponse.json(kitchen, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create kitchen." },
      { status: 500 }
    );
  }
}
