"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getReports(kitchenId?: string) {
  try {
    const session = await auth()

    if (!session?.user) {
      return []
    }

    const targetKitchenId = kitchenId || session.user.kitchenId

    if (!targetKitchenId && session.user.role !== "ADMIN") {
      return []
    }

    const whereClause: any = {}

    if (targetKitchenId) {
      whereClause.kitchenId = targetKitchenId
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
      orderBy: { date: "desc" },
    })

    return reports
  } catch (error) {
    console.error("Get reports error:", error)
    return []
  }
}

export async function getReport(id: string) {
  try {
    const session = await auth()

    if (!session?.user) {
      return null
    }

    const report = await prisma.report.findUnique({
      where: { id },
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
    })

    return report
  } catch (error) {
    console.error("Get report error:", error)
    return null
  }
}

export async function createReport(formData: FormData) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const date = formData.get("date") as string
    const visitorCount = Number.parseInt(formData.get("visitorCount") as string)
    const mealsCounted = Number.parseInt(formData.get("mealsCounted") as string)
    const notes = formData.get("notes") as string

    if (!date || isNaN(visitorCount) || isNaN(mealsCounted)) {
      return { success: false, error: "Missing required fields" }
    }

    if (!session.user.kitchenId) {
      return { success: false, error: "No kitchen assigned" }
    }

    const report = await prisma.report.create({
      data: {
        date: new Date(date),
        kitchenId: session.user.kitchenId,
        userId: session.user.id,
        visitorCount,
        mealsCounted,
        notes: notes || null,
      },
    })

    revalidatePath("/reports")
    return { success: true, report }
  } catch (error) {
    console.error("Create report error:", error)
    return { success: false, error: "Failed to create report" }
  }
}

export async function updateReport(id: string, formData: FormData) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const visitorCount = Number.parseInt(formData.get("visitorCount") as string)
    const mealsCounted = Number.parseInt(formData.get("mealsCounted") as string)
    const notes = formData.get("notes") as string

    if (isNaN(visitorCount) || isNaN(mealsCounted)) {
      return { success: false, error: "Invalid visitor count or meals counted" }
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        visitorCount,
        mealsCounted,
        notes: notes || null,
      },
    })

    revalidatePath("/reports")
    return { success: true, report }
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

export async function getReportStats(kitchenId?: string) {
  try {
    const session = await auth()

    if (!session?.user) {
      return {
        totalReports: 0,
        totalVisitors: 0,
        totalMeals: 0,
        averageVisitorsPerDay: 0,
      }
    }

    const targetKitchenId = kitchenId || session.user.kitchenId

    if (!targetKitchenId && session.user.role !== "ADMIN") {
      return {
        totalReports: 0,
        totalVisitors: 0,
        totalMeals: 0,
        averageVisitorsPerDay: 0,
      }
    }

    const whereClause: any = {}

    if (targetKitchenId) {
      whereClause.kitchenId = targetKitchenId
    }

    const [reportCount, aggregates] = await Promise.all([
      prisma.report.count({ where: whereClause }),
      prisma.report.aggregate({
        where: whereClause,
        _sum: {
          visitorCount: true,
          mealsCounted: true,
        },
        _avg: {
          visitorCount: true,
        },
      }),
    ])

    return {
      totalReports: reportCount,
      totalVisitors: aggregates._sum.visitorCount || 0,
      totalMeals: aggregates._sum.mealsCounted || 0,
      averageVisitorsPerDay: Math.round(aggregates._avg.visitorCount || 0),
    }
  } catch (error) {
    console.error("Get report stats error:", error)
    return {
      totalReports: 0,
      totalVisitors: 0,
      totalMeals: 0,
      averageVisitorsPerDay: 0,
    }
  }
}
