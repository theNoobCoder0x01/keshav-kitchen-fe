"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export async function createReport(formData: FormData) {
  try {
    const session = await requireAuth()

    const rawData = {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      date: new Date(formData.get("date") as string),
      kitchenId: formData.get("kitchenId") as string,
      totalVisitors: Number.parseInt(formData.get("totalVisitors") as string),
      totalMeals: Number.parseInt(formData.get("totalMeals") as string),
      totalCost: Number.parseFloat(formData.get("totalCost") as string),
      notes: formData.get("notes") as string,
    }

    const report = await prisma.report.create({
      data: {
        ...rawData,
        createdBy: session.user.id,
      },
      include: {
        kitchen: {
          select: { name: true },
        },
        creator: {
          select: { name: true },
        },
      },
    })

    revalidatePath("/reports")
    return { success: true, report }
  } catch (error) {
    console.error("Create report error:", error)
    return { success: false, error: "Failed to create report" }
  }
}

export async function getReports(page = 1, limit = 10, kitchenId?: string, type?: string) {
  try {
    const session = await requireAuth()

    const skip = (page - 1) * limit
    const where = {
      ...(kitchenId && { kitchenId }),
      ...(type && { type }),
      ...(session.user.kitchenId && session.user.role !== "ADMIN" && { kitchenId: session.user.kitchenId }),
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          kitchen: {
            select: { name: true },
          },
          creator: {
            select: { name: true },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ])

    return {
      reports,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error) {
    console.error("Get reports error:", error)
    return {
      reports: [],
      total: 0,
      pages: 0,
      currentPage: 1,
    }
  }
}

export async function getReportStats(kitchenId?: string) {
  try {
    const session = await requireAuth()

    const where = {
      ...(kitchenId && { kitchenId }),
      ...(session.user.kitchenId && session.user.role !== "ADMIN" && { kitchenId: session.user.kitchenId }),
    }

    const today = new Date()
    const thisWeek = { gte: startOfWeek(today), lte: endOfWeek(today) }
    const thisMonth = { gte: startOfMonth(today), lte: endOfMonth(today) }

    const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
      prisma.report.aggregate({
        where: { ...where, date: { gte: startOfDay(today), lte: endOfDay(today) } },
        _sum: { totalVisitors: true, totalMeals: true, totalCost: true },
        _count: { id: true },
      }),
      prisma.report.aggregate({
        where: { ...where, date: thisWeek },
        _sum: { totalVisitors: true, totalMeals: true, totalCost: true },
        _count: { id: true },
      }),
      prisma.report.aggregate({
        where: { ...where, date: thisMonth },
        _sum: { totalVisitors: true, totalMeals: true, totalCost: true },
        _count: { id: true },
      }),
    ])

    return {
      daily: {
        visitors: dailyStats._sum.totalVisitors || 0,
        meals: dailyStats._sum.totalMeals || 0,
        cost: dailyStats._sum.totalCost || 0,
        reports: dailyStats._count.id || 0,
      },
      weekly: {
        visitors: weeklyStats._sum.totalVisitors || 0,
        meals: weeklyStats._sum.totalMeals || 0,
        cost: weeklyStats._sum.totalCost || 0,
        reports: weeklyStats._count.id || 0,
      },
      monthly: {
        visitors: monthlyStats._sum.totalVisitors || 0,
        meals: monthlyStats._sum.totalMeals || 0,
        cost: monthlyStats._sum.totalCost || 0,
        reports: monthlyStats._count.id || 0,
      },
    }
  } catch (error) {
    console.error("Get report stats error:", error)
    return {
      daily: { visitors: 0, meals: 0, cost: 0, reports: 0 },
      weekly: { visitors: 0, meals: 0, cost: 0, reports: 0 },
      monthly: { visitors: 0, meals: 0, cost: 0, reports: 0 },
    }
  }
}
