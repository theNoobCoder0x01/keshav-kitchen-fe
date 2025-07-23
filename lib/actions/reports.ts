"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const ReportSchema = z.object({
  type: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  title: z.string().min(1),
  content: z.string(),
})

export async function getReports() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const reports = await prisma.report.findMany({
    where: {
      kitchenId: session.user.kitchenId,
    },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  })

  return report
}

export async function createReport(data: z.infer<typeof ReportSchema>) {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  const validatedData = ReportSchema.parse(data)

  const report = await prisma.report.create({
    data: {
      ...validatedData,
      date: new Date(),
      kitchenId: session.user.kitchenId,
      createdById: session.user.id,
    },
  })

  revalidatePath("/reports")
  return report
}

export async function updateReport(id: string, data: z.infer<typeof ReportSchema>) {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  const validatedData = ReportSchema.parse(data)

  const report = await prisma.report.update({
    where: {
      id,
      kitchenId: session.user.kitchenId,
    },
    data: validatedData,
  })

  revalidatePath("/reports")
  return report
}

export async function deleteReport(id: string) {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    throw new Error("Insufficient permissions")
  }

  await prisma.report.delete({
    where: {
      id,
      kitchenId: session.user.kitchenId,
    },
  })

  revalidatePath("/reports")
}

export async function getReportStats() {
  const session = await auth()
  if (!session?.user?.kitchenId) {
    throw new Error("Unauthorized")
  }

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [totalReports, monthlyReports, recentReports] = await Promise.all([
    prisma.report.count({
      where: {
        kitchenId: session.user.kitchenId,
      },
    }),
    prisma.report.count({
      where: {
        kitchenId: session.user.kitchenId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.report.findMany({
      where: {
        kitchenId: session.user.kitchenId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
      },
    }),
  ])

  return {
    totalReports,
    monthlyReports,
    recentReports,
  }
}
