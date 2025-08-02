import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const kitchenId = searchParams.get('kitchenId');

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { kitchen: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Use provided kitchenId or user's kitchenId
    const targetKitchenId = kitchenId || user.kitchenId;
    
    if (!targetKitchenId) {
      return NextResponse.json(
        { error: "No kitchen specified" },
        { status: 400 }
      );
    }

    // Parse the date
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get events for the specified date
    const events = await prisma.calendarEvent.findMany({
      where: {
        kitchenId: targetKitchenId,
        startDate: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      events,
      date: targetDate.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}