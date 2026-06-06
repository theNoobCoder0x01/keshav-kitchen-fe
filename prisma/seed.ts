import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL is required to seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

// Mirrors the PBKDF2/SHA-256 implementation in lib/crypto-utils.ts
async function hashPassword(password: string): Promise<string> {
  const saltLength = 32;
  const hashLength = 32;
  const salt = crypto.getRandomValues(new Uint8Array(saltLength));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    hashLength * 8,
  );
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return `${saltBase64}.${hashBase64}`;
}

type SeedStats = { created: string[]; skipped: string[] };

// Each seeder checks existence first so the hash is only computed when actually needed.
// Add new seeders below following the same pattern — check → skip or create.

async function seedUsers(stats: SeedStats) {
  const users = [
    {
      id: "user-1",
      email: "admin@kitchen.com",
      name: "Admin User",
      password: "admin123",
      role: "ADMIN" as const,
    },
  ];

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      stats.skipped.push(`user:${u.email}`);
      continue;
    }
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: await hashPassword(u.password),
        role: u.role,
      },
    });
    stats.created.push(`user:${u.email}`);
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  const stats: SeedStats = { created: [], skipped: [] };

  await seedUsers(stats);
  // await seedPremises(stats);   ← add future seeders here

  console.log("\n✅ Seed complete.");
  if (stats.created.length) console.log("  Created :", stats.created.join(", "));
  if (stats.skipped.length) console.log("  Skipped :", stats.skipped.join(", "));
  console.log("\n🔑 Default credentials:");
  console.log("  Admin : admin@kitchen.com / admin123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
