import { PrismaClient } from "@prisma/client";
import crypto from "crypto"; // Use webcrypto for browser compatibility

// Import the crypto utilities for password hashing
// Note: This is a workaround since we can't directly import ES modules in CommonJS
// In a real scenario, you might want to convert this to TypeScript or use dynamic imports

/**
 * Simple PBKDF2 implementation for the seed script
 * This mirrors the crypto-utils.ts implementation
 */
async function hashPasswordForSeed(password: string) {
  const iterations = 100000;
  const saltLength = 32;
  const hashLength = 32;

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(saltLength));

  // Convert password to ArrayBuffer
  const passwordBuffer = new TextEncoder().encode(password);

  // Import key
  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  // Derive hash
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    key,
    hashLength * 8,
  );

  // Convert to base64
  const hashArray = new Uint8Array(hashBuffer);
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return `${saltBase64}.${hashBase64}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Set up dates for menu creation
  console.log("Setting up dates...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Create users with proper kitchen references
  console.log("Creating users...");
  const hashedPassword = await hashPasswordForSeed("admin123");

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@kitchen.com" },
      update: {},
      create: {
        id: "user-1",
        name: "Admin User",
        email: "admin@kitchen.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    }),
  ]);

  console.log("✅ Database seeded successfully!");
  console.log("🔑 Login credentials:");
  console.log("  Admin (Thakorji): admin@kitchen.com / admin123");
  console.log("  Manager (Premvati): manager1@kitchen.com / password123");
  console.log("  Chef (Aarsh): chef1@kitchen.com / password123");
  console.log("  Staff (Mandir): staff1@kitchen.com / password123");
  console.log("  Chef (Prasad): chef2@kitchen.com / password123");
  console.log("  Staff (Gurukul): staff2@kitchen.com / password123");
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
