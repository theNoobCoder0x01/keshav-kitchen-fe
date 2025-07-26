import { prisma } from "./prisma";

// Re-export prisma for convenience
export { prisma };

// Test the connection
export async function testConnection() {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log("✅ Database connected successfully:", result);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}
