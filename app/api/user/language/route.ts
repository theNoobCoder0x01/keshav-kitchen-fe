import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { language } = await request.json();

    // Validate language parameter
    if (!language || !["en", "gu"].includes(language)) {
      return NextResponse.json(
        { success: false, message: 'Invalid language. Must be "en" or "gu"' },
        { status: 400 }
      );
    }

    // Update user language preference in database
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        language: language,
      },
      select: {
        id: true,
        language: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        language: updatedUser.language,
      },
      message: "Language preference updated successfully",
    });
  } catch (error) {
    console.error("Error updating user language:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user language preference from database
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        language: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        language: user.language || "en",
      },
    });
  } catch (error) {
    console.error("Error fetching user language:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
