"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ReportSchema = z.object({
  kitchenId: z.string(),
  reportDate: z.date(),
  totalVisitors: z.number().min(0),
  breakfastCount: z.number().min(0),
  lunchCount: z.number().min(0),
  dinnerCount: z.number().min(0),
  totalCost: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export async function getDailyReports(kitchenId?: string, startDate?: Date, endDate?: Date) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const whereClause: any = {}

    if (kitchenId) {
      whereClause.kitchenId = kitchenId
    } else if (session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId
    }

    if (startDate && endDate) {
      whereClause.reportDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    const reports = await prisma.dailyReport.findMany({
      where: whereClause,
      include: {
        kitchen: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        reportDate: "desc",
      },
    })

    return reports.map((report) => ({
      id: report.id,
      kitchenId: report.kitchenId,
      kitchenName: report.kitchen.name,
      reportDate: report.reportDate,
      totalVisitors: report.totalVisitors,
      breakfastCount: report.breakfastCount,
      lunchCount: report.lunchCount,
      dinnerCount: report.dinnerCount,
      totalCost: report.totalCost,
      notes: report.notes,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }))
  } catch (error) {
    console.error("Error fetching daily reports:", error)
    throw new Error("Failed to fetch daily reports")
  }
}

export async function createDailyReport(data: z.infer<typeof ReportSchema>) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const validatedData = ReportSchema.parse(data)

    // Check if report already exists for this date and kitchen
    const existingReport = await prisma.dailyReport.findUnique({
      where: {
        kitchenId_reportDate: {
          kitchenId: validatedData.kitchenId,
          reportDate: validatedData.reportDate,
        },
      },
    })

    if (existingReport) {
      throw new Error("Report already exists for this date and kitchen")
    }

    const report = await prisma.dailyReport.create({
      data: validatedData,
      include: {
        kitchen: true,
      },
    })

    revalidatePath("/reports")
    return report
  } catch (error) {
    console.error("Error creating daily report:", error)
    throw new Error("Failed to create daily report")
  }
}

export async function updateDailyReport(id: string, data: Partial<z.infer<typeof ReportSchema>>) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const report = await prisma.dailyReport.update({
      where: { id },
      data,
      include: {
        kitchen: true,
      },
    })

    revalidatePath("/reports")
    return report
  } catch (error) {
    console.error("Error updating daily report:", error)
    throw new Error("Failed to update daily report")
  }
}

export async function deleteDailyReport(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    await prisma.dailyReport.delete({
      where: { id },
    })

    revalidatePath("/reports")
  } catch (error) {
    console.error("Error deleting daily report:", error)
    throw new Error("Failed to delete daily report")
  }
}

export async function getReportStats(kitchenId?: string, days = 30) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const whereClause: any = {
      reportDate: {
        gte: startDate,
      },
    }

    if (kitchenId) {
      whereClause.kitchenId = kitchenId
    } else if (session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId
    }

    const [totalReports, aggregateStats, recentReports] = await Promise.all([
      prisma.dailyReport.count({
        where: whereClause,
      }),
      prisma.dailyReport.aggregate({
        where: whereClause,
        _sum: {
          totalVisitors: true,
          breakfastCount: true,
          lunchCount: true,
          dinnerCount: true,
          totalCost: true,
        },
        _avg: {
          totalVisitors: true,
          totalCost: true,
        },
      }),
      prisma.dailyReport.findMany({
        where: whereClause,
        orderBy: {
          reportDate: "desc",
        },
        take: 7,
        include: {
          kitchen: {
            select: {
              name: true,
            },
          },
        },
      }),
    ])

    return {
      totalReports,
      totalVisitors: aggregateStats._sum.totalVisitors || 0,
      totalMealsServed:
        (aggregateStats._sum.breakfastCount || 0) +
        (aggregateStats._sum.lunchCount || 0) +
        (aggregateStats._sum.dinnerCount || 0),
      totalCost: aggregateStats._sum.totalCost || 0,
      avgVisitorsPerDay: aggregateStats._avg.totalVisitors || 0,
      avgCostPerDay: aggregateStats._avg.totalCost || 0,
      recentReports: recentReports.map((report) => ({
        id: report.id,
        kitchenName: report.kitchen.name,
        reportDate: report.reportDate,
        totalVisitors: report.totalVisitors,
        totalMeals: report.breakfastCount + report.lunchCount + report.dinnerCount,
        totalCost: report.totalCost,
      })),
    }
  } catch (error) {
    console.error("Error fetching report stats:", error)
    throw new Error("Failed to fetch report stats")
  }
}

export async function getKitchenPerformance(days = 30) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const kitchenStats = await prisma.kitchen.findMany({
      where: { isActive: true },
      include: {
        dailyReports: {
          where: {
            reportDate: {
              gte: startDate,
            },
          },
        },
        _count: {
          select: {
            users: true,
            dailyMenus: true,
          },
        },
      },
    })

    return kitchenStats.map((kitchen) => {
      const reports = kitchen.dailyReports
      const totalVisitors = reports.reduce((sum, report) => sum + report.totalVisitors, 0)
      const totalCost = reports.reduce((sum, report) => sum + (report.totalCost?.toNumber() || 0), 0)
      const totalMeals = reports.reduce(
        (sum, report) => sum + report.breakfastCount + report.lunchCount + report.dinnerCount,
        0,
      )

      return {
        id: kitchen.id,
        name: kitchen.name,
        location: kitchen.location,
        userCount: kitchen._count.users,
        menuCount: kitchen._count.dailyMenus,
        totalVisitors,
        totalMeals,
        totalCost,
        avgVisitorsPerDay: reports.length > 0 ? totalVisitors / reports.length : 0,
        avgCostPerDay: reports.length > 0 ? totalCost / reports.length : 0,
        efficiency: totalMeals > 0 ? totalVisitors / totalMeals : 0,
      }
    })
  } catch (error) {
    console.error("Error fetching kitchen performance:", error)
    throw new Error("Failed to fetch kitchen performance")
  }
}
