import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// For backward compatibility, we'll create a mock prisma object
// that throws errors if used, encouraging migration to direct SQL
export const prisma = new Proxy({} as any, {
  get() {
    throw new Error("Prisma has been replaced with direct SQL queries. Use the sql function from @/lib/db instead.")
  },
})
