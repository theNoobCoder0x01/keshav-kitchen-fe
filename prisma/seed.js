const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create kitchens first
  console.log("Creating kitchens...")
  const kitchen1 = await prisma.kitchen.upsert({
    where: { id: "kitchen-1" },
    update: {},
    create: {
      id: "kitchen-1",
      name: "Main Kitchen",
      description: "Primary kitchen facility for daily operations",
      location: "Ground Floor, Building A",
    },
  })

  const kitchen2 = await prisma.kitchen.upsert({
    where: { id: "kitchen-2" },
    update: {},
    create: {
      id: "kitchen-2",
      name: "Secondary Kitchen",
      description: "Backup kitchen for overflow and special events",
      location: "First Floor, Building B",
    },
  })

  const kitchen3 = await prisma.kitchen.upsert({
    where: { id: "kitchen-3" },
    update: {},
    create: {
      id: "kitchen-3",
      name: "Catering Kitchen",
      description: "Specialized kitchen for external catering services",
      location: "Ground Floor, Building C",
    },
  })

  const kitchen4 = await prisma.kitchen.upsert({
    where: { id: "kitchen-4" },
    update: {},
    create: {
      id: "kitchen-4",
      name: "Training Kitchen",
      description: "Kitchen facility for staff training and development",
      location: "Second Floor, Building A",
    },
  })

  const kitchen5 = await prisma.kitchen.upsert({
    where: { id: "kitchen-5" },
    update: {},
    create: {
      id: "kitchen-5",
      name: "Emergency Kitchen",
      description: "Emergency backup kitchen facility",
      location: "Basement, Building A",
    },
  })

  console.log("✅ Created 5 kitchens")

  // Create users next
  console.log("Creating users...")
  const hashedPassword = await bcrypt.hash("admin123", 12)
  const hashedPassword2 = await bcrypt.hash("password123", 12)

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kitchen.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@kitchen.com",
      password: hashedPassword,
      role: "ADMIN",
      kitchenId: kitchen1.id,
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: "manager1@kitchen.com" },
    update: {},
    create: {
      name: "Kitchen Manager",
      email: "manager1@kitchen.com",
      password: hashedPassword2,
      role: "MANAGER",
      kitchenId: kitchen1.id,
    },
  })

  const chefUser = await prisma.user.upsert({
    where: { email: "chef1@kitchen.com" },
    update: {},
    create: {
      name: "Head Chef",
      email: "chef1@kitchen.com",
      password: hashedPassword2,
      role: "CHEF",
      kitchenId: kitchen1.id,
    },
  })

  const staffUser = await prisma.user.upsert({
    where: { email: "staff1@kitchen.com" },
    update: {},
    create: {
      name: "Kitchen Staff",
      email: "staff1@kitchen.com",
      password: hashedPassword2,
      role: "STAFF",
      kitchenId: kitchen2.id,
    },
  })

  console.log("✅ Created 4 users")

  // Create recipes with ingredients (now that users exist)
  console.log("Creating recipes...")
  const recipe1 = await prisma.recipe.upsert({
    where: { id: "recipe-1" },
    update: {},
    create: {
      id: "recipe-1",
      name: "Vegetable Curry",
      description: "Traditional mixed vegetable curry with spices",
      servings: 100,
      prepTime: 30,
      cookTime: 45,
      category: "Main Course",
      instructions: "Heat oil, add spices, cook vegetables, simmer with sauce",
      userId: chefUser.id,
      ingredients: {
        create: [
          {
            name: "Mixed Vegetables",
            quantity: 5.0,
            unit: "kg",
            costPerUnit: 20.0,
          },
          {
            name: "Onions",
            quantity: 1.0,
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
            quantity: 0.2,
            unit: "kg",
            costPerUnit: 150.0,
          },
          {
            name: "Oil",
            quantity: 0.3,
            unit: "liter",
            costPerUnit: 80.0,
          },
        ],
      },
    },
  })

  const recipe2 = await prisma.recipe.upsert({
    where: { id: "recipe-2" },
    update: {},
    create: {
      id: "recipe-2",
      name: "Dal Tadka",
      description: "Yellow lentils with tempering",
      servings: 100,
      prepTime: 15,
      cookTime: 30,
      category: "Main Course",
      instructions: "Boil lentils, prepare tempering, mix and serve",
      userId: chefUser.id,
      ingredients: {
        create: [
          {
            name: "Yellow Lentils",
            quantity: 2.0,
            unit: "kg",
            costPerUnit: 60.0,
          },
          {
            name: "Onions",
            quantity: 0.5,
            unit: "kg",
            costPerUnit: 25.0,
          },
          {
            name: "Tomatoes",
            quantity: 0.4,
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
  })

  const recipe3 = await prisma.recipe.upsert({
    where: { id: "recipe-3" },
    update: {},
    create: {
      id: "recipe-3",
      name: "Jeera Rice",
      description: "Cumin flavored basmati rice",
      servings: 100,
      prepTime: 10,
      cookTime: 20,
      category: "Side Dish",
      instructions: "Wash rice, heat oil, add cumin, cook rice",
      userId: chefUser.id,
      ingredients: {
        create: [
          {
            name: "Basmati Rice",
            quantity: 3.0,
            unit: "kg",
            costPerUnit: 80.0,
          },
          {
            name: "Cumin Seeds",
            quantity: 0.05,
            unit: "kg",
            costPerUnit: 200.0,
          },
          {
            name: "Oil",
            quantity: 0.2,
            unit: "liter",
            costPerUnit: 80.0,
          },
        ],
      },
    },
  })

  const recipe4 = await prisma.recipe.upsert({
    where: { id: "recipe-4" },
    update: {},
    create: {
      id: "recipe-4",
      name: "Mixed Salad",
      description: "Fresh mixed vegetable salad",
      servings: 100,
      prepTime: 20,
      cookTime: 0,
      category: "Salad",
      instructions: "Chop vegetables, mix with dressing, serve fresh",
      userId: staffUser.id,
      ingredients: {
        create: [
          {
            name: "Cucumber",
            quantity: 1.5,
            unit: "kg",
            costPerUnit: 20.0,
          },
          {
            name: "Tomatoes",
            quantity: 1.0,
            unit: "kg",
            costPerUnit: 30.0,
          },
          {
            name: "Onions",
            quantity: 0.5,
            unit: "kg",
            costPerUnit: 25.0,
          },
          {
            name: "Lemon",
            quantity: 0.2,
            unit: "kg",
            costPerUnit: 50.0,
          },
        ],
      },
    },
  })

  const recipe5 = await prisma.recipe.upsert({
    where: { id: "recipe-5" },
    update: {},
    create: {
      id: "recipe-5",
      name: "Masala Chai",
      description: "Spiced Indian tea",
      servings: 50,
      prepTime: 5,
      cookTime: 10,
      category: "Beverage",
      instructions: "Boil water, add tea and spices, add milk, serve hot",
      userId: managerUser.id,
      ingredients: {
        create: [
          {
            name: "Tea Leaves",
            quantity: 0.2,
            unit: "kg",
            costPerUnit: 300.0,
          },
          {
            name: "Milk",
            quantity: 2.0,
            unit: "liter",
            costPerUnit: 50.0,
          },
          {
            name: "Sugar",
            quantity: 0.5,
            unit: "kg",
            costPerUnit: 40.0,
          },
          {
            name: "Spices",
            quantity: 0.05,
            unit: "kg",
            costPerUnit: 150.0,
          },
        ],
      },
    },
  })

  console.log("✅ Created 5 recipes with ingredients")

  // Create menus
  console.log("Creating menus...")
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const menu1 = await prisma.menu.upsert({
    where: { id: "menu-1" },
    update: {},
    create: {
      id: "menu-1",
      date: today,
      mealType: "BREAKFAST",
      recipeId: recipe5.id,
      kitchenId: kitchen1.id,
      userId: managerUser.id,
      servings: 150,
      ghanFactor: 3.0,
      status: "COMPLETED",
      actualCount: 145,
      notes: "Good turnout for breakfast",
    },
  })

  const menu2 = await prisma.menu.upsert({
    where: { id: "menu-2" },
    update: {},
    create: {
      id: "menu-2",
      date: today,
      mealType: "LUNCH",
      recipeId: recipe1.id,
      kitchenId: kitchen1.id,
      userId: managerUser.id,
      servings: 200,
      ghanFactor: 2.0,
      status: "COMPLETED",
      actualCount: 195,
      notes: "Vegetable curry was popular",
    },
  })

  const menu3 = await prisma.menu.upsert({
    where: { id: "menu-3" },
    update: {},
    create: {
      id: "menu-3",
      date: today,
      mealType: "LUNCH",
      recipeId: recipe2.id,
      kitchenId: kitchen1.id,
      userId: managerUser.id,
      servings: 200,
      ghanFactor: 2.0,
      status: "COMPLETED",
      actualCount: 190,
      notes: "Dal was well received",
    },
  })

  const menu4 = await prisma.menu.upsert({
    where: { id: "menu-4" },
    update: {},
    create: {
      id: "menu-4",
      date: tomorrow,
      mealType: "BREAKFAST",
      recipeId: recipe5.id,
      kitchenId: kitchen1.id,
      userId: managerUser.id,
      servings: 160,
      ghanFactor: 3.2,
      status: "PLANNED",
    },
  })

  const menu5 = await prisma.menu.upsert({
    where: { id: "menu-5" },
    update: {},
    create: {
      id: "menu-5",
      date: today,
      mealType: "DINNER",
      recipeId: recipe4.id,
      kitchenId: kitchen2.id,
      userId: staffUser.id,
      servings: 100,
      ghanFactor: 1.0,
      status: "COMPLETED",
      actualCount: 98,
      notes: "Fresh salad served",
    },
  })

  console.log("✅ Created 5 menu items")

  // Create reports
  console.log("Creating reports...")
  const report1 = await prisma.report.upsert({
    where: { id: "report-1" },
    update: {},
    create: {
      id: "report-1",
      date: today,
      kitchenId: kitchen1.id,
      userId: managerUser.id,
      visitorCount: 345,
      mealsCounted: 545,
      notes: "Successful day with high visitor turnout. All meals served on time.",
    },
  })

  const report2 = await prisma.report.upsert({
    where: { id: "report-2" },
    update: {},
    create: {
      id: "report-2",
      date: today,
      kitchenId: kitchen2.id,
      userId: staffUser.id,
      visitorCount: 98,
      mealsCounted: 98,
      notes: "Smooth operations with dinner service completed successfully.",
    },
  })

  console.log("✅ Created 2 reports")

  console.log("🎉 Database seeded successfully!")
  console.log("\n📊 Summary:")
  console.log("- 5 kitchens")
  console.log("- 4 users")
  console.log("- 5 recipes with ingredients")
  console.log("- 5 menu items")
  console.log("- 2 reports")

  console.log("\n🔑 Login credentials:")
  console.log("Admin: admin@kitchen.com / admin123")
  console.log("Manager: manager1@kitchen.com / password123")
  console.log("Chef: chef1@kitchen.com / password123")
  console.log("Staff: staff1@kitchen.com / password123")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
