const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create kitchens
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
        capacity: 500,
        isActive: true,
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-2" },
      update: {},
      create: {
        id: "kitchen-2",
        name: "Secondary Kitchen",
        description: "Backup kitchen for overflow and special events",
        location: "First Floor, Building B",
        capacity: 300,
        isActive: true,
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-3" },
      update: {},
      create: {
        id: "kitchen-3",
        name: "Catering Kitchen",
        description: "Specialized kitchen for external catering services",
        location: "Ground Floor, Building C",
        capacity: 200,
        isActive: true,
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-4" },
      update: {},
      create: {
        id: "kitchen-4",
        name: "Training Kitchen",
        description: "Kitchen facility for staff training and development",
        location: "Second Floor, Building A",
        capacity: 100,
        isActive: true,
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen-5" },
      update: {},
      create: {
        id: "kitchen-5",
        name: "Emergency Kitchen",
        description: "Emergency backup kitchen facility",
        location: "Basement, Building A",
        capacity: 150,
        isActive: false,
      },
    }),
  ])

  // Create users
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
        isActive: true,
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
        kitchenId: "kitchen-1",
        isActive: true,
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
        kitchenId: "kitchen-1",
        isActive: true,
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
        kitchenId: "kitchen-2",
        isActive: true,
      },
    }),
  ])

  // Create recipes with ingredients
  console.log("Creating recipes...")
  const recipes = await Promise.all([
    prisma.recipe.upsert({
      where: { id: "recipe-1" },
      update: {},
      create: {
        id: "recipe-1",
        name: "Vegetable Curry",
        description: "Traditional mixed vegetable curry with spices",
        servings: 100,
        prepTime: 30,
        cookTime: 45,
        difficulty: "MEDIUM",
        category: "MAIN_COURSE",
        instructions: "Heat oil, add spices, cook vegetables, simmer with sauce",
        userId: "user-3",
        ingredients: {
          create: [
            {
              name: "Mixed Vegetables",
              quantity: 5000,
              unit: "GRAMS",
              costPerUnit: 0.02,
            },
            {
              name: "Onions",
              quantity: 1000,
              unit: "GRAMS",
              costPerUnit: 0.025,
            },
            {
              name: "Tomatoes",
              quantity: 800,
              unit: "GRAMS",
              costPerUnit: 0.03,
            },
            {
              name: "Spices",
              quantity: 200,
              unit: "GRAMS",
              costPerUnit: 0.15,
            },
            {
              name: "Oil",
              quantity: 300,
              unit: "ML",
              costPerUnit: 0.08,
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
        name: "Dal Tadka",
        description: "Yellow lentils with tempering",
        servings: 100,
        prepTime: 15,
        cookTime: 30,
        difficulty: "EASY",
        category: "MAIN_COURSE",
        instructions: "Boil lentils, prepare tempering, mix and serve",
        userId: "user-3",
        ingredients: {
          create: [
            {
              name: "Yellow Lentils",
              quantity: 2000,
              unit: "GRAMS",
              costPerUnit: 0.06,
            },
            {
              name: "Onions",
              quantity: 500,
              unit: "GRAMS",
              costPerUnit: 0.025,
            },
            {
              name: "Tomatoes",
              quantity: 400,
              unit: "GRAMS",
              costPerUnit: 0.03,
            },
            {
              name: "Spices",
              quantity: 100,
              unit: "GRAMS",
              costPerUnit: 0.15,
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
        name: "Jeera Rice",
        description: "Cumin flavored basmati rice",
        servings: 100,
        prepTime: 10,
        cookTime: 20,
        difficulty: "EASY",
        category: "SIDE_DISH",
        instructions: "Wash rice, heat oil, add cumin, cook rice",
        userId: "user-3",
        ingredients: {
          create: [
            {
              name: "Basmati Rice",
              quantity: 3000,
              unit: "GRAMS",
              costPerUnit: 0.08,
            },
            {
              name: "Cumin Seeds",
              quantity: 50,
              unit: "GRAMS",
              costPerUnit: 0.2,
            },
            {
              name: "Oil",
              quantity: 200,
              unit: "ML",
              costPerUnit: 0.08,
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
        name: "Mixed Salad",
        description: "Fresh mixed vegetable salad",
        servings: 100,
        prepTime: 20,
        cookTime: 0,
        difficulty: "EASY",
        category: "SALAD",
        instructions: "Chop vegetables, mix with dressing, serve fresh",
        userId: "user-3",
        ingredients: {
          create: [
            {
              name: "Cucumber",
              quantity: 1500,
              unit: "GRAMS",
              costPerUnit: 0.02,
            },
            {
              name: "Tomatoes",
              quantity: 1000,
              unit: "GRAMS",
              costPerUnit: 0.03,
            },
            {
              name: "Onions",
              quantity: 500,
              unit: "GRAMS",
              costPerUnit: 0.025,
            },
            {
              name: "Lemon",
              quantity: 200,
              unit: "GRAMS",
              costPerUnit: 0.05,
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
        name: "Masala Chai",
        description: "Spiced Indian tea",
        servings: 50,
        prepTime: 5,
        cookTime: 10,
        difficulty: "EASY",
        category: "BEVERAGE",
        instructions: "Boil water, add tea and spices, add milk, serve hot",
        userId: "user-3",
        ingredients: {
          create: [
            {
              name: "Tea Leaves",
              quantity: 200,
              unit: "GRAMS",
              costPerUnit: 0.3,
            },
            {
              name: "Milk",
              quantity: 2000,
              unit: "ML",
              costPerUnit: 0.05,
            },
            {
              name: "Sugar",
              quantity: 500,
              unit: "GRAMS",
              costPerUnit: 0.04,
            },
            {
              name: "Spices",
              quantity: 50,
              unit: "GRAMS",
              costPerUnit: 0.15,
            },
          ],
        },
      },
    }),
  ])

  // Create daily menus
  console.log("Creating daily menus...")
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const menus = await Promise.all([
    prisma.dailyMenu.upsert({
      where: {
        kitchenId_menuDate_mealType_recipeId: {
          kitchenId: "kitchen-1",
          menuDate: today,
          mealType: "BREAKFAST",
          recipeId: "recipe-5",
        },
      },
      update: {},
      create: {
        kitchenId: "kitchen-1",
        menuDate: today,
        mealType: "BREAKFAST",
        recipeId: "recipe-5",
        plannedServings: 150,
        actualServings: 145,
        ghanMultiplier: 3.0,
        status: "COMPLETED",
        createdBy: "user-2",
      },
    }),
    prisma.dailyMenu.upsert({
      where: {
        kitchenId_menuDate_mealType_recipeId: {
          kitchenId: "kitchen-1",
          menuDate: today,
          mealType: "LUNCH",
          recipeId: "recipe-1",
        },
      },
      update: {},
      create: {
        kitchenId: "kitchen-1",
        menuDate: today,
        mealType: "LUNCH",
        recipeId: "recipe-1",
        plannedServings: 200,
        actualServings: 195,
        ghanMultiplier: 2.0,
        status: "COMPLETED",
        createdBy: "user-2",
      },
    }),
    prisma.dailyMenu.upsert({
      where: {
        kitchenId_menuDate_mealType_recipeId: {
          kitchenId: "kitchen-1",
          menuDate: today,
          mealType: "LUNCH",
          recipeId: "recipe-2",
        },
      },
      update: {},
      create: {
        kitchenId: "kitchen-1",
        menuDate: today,
        mealType: "LUNCH",
        recipeId: "recipe-2",
        plannedServings: 200,
        actualServings: 190,
        ghanMultiplier: 2.0,
        status: "COMPLETED",
        createdBy: "user-2",
      },
    }),
    prisma.dailyMenu.upsert({
      where: {
        kitchenId_menuDate_mealType_recipeId: {
          kitchenId: "kitchen-1",
          menuDate: tomorrow,
          mealType: "BREAKFAST",
          recipeId: "recipe-5",
        },
      },
      update: {},
      create: {
        kitchenId: "kitchen-1",
        menuDate: tomorrow,
        mealType: "BREAKFAST",
        recipeId: "recipe-5",
        plannedServings: 160,
        ghanMultiplier: 3.2,
        status: "PLANNED",
        createdBy: "user-2",
      },
    }),
    prisma.dailyMenu.upsert({
      where: {
        kitchenId_menuDate_mealType_recipeId: {
          kitchenId: "kitchen-2",
          menuDate: today,
          mealType: "DINNER",
          recipeId: "recipe-4",
        },
      },
      update: {},
      create: {
        kitchenId: "kitchen-2",
        menuDate: today,
        mealType: "DINNER",
        recipeId: "recipe-4",
        plannedServings: 100,
        actualServings: 98,
        ghanMultiplier: 1.0,
        status: "COMPLETED",
        createdBy: "user-4",
      },
    }),
  ])

  // Create reports
  console.log("Creating reports...")
  const reports = await Promise.all([
    prisma.report.upsert({
      where: { id: "report-1" },
      update: {},
      create: {
        id: "report-1",
        title: "Daily Kitchen Report - Main Kitchen",
        type: "DAILY",
        date: today,
        kitchenId: "kitchen-1",
        totalVisitors: 345,
        totalMeals: 545,
        totalCost: 12500.5,
        notes: "Successful day with high visitor turnout. All meals served on time.",
        createdBy: "user-2",
      },
    }),
    prisma.report.upsert({
      where: { id: "report-2" },
      update: {},
      create: {
        id: "report-2",
        title: "Daily Kitchen Report - Secondary Kitchen",
        type: "DAILY",
        date: today,
        kitchenId: "kitchen-2",
        totalVisitors: 98,
        totalMeals: 98,
        totalCost: 2800.25,
        notes: "Smooth operations with dinner service completed successfully.",
        createdBy: "user-4",
      },
    }),
  ])

  console.log("✅ Database seeded successfully!")
  console.log(`Created:`)
  console.log(`- ${kitchens.length} kitchens`)
  console.log(`- ${users.length} users`)
  console.log(`- ${recipes.length} recipes`)
  console.log(`- ${menus.length} menu items`)
  console.log(`- ${reports.length} reports`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
