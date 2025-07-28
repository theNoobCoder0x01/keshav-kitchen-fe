import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/crypto-utils";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting database setup...");

    // Create kitchens
    console.log("Creating kitchens...");
    const thakorjiKitchen = await prisma.kitchen.upsert({
      where: { id: "kitchen-thakorji" },
      update: {},
      create: {
        id: "kitchen-thakorji",
        name: "Thakorji Kitchen",
        location: "Main Temple",
        description: "Primary kitchen for Thakorji",
      },
    });

    const premvatiKitchen = await prisma.kitchen.upsert({
      where: { id: "kitchen-premvati" },
      update: {},
      create: {
        id: "kitchen-premvati",
        name: "Premvati Kitchen",
        location: "Premvati Hall",
        description: "Kitchen for Premvati dining hall",
      },
    });

    const aarshKitchen = await prisma.kitchen.upsert({
      where: { id: "kitchen-aarsh" },
      update: {},
      create: {
        id: "kitchen-aarsh",
        name: "Aarsh Kitchen",
        location: "Aarsh Building",
        description: "Kitchen for Aarsh residents",
      },
    });

    // Create users
    console.log("Creating users...");
    const adminPassword = await hashPassword("admin123");
    const userPassword = await hashPassword("password123");

    const admin = await prisma.user.upsert({
      where: { email: "admin@kitchen.com" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@kitchen.com",
        password: adminPassword,
        role: "ADMIN",
      },
    });

    const manager1 = await prisma.user.upsert({
      where: { email: "manager1@kitchen.com" },
      update: {},
      create: {
        name: "Manager One",
        email: "manager1@kitchen.com",
        password: userPassword,
        role: "MANAGER",
        kitchenId: thakorjiKitchen.id,
      },
    });

    const chef1 = await prisma.user.upsert({
      where: { email: "chef1@kitchen.com" },
      update: {},
      create: {
        name: "Chef One",
        email: "chef1@kitchen.com",
        password: userPassword,
        role: "CHEF",
        kitchenId: thakorjiKitchen.id,
      },
    });

    const staff1 = await prisma.user.upsert({
      where: { email: "staff1@kitchen.com" },
      update: {},
      create: {
        name: "Staff One",
        email: "staff1@kitchen.com",
        password: userPassword,
        role: "STAFF",
        kitchenId: thakorjiKitchen.id,
      },
    });

    // Create recipes
    console.log("Creating recipes...");
    const recipe1 = await prisma.recipe.upsert({
      where: { id: "recipe-1" },
      update: {},
      create: {
        id: "recipe-1",
        name: "Khichdi",
        description: "Traditional rice and lentil dish",
        instructions: "1. Wash rice and dal\n2. Cook with spices\n3. Serve hot",

        servings: 10,
        category: "LUNCH",
        userId: chef1.id,
        ingredients: {
          create: [
            {
              name: "Rice",
              quantity: 2,
              unit: "kg",
              costPerUnit: 80,
            },
            {
              name: "Yellow Moong Dal",
              quantity: 1,
              unit: "kg",
              costPerUnit: 120,
            },
            {
              name: "Ghee",
              quantity: 0.25,
              unit: "kg",
              costPerUnit: 600,
            },
            {
              name: "Salt",
              quantity: 0.05,
              unit: "kg",
              costPerUnit: 20,
            },
          ],
        },
      },
    });

    const recipe2 = await prisma.recipe.upsert({
      where: { id: "recipe-2" },
      update: {},
      create: {
        id: "recipe-2",
        name: "Kadhi",
        description: "Yogurt based curry",
        instructions:
          "1. Mix yogurt and besan\n2. Cook with spices\n3. Serve hot",

        servings: 10,
        category: "LUNCH",
        userId: chef1.id,
        ingredients: {
          create: [
            {
              name: "Yogurt",
              quantity: 2,
              unit: "kg",
              costPerUnit: 60,
            },
            {
              name: "Besan",
              quantity: 0.5,
              unit: "kg",
              costPerUnit: 80,
            },
            {
              name: "Ghee",
              quantity: 0.1,
              unit: "kg",
              costPerUnit: 600,
            },
            {
              name: "Salt",
              quantity: 0.03,
              unit: "kg",
              costPerUnit: 20,
            },
          ],
        },
      },
    });

    // Create menus
    console.log("Creating menus...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.menu.upsert({
      where: { id: "menu-1" },
      update: {},
      create: {
        id: "menu-1",
        date: today,
        mealType: "LUNCH",
        recipeId: recipe1.id,
        kitchenId: thakorjiKitchen.id,
        userId: manager1.id,
        servings: 100,
        ghanFactor: 1.0,
        status: "PLANNED",
      },
    });

    await prisma.menu.upsert({
      where: { id: "menu-2" },
      update: {},
      create: {
        id: "menu-2",
        date: today,
        mealType: "LUNCH",
        recipeId: recipe2.id,
        kitchenId: thakorjiKitchen.id,
        userId: manager1.id,
        servings: 100,
        ghanFactor: 1.0,
        status: "PLANNED",
      },
    });

    await prisma.menu.upsert({
      where: { id: "menu-3" },
      update: {},
      create: {
        id: "menu-3",
        date: tomorrow,
        mealType: "LUNCH",
        recipeId: recipe1.id,
        kitchenId: premvatiKitchen.id,
        userId: manager1.id,
        servings: 150,
        ghanFactor: 1.2,
        status: "PLANNED",
      },
    });

    // Create reports
    console.log("Creating reports...");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.report.upsert({
      where: { id: "report-1" },
      update: {},
      create: {
        id: "report-1",
        date: yesterday,
        kitchenId: thakorjiKitchen.id,
        userId: manager1.id,
        visitorCount: 120,
        mealsCounted: 115,
        notes: "Regular day, no special events",
      },
    });

    await prisma.report.upsert({
      where: { id: "report-2" },
      update: {},
      create: {
        id: "report-2",
        date: yesterday,
        kitchenId: premvatiKitchen.id,
        userId: manager1.id,
        visitorCount: 85,
        mealsCounted: 80,
        notes: "Lower attendance due to rain",
      },
    });

    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Error during database setup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();