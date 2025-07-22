import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Test connection function
export async function testPrismaConnection() {
  try {
    await prisma.$connect()
    console.log("✅ Prisma connected successfully")
    return true
  } catch (error) {
    console.error("❌ Prisma connection failed:", error)
    return false
  }
}
