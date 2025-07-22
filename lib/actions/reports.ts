"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getReports(kitchenId?: string, startDate?: Date, endDate?: Date) {
  try {
    const where: any = {}

    if (kitchenId) {
      where.kitchenId = kitchenId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = startDate
      }
      if (endDate) {
        where.date.lte = endDate
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
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return reports
  } catch (error) {
    console.error("Error fetching reports:", error)
    throw new Error("Failed to fetch reports")
  }
}

export async function getReportById(id: string) {
  try {
    const report = await prisma.report.findUnique({
      where: { id },
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
            email: true,
            role: true,
          },
        },
      },
    })

    return report
  } catch (error) {
    console.error("Error fetching report:", error)
    throw new Error("Failed to fetch report")
  }
}

export async function createReport(data: {
  date: Date
  kitchenId: string
  userId: string
  visitorCount: number
  mealsCounted: number
  notes?: string
}) {
  try {
    const report = await prisma.report.create({
      data: {
        date: data.date,
        kitchenId: data.kitchenId,
        userId: data.userId,
        visitorCount: data.visitorCount,
        mealsCounted: data.mealsCounted,
        notes: data.notes,
      },
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
            email: true,
          },
        },
      },
    })

    revalidatePath("/reports")
    return report
  } catch (error) {
    console.error("Error creating report:", error)
    throw new Error("Failed to create report")
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
    const report = await prisma.report.update({
      where: { id },
      data,
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
            email: true,
          },
        },
      },
    })

    revalidatePath("/reports")
    return report
  } catch (error) {
    console.error("Error updating report:", error)
    throw new Error("Failed to update report")
  }
}

export async function deleteReport(id: string) {
  try {
    await prisma.report.delete({
      where: { id },
    })

    revalidatePath("/reports")
    return { success: true }
  } catch (error) {
    console.error("Error deleting report:", error)
    throw new Error("Failed to delete report")
  }
}

export async function getReportStats(kitchenId?: string) {
  try {
    const where: any = {}
    if (kitchenId) {
      where.kitchenId = kitchenId
    }

    const totalReports = await prisma.report.count({ where })

    const totalVisitors = await prisma.report.aggregate({
      where,
      _sum: {
        visitorCount: true,
        mealsCounted: true,
      },
      _avg: {
        visitorCount: true,
        mealsCounted: true,
      },
    })

    const recentReports = await prisma.report.findMany({
      where,
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    })

    const reportsByKitchen = await prisma.report.groupBy({
      by: ["kitchenId"],
      _count: {
        kitchenId: true,
      },
      _sum: {
        visitorCount: true,
        mealsCounted: true,
      },
    })

    return {
      totalReports,
      totalVisitors: totalVisitors._sum.visitorCount || 0,
      totalMeals: totalVisitors._sum.mealsCounted || 0,
      avgVisitors: totalVisitors._avg.visitorCount || 0,
      avgMeals: totalVisitors._avg.mealsCounted || 0,
      recentReports,
      reportsByKitchen,
    }
  } catch (error) {
    console.error("Error fetching report stats:", error)
    throw new Error("Failed to fetch report stats")
  }
}

export async function getTodaysReports(kitchenId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getReports(kitchenId, today, tomorrow)
}
