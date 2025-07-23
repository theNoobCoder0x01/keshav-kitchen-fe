"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getReports(kitchenId?: string, startDate?: Date, endDate?: Date) {
  try {
    const where: any = {}

    if (kitchenId) {
      where.kitchenId = kitchenId
    }

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        kitchen: {
          select: {
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return { success: true, data: reports }
  } catch (error) {
    console.error("Error fetching reports:", error)
    return { success: false, error: "Failed to fetch reports" }
  }
}

export async function getReportById(id: string) {
  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        kitchen: true,
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    })

    if (!report) {
      return { success: false, error: "Report not found" }
    }

    return { success: true, data: report }
  } catch (error) {
    console.error("Error fetching report:", error)
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

    // Check if user has permission for this kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== data.kitchenId) {
      return { success: false, error: "Unauthorized for this kitchen" }
    }

    // Check if report already exists for this date and kitchen
    const existingReport = await prisma.report.findFirst({
      where: {
        date: data.date,
        kitchenId: data.kitchenId,
      },
    })

    if (existingReport) {
      return { success: false, error: "Report already exists for this date and kitchen" }
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
        kitchen: true,
      },
    })

    revalidatePath("/reports")
    return { success: true, data: report }
  } catch (error) {
    console.error("Error creating report:", error)
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

    // Get the report to check permissions
    const existingReport = await prisma.report.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return { success: false, error: "Report not found" }
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== existingReport.kitchenId) {
      return { success: false, error: "Unauthorized for this kitchen" }
    }

    const report = await prisma.report.update({
      where: { id },
      data,
      include: {
        kitchen: true,
      },
    })

    revalidatePath("/reports")
    return { success: true, data: report }
  } catch (error) {
    console.error("Error updating report:", error)
    return { success: false, error: "Failed to update report" }
  }
}

export async function deleteReport(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the report to check permissions
    const existingReport = await prisma.report.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return { success: false, error: "Report not found" }
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== existingReport.kitchenId) {
      return { success: false, error: "Unauthorized for this kitchen" }
    }

    await prisma.report.delete({
      where: { id },
    })

    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Error deleting report:", error)
    return { success: false, error: "Failed to delete report" }
  }
}

export async function getReportStats(kitchenId?: string, days = 30) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (kitchenId) {
      where.kitchenId = kitchenId
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
      },
    })

    const totalVisitors = reports.reduce((sum, report) => sum + report.visitorCount, 0)
    const totalMeals = reports.reduce((sum, report) => sum + report.mealsCounted, 0)
    const averageVisitors = reports.length > 0 ? totalVisitors / reports.length : 0
    const averageMeals = reports.length > 0 ? totalMeals / reports.length : 0

    // Group by kitchen
    const kitchenStats = reports.reduce(
      (acc, report) => {
        const kitchenName = report.kitchen.name
        if (!acc[kitchenName]) {
          acc[kitchenName] = {
            totalVisitors: 0,
            totalMeals: 0,
            reportCount: 0,
          }
        }
        acc[kitchenName].totalVisitors += report.visitorCount
        acc[kitchenName].totalMeals += report.mealsCounted
        acc[kitchenName].reportCount += 1
        return acc
      },
      {} as Record<string, any>,
    )

    return {
      success: true,
      data: {
        totalVisitors,
        totalMeals,
        averageVisitors: Math.round(averageVisitors),
        averageMeals: Math.round(averageMeals),
        reportCount: reports.length,
        kitchenStats,
        dailyData: reports.map((report) => ({
          date: report.date,
          visitorCount: report.visitorCount,
          mealsCounted: report.mealsCounted,
          kitchen: report.kitchen.name,
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching report stats:", error)
    return { success: false, error: "Failed to fetch report stats" }
  }
}

export async function getTodaysReports(kitchenId?: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const where: any = {
      date: {
        gte: today,
        lt: tomorrow,
      },
    }

    if (kitchenId) {
      where.kitchenId = kitchenId
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        kitchen: {
          select: {
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    return { success: true, data: reports }
  } catch (error) {
    console.error("Error fetching today's reports:", error)
    return { success: false, error: "Failed to fetch today's reports" }
  }
}
