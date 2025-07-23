"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getReports() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const whereClause: any = {}

    // If user has a specific kitchen, filter by it
    if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause.kitchenId = session.user.kitchenId
    }

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return { success: true, data: reports }
  } catch (error) {
    console.error("Get reports error:", error)
    return { success: false, error: "Failed to fetch reports" }
  }
}

export async function getReportById(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    if (!report) {
      return { success: false, error: "Report not found" }
    }

    // Check permissions
    if (session.user.kitchenId && session.user.role !== "ADMIN" && session.user.kitchenId !== report.kitchenId) {
      return { success: false, error: "Access denied" }
    }

    return { success: true, data: report }
  } catch (error) {
    console.error("Get report by ID error:", error)
    return { success: false, error: "Failed to fetch report" }
  }
}

export async function createReport(data: {
  date: Date
  kitchenId: string
  visitorCount: number
  mealsCounted: number
  notes?: string
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user has permission to create report for this kitchen
    if (session.user.kitchenId && session.user.role !== "ADMIN" && session.user.kitchenId !== data.kitchenId) {
      return { success: false, error: "Access denied for this kitchen" }
    }

    const report = await prisma.report.create({
      data: {
        date: data.date,
        kitchenId: data.kitchenId,
        userId: session.user.id,
        visitorCount: data.visitorCount,
        mealsCounted: data.mealsCounted,
        notes: data.notes,
      },
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
      },
    })

    revalidatePath("/reports")
    return { success: true, data: report }
  } catch (error) {
    console.error("Create report error:", error)
    return { success: false, error: "Failed to create report" }
  }
}

export async function updateReport(
  id: string,
  data: {
    visitorCount?: number
    mealsCounted?: number
    notes?: string
  },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if report exists and user has permission
    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { kitchenId: true, userId: true },
    })

    if (!existingReport) {
      return { success: false, error: "Report not found" }
    }

    // Check permissions
    if (
      session.user.kitchenId &&
      session.user.role !== "ADMIN" &&
      session.user.kitchenId !== existingReport.kitchenId
    ) {
      return { success: false, error: "Access denied" }
    }

    const report = await prisma.report.update({
      where: { id },
      data,
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
      },
    })

    revalidatePath("/reports")
    return { success: true, data: report }
  } catch (error) {
    console.error("Update report error:", error)
    return { success: false, error: "Failed to update report" }
  }
}

export async function deleteReport(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if report exists and user has permission
    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { kitchenId: true, userId: true },
    })

    if (!existingReport) {
      return { success: false, error: "Report not found" }
    }

    // Check permissions
    if (
      session.user.kitchenId &&
      session.user.role !== "ADMIN" &&
      session.user.kitchenId !== existingReport.kitchenId &&
      existingReport.userId !== session.user.id
    ) {
      return { success: false, error: "Access denied" }
    }

    await prisma.report.delete({
      where: { id },
    })

    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Delete report error:", error)
    return { success: false, error: "Failed to delete report" }
  }
}

export async function getReportStats() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const whereClause: any = {}

    // If user has a specific kitchen, filter by it
    if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause.kitchenId = session.user.kitchenId
    }

    const [
      totalReports,
      reportsToday,
      reportsThisWeek,
      reportsThisMonth,
      totalVisitorsToday,
      totalMealsToday,
      avgVisitorsPerDay,
    ] = await Promise.all([
      prisma.report.count({ where: whereClause }),
      prisma.report.count({
        where: { ...whereClause, date: today },
      }),
      prisma.report.count({
        where: {
          ...whereClause,
          date: { gte: thisWeekStart },
        },
      }),
      prisma.report.count({
        where: {
          ...whereClause,
          date: { gte: thisMonthStart },
        },
      }),
      prisma.report.aggregate({
        where: { ...whereClause, date: today },
        _sum: { visitorCount: true },
      }),
      prisma.report.aggregate({
        where: { ...whereClause, date: today },
        _sum: { mealsCounted: true },
      }),
      prisma.report.aggregate({
        where: {
          ...whereClause,
          date: { gte: thisWeekStart },
        },
        _avg: { visitorCount: true },
      }),
    ])

    return {
      success: true,
      data: {
        totalReports,
        reportsToday,
        reportsThisWeek,
        reportsThisMonth,
        totalVisitorsToday: totalVisitorsToday._sum.visitorCount || 0,
        totalMealsToday: totalMealsToday._sum.mealsCounted || 0,
        avgVisitorsPerDay: Math.round(avgVisitorsPerDay._avg.visitorCount || 0),
      },
    }
  } catch (error) {
    console.error("Get report stats error:", error)
    return { success: false, error: "Failed to fetch report statistics" }
  }
}

export async function getReportsByDateRange(startDate: Date, endDate: Date) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    // If user has a specific kitchen, filter by it
    if (session.user.kitchenId && session.user.role !== "ADMIN") {
      whereClause.kitchenId = session.user.kitchenId
    }

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    return { success: true, data: reports }
  } catch (error) {
    console.error("Get reports by date range error:", error)
    return { success: false, error: "Failed to fetch reports" }
  }
}
