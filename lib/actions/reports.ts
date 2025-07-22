"use server"

import { revalidatePath } from "next/cache"
import prisma from "../prisma"
import { auth } from "../auth"
import { z } from "zod"

const reportSchema = z.object({
  date: z.string(),
  kitchenId: z.string(),
  visitorCount: z.number().int().min(0),
  mealsCounted: z.number().int().min(0),
  notes: z.string().optional(),
})

export async function getReports(startDate?: string, endDate?: string) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    const where: any = {}

    // Filter by date range if provided
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Non-admin users can only see reports for their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      where.kitchenId = session.user.kitchenId
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        kitchen: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        kitchen: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!report) {
      return { success: false, error: "Report not found" }
    }

    // Check if user has access to this report
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== report.kitchenId) {
      throw new Error("Unauthorized to access this report")
    }

    return { success: true, data: report }
  } catch (error) {
    console.error("Error fetching report:", error)
    return { success: false, error: "Failed to fetch report" }
  }
}

export async function createReport(data: z.infer<typeof reportSchema>) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Validate data
    const validatedData = reportSchema.parse(data)

    // Check if user has access to this kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== validatedData.kitchenId) {
      throw new Error("Unauthorized to create report for this kitchen")
    }

    // Check if report already exists for this date and kitchen
    const existingReport = await prisma.report.findFirst({
      where: {
        date: new Date(validatedData.date),
        kitchenId: validatedData.kitchenId,
      },
    })

    if (existingReport) {
      return {
        success: false,
        error: "A report already exists for this date and kitchen",
      }
    }

    const report = await prisma.report.create({
      data: {
        date: new Date(validatedData.date),
        kitchenId: validatedData.kitchenId,
        userId: session.user.id,
        visitorCount: validatedData.visitorCount,
        mealsCounted: validatedData.mealsCounted,
        notes: validatedData.notes,
      },
    })

    revalidatePath("/reports")
    return { success: true, data: report }
  } catch (error) {
    console.error("Error creating report:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create report" }
  }
}

export async function updateReport(id: string, data: Partial<z.infer<typeof reportSchema>>) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Get the current report
    const currentReport = await prisma.report.findUnique({
      where: { id },
    })

    if (!currentReport) {
      return { success: false, error: "Report not found" }
    }

    // Check if user has access to this report
    if (session.user.role !== "ADMIN" && session.user.kitchenId !== currentReport.kitchenId) {
      throw new Error("Unauthorized to update this report")
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        kitchenId: data.kitchenId,
        visitorCount: data.visitorCount,
        mealsCounted: data.mealsCounted,
        notes: data.notes,
      },
    })

    revalidatePath("/reports")
    return { success: true, data: report }
  } catch (error) {
    console.error("Error updating report:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to update report" }
  }
}

export async function deleteReport(id: string) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      throw new Error("Unauthorized")
    }

    // Get the current report
    const currentReport = await prisma.report.findUnique({
      where: { id },
    })

    if (!currentReport) {
      return { success: false, error: "Report not found" }
    }

    // Check if user has access to this report
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "MANAGER" &&
      session.user.kitchenId !== currentReport.kitchenId
    ) {
      throw new Error("Unauthorized to delete this report")
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
