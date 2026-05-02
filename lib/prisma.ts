import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  const log = (
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"]
  ) as NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["log"];

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client");
  }

  const clientOptions = {
    log,
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  } as ConstructorParameters<typeof PrismaClient>[0];

  return new PrismaClient(clientOptions);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
