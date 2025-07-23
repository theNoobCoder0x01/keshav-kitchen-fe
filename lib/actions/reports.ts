"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getReports() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const reports = await prisma.report.findMany({
    where: {
      ...(session.user.kitchenId && { kitchenId: session.user.kitchenId }),
    },
    include: {
      kitchen: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  })

  return reports
}

export async function getReport(id: string) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      kitchen: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!report) {
    return null
  }

  // Check permissions
  if (session.user.kitchenId && session.user.kitchenId !== report.kitchenId) {
    throw new Error("You can only view reports for your assigned kitchen")
  }

  return report
}

export async function createReport(data: {
  date: Date
  kitchenId: string
  visitorCount: number
  mealsCounted: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Check permissions
  if (session.user.kitchenId && session.user.kitchenId !== data.kitchenId) {
    throw new Error("You can only create reports for your assigned kitchen")
  }

  try {
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
    return { success: true, report }
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
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  try {
    const existingReport = await prisma.report.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return { success: false, error: "Report not found" }
    }

    // Check permissions
    if (session.user.kitchenId && session.user.kitchenId !== existingReport.kitchenId) {
      throw new Error("You can only update reports for your assigned kitchen")
    }

    const report = await prisma.report.update({
      where: { id },
      data,
      include: {
        kitchen: true,
      },
    })

    revalidatePath("/reports")
    return { success: true, report }
  } catch (error) {
    console.error("Error updating report:", error)
    return { success: false, error: "Failed to update report" }
  }
}

export async function deleteReport(id: string) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  try {
    const existingReport = await prisma.report.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return { success: false, error: "Report not found" }
    }

    // Check permissions
    if (session.user.kitchenId && session.user.kitchenId !== existingReport.kitchenId) {
      throw new Error("You can only delete reports for your assigned kitchen")
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

export async function getReportStats() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [totalReports, todayReports, monthlyStats] = await Promise.all([
    prisma.report.count({
      where: {
        ...(session.user.kitchenId && { kitchenId: session.user.kitchenId }),
      },
    }),
    prisma.report.count({
      where: {
        date: today,
        ...(session.user.kitchenId && { kitchenId: session.user.kitchenId }),
      },
    }),
    prisma.report.aggregate({
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
        ...(session.user.kitchenId && { kitchenId: session.user.kitchenId }),
      },
      _sum: {
        visitorCount: true,
        mealsCounted: true,
      },
      _avg: {
        visitorCount: true,
        mealsCounted: true,
      },
    }),
  ])

  return {
    totalReports,
    todayReports,
    monthlyVisitors: monthlyStats._sum.visitorCount || 0,
    monthlyMeals: monthlyStats._sum.mealsCounted || 0,
    avgDailyVisitors: Math.round(monthlyStats._avg.visitorCount || 0),
    avgDailyMeals: Math.round(monthlyStats._avg.mealsCounted || 0),
  }
}
