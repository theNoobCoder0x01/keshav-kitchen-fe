const { PrismaClient } = require("@prisma/client");

// Import the crypto utilities for password hashing
// Note: This is a workaround since we can't directly import ES modules in CommonJS
// In a real scenario, you might want to convert this to TypeScript or use dynamic imports

/**
 * Simple PBKDF2 implementation for the seed script
 * This mirrors the crypto-utils.ts implementation
 */
async function hashPasswordForSeed(password) {
  const iterations = 100000;
  const saltLength = 32;
  const hashLength = 32;
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(saltLength));
  
  // Convert password to ArrayBuffer
  const passwordBuffer = new TextEncoder().encode(password);
  
  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive hash
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    key,
    hashLength * 8
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
        name: "Main Kitchen",
        description: "Primary kitchen facility for daily operations",
        location: "Ground Floor, Building A",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-2" },
      update: {},
      create: {
        id: "kitchen-2",
        name: "Secondary Kitchen",
        description: "Secondary kitchen for overflow and special events",
        location: "First Floor, Building B",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-3" },
      update: {},
      create: {
        id: "kitchen-3",
        name: "Catering Kitchen",
        description: "Specialized kitchen for catering services",
        location: "Ground Floor, Building C",
      },
    }),
  ]);

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
        kitchenId: kitchens[0].id,
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
        kitchenId: kitchens[0].id,
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
        kitchenId: kitchens[1].id,
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
        kitchenId: kitchens[2].id,
      },
    }),
  ]);

  // Create recipes with proper nested ingredients
  console.log("Creating recipes...");
  const recipes = await Promise.all([
    prisma.recipe.upsert({
      where: { id: "recipe-1" },
      update: {},
      create: {
        id: "recipe-1",
        name: "Dal Tadka",
        description: "Traditional lentil curry with spices",
        instructions: "Cook dal, prepare tadka, mix and serve",
        prepTime: 15,
        cookTime: 30,
        servings: 10,
        category: "Main Course",
        userId: users[0].id,
        ingredients: {
          create: [
            {
              name: "Toor Dal",
              quantity: 2,
              unit: "cups",
              costPerUnit: 40,
            },
            {
              name: "Onions",
              quantity: 2,
              unit: "medium",
              costPerUnit: 10,
            },
            {
              name: "Tomatoes",
              quantity: 3,
              unit: "medium",
              costPerUnit: 10,
            },
            {
              name: "Spices",
              quantity: 1,
              unit: "mixed",
              costPerUnit: 25,
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
        name: "Vegetable Biryani",
        description: "Aromatic rice dish with mixed vegetables",
        instructions: "Layer rice and vegetables, cook with spices",
        prepTime: 30,
        cookTime: 45,
        servings: 8,
        category: "Main Course",
        userId: users[1].id,
        ingredients: {
          create: [
            {
              name: "Basmati Rice",
              quantity: 3,
              unit: "cups",
              costPerUnit: 60,
            },
            {
              name: "Mixed Vegetables",
              quantity: 2,
              unit: "cups",
              costPerUnit: 40,
            },
            {
              name: "Biryani Spices",
              quantity: 1,
              unit: "packet",
              costPerUnit: 30,
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
        name: "Chapati",
        description: "Traditional Indian flatbread",
        instructions: "Mix flour and water, roll and cook on tawa",
        prepTime: 20,
        cookTime: 15,
        servings: 20,
        category: "Bread",
        userId: users[2].id,
        ingredients: {
          create: [
            {
              name: "Wheat Flour",
              quantity: 2,
              unit: "cups",
              costPerUnit: 30,
            },
            {
              name: "Water",
              quantity: 1,
              unit: "cup",
              costPerUnit: 0,
            },
            {
              name: "Salt",
              quantity: 1,
              unit: "tsp",
              costPerUnit: 1,
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
        name: "Mixed Vegetable Curry",
        description: "Healthy curry with seasonal vegetables",
        instructions: "Sauté vegetables with spices and simmer",
        prepTime: 15,
        cookTime: 25,
        servings: 12,
        category: "Main Course",
        userId: users[3].id,
        ingredients: {
          create: [
            {
              name: "Seasonal Vegetables",
              quantity: 3,
              unit: "cups",
              costPerUnit: 50,
            },
            {
              name: "Curry Spices",
              quantity: 1,
              unit: "mix",
              costPerUnit: 20,
            },
            {
              name: "Coconut Oil",
              quantity: 2,
              unit: "tbsp",
              costPerUnit: 10,
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
        prepTime: 10,
        cookTime: 30,
        servings: 15,
        category: "Soup",
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

  // Create menus
  console.log("Creating menus...");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await Promise.all([
    prisma.menu.create({
      data: {
        date: today,
        mealType: "BREAKFAST",
        recipeId: recipes[2].id, // Chapati
        kitchenId: kitchens[0].id,
        userId: users[0].id,
        servings: 50,
        ghanFactor: 1.2,
        status: "PLANNED",
      },
    }),
    prisma.menu.create({
      data: {
        date: today,
        mealType: "LUNCH",
        recipeId: recipes[0].id, // Dal Tadka
        kitchenId: kitchens[0].id,
        userId: users[1].id,
        servings: 100,
        ghanFactor: 1.0,
        status: "PLANNED",
      },
    }),
    prisma.menu.create({
      data: {
        date: today,
        mealType: "LUNCH",
        recipeId: recipes[1].id, // Vegetable Biryani
        kitchenId: kitchens[0].id,
        userId: users[1].id,
        servings: 80,
        ghanFactor: 1.1,
        status: "PLANNED",
      },
    }),
    prisma.menu.create({
      data: {
        date: today,
        mealType: "DINNER",
        recipeId: recipes[4].id, // Sambar
        kitchenId: kitchens[0].id,
        userId: users[2].id,
        servings: 120,
        ghanFactor: 0.9,
        status: "PLANNED",
      },
    }),
    prisma.menu.create({
      data: {
        date: tomorrow,
        mealType: "BREAKFAST",
        recipeId: recipes[2].id, // Chapati
        kitchenId: kitchens[0].id,
        userId: users[0].id,
        servings: 60,
        ghanFactor: 1.0,
        status: "PLANNED",
      },
    }),
  ]);

  // Create reports
  console.log("Creating reports...");
  await Promise.all([
    prisma.report.create({
      data: {
        date: today,
        kitchenId: kitchens[0].id,
        userId: users[0].id,
        visitorCount: 150,
        mealsCounted: 145,
        notes: "Good day with high attendance",
      },
    }),
    prisma.report.create({
      data: {
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        kitchenId: kitchens[0].id,
        userId: users[1].id,
        visitorCount: 120,
        mealsCounted: 118,
        notes: "Normal operations",
      },
    }),
  ]);

  console.log("✅ Database seeded successfully!");
  console.log("🔑 Login credentials:");
  console.log("  Admin: admin@kitchen.com / admin123");
  console.log("  Manager: manager1@kitchen.com / password123");
  console.log("  Chef: chef1@kitchen.com / password123");
  console.log("  Staff: staff1@kitchen.com / password123");
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
