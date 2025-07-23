import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing database connection...");

    // Try to query the database
    const kitchenCount = await prisma.kitchen.count();
    const userCount = await prisma.user.count();
    const recipeCount = await prisma.recipe.count();
    const menuCount = await prisma.menu.count();
    const reportCount = await prisma.report.count();

    console.log("Connection successful!");
    console.log("Database statistics:");
    console.log(`- Kitchens: ${kitchenCount}`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Recipes: ${recipeCount}`);
    console.log(`- Menus: ${menuCount}`);
    console.log(`- Reports: ${reportCount}`);

    console.log("\nDatabase is ready to use!");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
