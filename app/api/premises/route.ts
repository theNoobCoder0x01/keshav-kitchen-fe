import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const premises = await prisma.premise.findMany({
      orderBy: [
        {
          sequenceNumber: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json(premises);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch premises." },
      { status: 500 },
    );
  }
}

// POST create premise
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
    }

    const data = await request.json();

    const premise = await prisma.premise.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
        sequenceNumber: data.sequenceNumber,
      },
    });

    return NextResponse.json(premise, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create premise." },
      { status: 500 },
    );
  }
}
