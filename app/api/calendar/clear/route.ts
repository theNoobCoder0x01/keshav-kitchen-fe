import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const kitchenId = searchParams.get('kitchenId');

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

    // Delete all calendar events for this kitchen
    const result = await prisma.calendarEvent.deleteMany({
      where: { kitchenId: targetKitchenId }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${result.count} calendar events`,
      deletedCount: result.count
    });

  } catch (error) {
    console.error('Error clearing calendar events:', error);
    return NextResponse.json(
      { error: "Failed to clear calendar events" },
      { status: 500 }
    );
  }
}