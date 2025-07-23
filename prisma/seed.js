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
        kitchenId: kitchens[0].id,
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
        ingredients: JSON.stringify([
          { name: "Toor Dal", quantity: "2 cups", cost: 80 },
          { name: "Onions", quantity: "2 medium", cost: 20 },
          { name: "Tomatoes", quantity: "3 medium", cost: 30 },
          { name: "Spices", quantity: "mixed", cost: 25 },
        ]),
        instructions: "Cook dal, prepare tadka, mix and serve",
        servings: 10,
        costPerServing: 15.5,
        userId: users[2].id, // Chef
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe-2" },
      update: {},
      create: {
        id: "recipe-2",
        name: "Vegetable Biryani",
        description: "Aromatic rice dish with mixed vegetables",
        ingredients: JSON.stringify([
          { name: "Basmati Rice", quantity: "3 cups", cost: 120 },
          { name: "Mixed Vegetables", quantity: "2 cups", cost: 80 },
          { name: "Spices & Herbs", quantity: "assorted", cost: 50 },
          { name: "Ghee", quantity: "4 tbsp", cost: 40 },
        ]),
        instructions: "Layer rice and vegetables, cook with dum method",
        servings: 12,
        costPerServing: 24.2,
        userId: users[2].id, // Chef
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe-3" },
      update: {},
      create: {
        id: "recipe-3",
        name: "Chapati",
        description: "Fresh whole wheat flatbread",
        ingredients: JSON.stringify([
          { name: "Wheat Flour", quantity: "4 cups", cost: 60 },
          { name: "Water", quantity: "1.5 cups", cost: 0 },
          { name: "Salt", quantity: "1 tsp", cost: 2 },
          { name: "Oil", quantity: "2 tbsp", cost: 8 },
        ]),
        instructions: "Make dough, roll and cook on tawa",
        servings: 20,
        costPerServing: 3.5,
        userId: users[3].id, // Staff
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
        plannedServings: 100,
        actualServings: 95,
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
        plannedServings: 80,
        actualServings: 78,
      },
    }),
    prisma.menu.upsert({
      where: { id: "menu-3" },
      update: {},
      create: {
        id: "menu-3",
        date: tomorrow,
        mealType: "LUNCH",
        recipeId: recipes[2].id,
        kitchenId: kitchens[1].id,
        plannedServings: 120,
        actualServings: null,
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
        type: "DAILY",
        title: "Daily Kitchen Report",
        content: JSON.stringify({
          totalMeals: 173,
          totalCost: 4250,
          wastePercentage: 3.2,
          feedback: "Good response to Dal Tadka",
        }),
        kitchenId: kitchens[0].id,
        createdById: users[1].id, // Manager
      },
    }),
    prisma.report.upsert({
      where: { id: "report-2" },
      update: {},
      create: {
        id: "report-2",
        date: today,
        type: "WEEKLY",
        title: "Weekly Summary",
        content: JSON.stringify({
          totalMeals: 1200,
          totalCost: 28500,
          averageWaste: 2.8,
          popularDishes: ["Dal Tadka", "Vegetable Biryani"],
        }),
        kitchenId: kitchens[0].id,
        createdById: users[0].id, // Admin
      },
    }),
  ])

  console.log("✅ Database seeded successfully!")
  console.log("📊 Created:")
  console.log("  - 2 Kitchens")
  console.log("  - 4 Users")
  console.log("  - 3 Recipes")
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
