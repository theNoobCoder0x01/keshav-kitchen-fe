const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create kitchens first
  console.log("Creating kitchens...")
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
        description: "Backup kitchen for high-volume days",
        location: "First Floor, Building B",
      },
    }),
  ])

  console.log("Creating users...")
  const hashedPassword = await bcrypt.hash("admin123", 12)
  const hashedPassword2 = await bcrypt.hash("password123", 12)

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@kitchen.com" },
      update: {},
      create: {
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
        name: "Head Chef",
        email: "chef1@kitchen.com",
        password: hashedPassword2,
        role: "CHEF",
        kitchenId: kitchens[0].id,
      },
    }),
    prisma.user.upsert({
      where: { email: "staff1@kitchen.com" },
      update: {},
      create: {
        name: "Kitchen Staff",
        email: "staff1@kitchen.com",
        password: hashedPassword2,
        role: "STAFF",
        kitchenId: kitchens[1].id,
      },
    }),
  ])

  console.log("Creating recipes...")
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
        servings: 100,
        category: "Main Course",
        userId: users[2].id, // Chef
        ingredients: {
          create: [
            {
              name: "Toor Dal",
              quantity: 2.0,
              unit: "kg",
              costPerUnit: 80.0,
            },
            {
              name: "Onions",
              quantity: 0.5,
              unit: "kg",
              costPerUnit: 25.0,
            },
            {
              name: "Tomatoes",
              quantity: 0.8,
              unit: "kg",
              costPerUnit: 30.0,
            },
            {
              name: "Spices",
              quantity: 0.1,
              unit: "kg",
              costPerUnit: 150.0,
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
        instructions: "Layer rice and vegetables, cook with dum method",
        prepTime: 45,
        cookTime: 60,
        servings: 120,
        category: "Main Course",
        userId: users[2].id, // Chef
        ingredients: {
          create: [
            {
              name: "Basmati Rice",
              quantity: 3.0,
              unit: "kg",
              costPerUnit: 120.0,
            },
            {
              name: "Mixed Vegetables",
              quantity: 2.0,
              unit: "kg",
              costPerUnit: 40.0,
            },
            {
              name: "Spices & Herbs",
              quantity: 0.2,
              unit: "kg",
              costPerUnit: 250.0,
            },
            {
              name: "Ghee",
              quantity: 0.3,
              unit: "liter",
              costPerUnit: 400.0,
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
        description: "Fresh whole wheat flatbread",
        instructions: "Make dough, roll and cook on tawa",
        prepTime: 30,
        cookTime: 45,
        servings: 200,
        category: "Bread",
        userId: users[3].id, // Staff
        ingredients: {
          create: [
            {
              name: "Wheat Flour",
              quantity: 4.0,
              unit: "kg",
              costPerUnit: 35.0,
            },
            {
              name: "Salt",
              quantity: 0.05,
              unit: "kg",
              costPerUnit: 20.0,
            },
            {
              name: "Oil",
              quantity: 0.2,
              unit: "liter",
              costPerUnit: 100.0,
            },
          ],
        },
      },
    }),
  ])

  console.log("Creating menus...")
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await Promise.all([
    prisma.menu.upsert({
      where: { id: "menu-1" },
      update: {},
      create: {
        id: "menu-1",
        date: today,
        mealType: "LUNCH",
        recipeId: recipes[0].id,
        kitchenId: kitchens[0].id,
        userId: users[1].id, // Manager
        servings: 100,
        ghanFactor: 1.0,
        status: "COMPLETED",
        actualCount: 95,
        notes: "Good response to Dal Tadka",
      },
    }),
    prisma.menu.upsert({
      where: { id: "menu-2" },
      update: {},
      create: {
        id: "menu-2",
        date: today,
        mealType: "DINNER",
        recipeId: recipes[1].id,
        kitchenId: kitchens[0].id,
        userId: users[1].id, // Manager
        servings: 80,
        ghanFactor: 1.2,
        status: "COMPLETED",
        actualCount: 78,
        notes: "Biryani was popular",
      },
    }),
    prisma.menu.upsert({
      where: { id: "menu-3" },
      update: {},
      create: {
        id: "menu-3",
        date: tomorrow,
        mealType: "BREAKFAST",
        recipeId: recipes[2].id,
        kitchenId: kitchens[1].id,
        userId: users[3].id, // Staff
        servings: 120,
        ghanFactor: 1.5,
        status: "PLANNED",
        notes: "Fresh chapatis for breakfast",
      },
    }),
  ])

  console.log("Creating reports...")
  await Promise.all([
    prisma.report.upsert({
      where: { id: "report-1" },
      update: {},
      create: {
        id: "report-1",
        date: today,
        kitchenId: kitchens[0].id,
        userId: users[1].id, // Manager
        visitorCount: 173,
        mealsCounted: 173,
        notes: "Good response to Dal Tadka and Biryani. No major issues.",
      },
    }),
    prisma.report.upsert({
      where: { id: "report-2" },
      update: {},
      create: {
        id: "report-2",
        date: today,
        kitchenId: kitchens[1].id,
        userId: users[3].id, // Staff
        visitorCount: 45,
        mealsCounted: 45,
        notes: "Smooth operations in secondary kitchen.",
      },
    }),
  ])

  console.log("✅ Database seeded successfully!")
  console.log("📊 Created:")
  console.log("  - 2 Kitchens")
  console.log("  - 4 Users")
  console.log("  - 3 Recipes with ingredients")
  console.log("  - 3 Menus")
  console.log("  - 2 Reports")
  console.log("")
  console.log("🔑 Login credentials:")
  console.log("  Admin: admin@kitchen.com / admin123")
  console.log("  Manager: manager1@kitchen.com / password123")
  console.log("  Chef: chef1@kitchen.com / password123")
  console.log("  Staff: staff1@kitchen.com / password123")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
