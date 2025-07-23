"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const ReportSchema = z.object({
  date: z.date(),
  kitchenId: z.string(),
  visitorCount: z.number().min(0),
  mealsCounted: z.number().min(0),
  notes: z.string().optional(),
})

export async function getReports(limit = 10) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const reports = await prisma.report.findMany({
    where: {
      kitchenId: session.user.kitchenId,
    },
    include: {
      kitchen: {
        select: {
          name: true,
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
    take: limit,
  })

  return reports
}

export async function getReport(id: string) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const report = await prisma.report.findFirst({
    where: {
      id,
      kitchenId: session.user.kitchenId,
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
          role: true,
        },
      },
    },
  })

  return report
}

export async function createReport(data: z.infer<typeof ReportSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if user has permission to create reports for this kitchen
  if (session.user.role === "STAFF" && data.kitchenId !== session.user.kitchenId) {
    throw new Error("Insufficient permissions")
  }

  const validatedData = ReportSchema.parse(data)

  const report = await prisma.report.create({
    data: {
      ...validatedData,
      userId: session.user.id,
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
  return report
}

export async function updateReport(id: string, data: Partial<z.infer<typeof ReportSchema>>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if report exists and user has permission
  const existingReport = await prisma.report.findFirst({
    where: {
      id,
      kitchenId: session.user.kitchenId,
    },
  })

  if (!existingReport) {
    throw new Error("Report not found or unauthorized")
  }

  // Staff can only update their own reports
  if (session.user.role === "STAFF" && existingReport.userId !== session.user.id) {
    throw new Error("Insufficient permissions")
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
  return report
}

export async function deleteReport(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if report exists and user has permission
  const existingReport = await prisma.report.findFirst({
    where: {
      id,
      kitchenId: session.user.kitchenId,
    },
  })

  if (!existingReport) {
    throw new Error("Report not found or unauthorized")
  }

  // Staff can only delete their own reports, others need manager+ role
  if (session.user.role === "STAFF" && existingReport.userId !== session.user.id) {
    throw new Error("Insufficient permissions")
  }

  await prisma.report.delete({
    where: { id },
  })

  revalidatePath("/reports")
}

export async function getReportStats() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [todayReports, weekReports, monthReports, totalVisitors, totalMeals] = await Promise.all([
    prisma.report.count({
      where: {
        date: today,
        kitchenId: session.user.kitchenId,
      },
    }),
    prisma.report.count({
      where: {
        date: {
          gte: weekAgo,
        },
        kitchenId: session.user.kitchenId,
      },
    }),
    prisma.report.count({
      where: {
        date: {
          gte: monthAgo,
        },
        kitchenId: session.user.kitchenId,
      },
    }),
    prisma.report.aggregate({
      where: {
        date: {
          gte: weekAgo,
        },
        kitchenId: session.user.kitchenId,
      },
      _sum: {
        visitorCount: true,
      },
    }),
    prisma.report.aggregate({
      where: {
        date: {
          gte: weekAgo,
        },
        kitchenId: session.user.kitchenId,
      },
      _sum: {
        mealsCounted: true,
      },
    }),
  ])

  return {
    todayReports,
    weekReports,
    monthReports,
    totalVisitorsThisWeek: totalVisitors._sum.visitorCount || 0,
    totalMealsThisWeek: totalMeals._sum.mealsCounted || 0,
  }
}

export async function getDailyReportSummary(date?: Date) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const targetDate = date || new Date()
  targetDate.setHours(0, 0, 0, 0)

  const [reports, menus] = await Promise.all([
    prisma.report.findMany({
      where: {
        date: targetDate,
        kitchenId: session.user.kitchenId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.menu.findMany({
      where: {
        date: targetDate,
        kitchenId: session.user.kitchenId,
      },
      include: {
        recipe: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    }),
  ])

  const totalVisitors = reports.reduce((sum, report) => sum + report.visitorCount, 0)
  const totalMeals = reports.reduce((sum, report) => sum + report.mealsCounted, 0)
  const plannedServings = menus.reduce((sum, menu) => sum + menu.servings, 0)
  const actualServings = menus.reduce((sum, menu) => sum + (menu.actualCount || 0), 0)

  return {
    reports,
    menus,
    summary: {
      totalVisitors,
      totalMeals,
      plannedServings,
      actualServings,
      efficiency: plannedServings > 0 ? Math.round((actualServings / plannedServings) * 100) : 0,
    },
  }
}
