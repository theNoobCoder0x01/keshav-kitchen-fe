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

  // Create kitchens first
  console.log("Creating kitchens...");
  const kitchens = await Promise.all([
    prisma.kitchen.upsert({
      where: { id: "kitchen-1" },
      update: {},
      create: {
        id: "kitchen-1",
        name: "Thakorji",
        description: "Thakorji kitchen facility",
        location: "Thakorji Kitchen",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-2" },
      update: {},
      create: {
        id: "kitchen-2",
        name: "Premvati",
        description: "Premvati kitchen facility",
        location: "Premvati Kitchen",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-3" },
      update: {},
      create: {
        id: "kitchen-3",
        name: "Aarsh",
        description: "Aarsh kitchen facility",
        location: "Aarsh Kitchen",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-4" },
      update: {},
      create: {
        id: "kitchen-4",
        name: "Mandir",
        description: "Mandir kitchen facility",
        location: "Mandir Kitchen",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-5" },
      update: {},
      create: {
        id: "kitchen-5",
        name: "Prasad",
        description: "Prasad kitchen facility",
        location: "Prasad Kitchen",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-6" },
      update: {},
      create: {
        id: "kitchen-6",
        name: "Gurukul",
        description: "Gurukul kitchen facility",
        location: "Gurukul Kitchen",
      },
    }),
  ]);

  // Set up dates for menu creation
  console.log("Setting up dates...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Create users with proper kitchen references
  console.log("Creating users...");
  const hashedPassword = await hashPasswordForSeed("admin123");
  const hashedPassword2 = await hashPasswordForSeed("password123");

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
        kitchenId: kitchens[0].id, // Thakorji
      },
    }),
    prisma.user.upsert({
      where: { email: "manager1@kitchen.com" },
      update: {},
      create: {
        id: "user-2",
        name: "Kitchen Manager",
        email: "manager1@kitchen.com",
        password: hashedPassword2,
        role: "MANAGER",
        kitchenId: kitchens[1].id, // Premvati
      },
    }),
    prisma.user.upsert({
      where: { email: "chef1@kitchen.com" },
      update: {},
      create: {
        id: "user-3",
        name: "Head Chef",
        email: "chef1@kitchen.com",
        password: hashedPassword2,
        role: "CHEF",
        kitchenId: kitchens[2].id, // Aarsh
      },
    }),
    prisma.user.upsert({
      where: { email: "staff1@kitchen.com" },
      update: {},
      create: {
        id: "user-4",
        name: "Kitchen Staff",
        email: "staff1@kitchen.com",
        password: hashedPassword2,
        role: "STAFF",
        kitchenId: kitchens[3].id, // Mandir
      },
    }),
    prisma.user.upsert({
      where: { email: "chef2@kitchen.com" },
      update: {},
      create: {
        id: "user-5",
        name: "Prasad Chef",
        email: "chef2@kitchen.com",
        password: hashedPassword2,
        role: "CHEF",
        kitchenId: kitchens[4].id, // Prasad
      },
    }),
    prisma.user.upsert({
      where: { email: "staff2@kitchen.com" },
      update: {},
      create: {
        id: "user-6",
        name: "Gurukul Staff",
        email: "staff2@kitchen.com",
        password: hashedPassword2,
        role: "STAFF",
        kitchenId: kitchens[5].id, // Gurukul
      },
    }),
  ]);

  // Create recipes with proper nested ingredients
  console.log("Creating recipes...");
  await Promise.all([
    prisma.recipe.upsert({
      where: { id: "recipe-1" },
      update: {},
      create: {
        id: "recipe-1",
        name: "હરિભક્તો માટે દૂધ પાક",
        description: "Traditional Gujarati હરિભક્તો માટે દૂધ પાક",
        instructions:
          "Prepare હરિભક્તો માટે દૂધ પાક according to traditional Gujarati recipe",
        servings: 10,
        category: "Liquid Dessert",
        subcategory: "Gujarati",
        userId: users[0].id,
        ingredients: {
          create: [
            {
              name: "Milk",
              quantity: 2,
              unit: "liters",
              costPerUnit: 60,
            },
            {
              name: "Sugar",
              quantity: 200,
              unit: "grams",
              costPerUnit: 40,
            },
            {
              name: "Saffron",
              quantity: 1,
              unit: "gram",
              costPerUnit: 200,
            },
          ],
        },
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe-2" },
      update: {},
      create: {
        id: "recipe-2",
        name: "ઠાકોરજી માટે દૂધ પાક",
        description: "Traditional Gujarati ઠાકોરજી માટે દૂધ પાક",
        instructions:
          "Prepare ઠાકોરજી માટે દૂધ પાક according to traditional Gujarati recipe",
        servings: 10,
        category: "Liquid Dessert",
        subcategory: "Gujarati",
        userId: users[1].id,
        ingredients: {
          create: [
            {
              name: "Milk",
              quantity: 2,
              unit: "liters",
              costPerUnit: 60,
            },
            {
              name: "Sugar",
              quantity: 200,
              unit: "grams",
              costPerUnit: 40,
            },
            {
              name: "Cardamom",
              quantity: 5,
              unit: "pieces",
              costPerUnit: 20,
            },
          ],
        },
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe-3" },
      update: {},
      create: {
        id: "recipe-3",
        name: "ખીર",
        description: "Traditional Gujarati ખીર",
        instructions: "Prepare ખીર according to traditional Gujarati recipe",
        servings: 10,
        category: "Liquid Dessert",
        subcategory: "Gujarati",
        userId: users[2].id,
        ingredients: {
          create: [
            {
              name: "Rice",
              quantity: 100,
              unit: "grams",
              costPerUnit: 20,
            },
            {
              name: "Milk",
              quantity: 1,
              unit: "liter",
              costPerUnit: 60,
            },
            {
              name: "Sugar",
              quantity: 100,
              unit: "grams",
              costPerUnit: 40,
            },
          ],
        },
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe-4" },
      update: {},
      create: {
        id: "recipe-4",
        name: "ફ્રુટ સલાડ",
        description: "Traditional Gujarati ફ્રુટ સલાડ",
        instructions:
          "Prepare ફ્રુટ સલાડ according to traditional Gujarati recipe",
        servings: 10,
        category: "Liquid Dessert",
        subcategory: "Gujarati",
        userId: users[3].id,
        ingredients: {
          create: [
            {
              name: "Mixed Fruits",
              quantity: 500,
              unit: "grams",
              costPerUnit: 100,
            },
            {
              name: "Milk",
              quantity: 0.5,
              unit: "liter",
              costPerUnit: 60,
            },
            {
              name: "Honey",
              quantity: 50,
              unit: "ml",
              costPerUnit: 80,
            },
          ],
        },
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe-5" },
      update: {},
      create: {
        id: "recipe-5",
        name: "Sambar",
        description: "South Indian lentil soup with vegetables",
        instructions: "Cook dal and vegetables with sambar powder",

        servings: 15,
        category: "Soup",
        subcategory: "South Indian",
        userId: users[0].id,
        ingredients: {
          create: [
            {
              name: "Toor Dal",
              quantity: 1.5,
              unit: "cups",
              costPerUnit: 30,
            },
            {
              name: "Sambar Vegetables",
              quantity: 2,
              unit: "cups",
              costPerUnit: 35,
            },
            {
              name: "Sambar Powder",
              quantity: 2,
              unit: "tbsp",
              costPerUnit: 15,
            },
          ],
        },
      },
    }),
  ]);

  // Fetch recipes with their ingredients
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: true,
    },
  });

  // Function to create menu ingredients from recipe ingredients
  function createMenuIngredients(recipe: any, servings: number) {
    return recipe.ingredients.map((ingredient: any) => ({
      name: ingredient.name,
      quantity: (ingredient.quantity * servings) / recipe.servings,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit || 0,
    }));
  }

  // Create menus
  console.log("Creating menus...");

  await Promise.all([
    // Thakorji Kitchen - Today
    prisma.menu.create({
      data: {
        date: today,
        mealType: "BREAKFAST",
        recipeId: recipes[2].id, // ખીર
        kitchenId: kitchens[0].id, // Thakorji
        userId: users[0].id,
        servings: 50,
        ghanFactor: 1.2,
        status: "PLANNED",
        ingredients: {
          create: createMenuIngredients(recipes[2], 50),
        },
      },
    }),
    prisma.menu.create({
      data: {
        date: today,
        mealType: "LUNCH",
        recipeId: recipes[0].id, // હરિભક્તો માટે દૂધ પાક
        kitchenId: kitchens[0].id, // Thakorji
        userId: users[0].id,
        servings: 100,
        ghanFactor: 1.0,
        status: "PLANNED",
        ingredients: {
          create: createMenuIngredients(recipes[0], 100),
        },
      },
    }),

    // Premvati Kitchen - Today
    prisma.menu.create({
      data: {
        date: today,
        mealType: "BREAKFAST",
        recipeId: recipes[1].id, // ઠાકોરજી માટે દૂધ પાક
        kitchenId: kitchens[1].id, // Premvati
        userId: users[1].id,
        servings: 80,
        ghanFactor: 1.1,
        status: "PLANNED",
        ingredients: {
          create: createMenuIngredients(recipes[1], 80),
        },
      },
    }),
    prisma.menu.create({
      data: {
        date: today,
        mealType: "DINNER",
        recipeId: recipes[4].id, // Sambar
        kitchenId: kitchens[1].id, // Premvati
        userId: users[1].id,
        servings: 120,
        ghanFactor: 0.9,
        status: "PLANNED",
        ingredients: {
          create: createMenuIngredients(recipes[4], 120),
        },
      },
    }),

    // Aarsh Kitchen - Today
    prisma.menu.create({
      data: {
        date: today,
        mealType: "LUNCH",
        recipeId: recipes[3].id, // ફ્રુટ સલાડ
        kitchenId: kitchens[2].id, // Aarsh
        userId: users[2].id,
        servings: 60,
        ghanFactor: 1.0,
        status: "COMPLETED",
        actualCount: 58,
        ingredients: {
          create: createMenuIngredients(recipes[3], 60),
        },
      },
    }),

    // Tomorrow's menus
    prisma.menu.create({
      data: {
        date: tomorrow,
        mealType: "BREAKFAST",
        recipeId: recipes[2].id, // ખીર
        kitchenId: kitchens[0].id, // Thakorji
        userId: users[0].id,
        servings: 60,
        ghanFactor: 1.0,
        status: "PLANNED",
        ingredients: {
          create: createMenuIngredients(recipes[2], 60),
        },
      },
    }),
    prisma.menu.create({
      data: {
        date: tomorrow,
        mealType: "LUNCH",
        recipeId: recipes[4].id, // Sambar
        kitchenId: kitchens[3].id, // Mandir
        userId: users[3].id,
        servings: 90,
        ghanFactor: 1.1,
        status: "PLANNED",
        ingredients: {
          create: createMenuIngredients(recipes[4], 90),
        },
      },
    }),
  ]);

  // Create reports
  console.log("Creating reports...");
  await Promise.all([
    // Thakorji Kitchen Reports
    prisma.report.create({
      data: {
        date: today,
        kitchenId: kitchens[0].id, // Thakorji
        userId: users[0].id,
        visitorCount: 150,
        mealsCounted: 145,
        notes: "Good day with high attendance at Thakorji kitchen",
      },
    }),
    prisma.report.create({
      data: {
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        kitchenId: kitchens[0].id, // Thakorji
        userId: users[0].id,
        visitorCount: 120,
        mealsCounted: 118,
        notes: "Normal operations at Thakorji kitchen",
      },
    }),

    // Premvati Kitchen Reports
    prisma.report.create({
      data: {
        date: today,
        kitchenId: kitchens[1].id, // Premvati
        userId: users[1].id,
        visitorCount: 95,
        mealsCounted: 92,
        notes: "Steady operations at Premvati kitchen",
      },
    }),

    // Aarsh Kitchen Reports
    prisma.report.create({
      data: {
        date: today,
        kitchenId: kitchens[2].id, // Aarsh
        userId: users[2].id,
        visitorCount: 75,
        mealsCounted: 73,
        notes: "Smooth operations at Aarsh kitchen",
      },
    }),

    // Mandir Kitchen Reports
    prisma.report.create({
      data: {
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        kitchenId: kitchens[3].id, // Mandir
        userId: users[3].id,
        visitorCount: 110,
        mealsCounted: 108,
        notes: "Good attendance at Mandir kitchen",
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
