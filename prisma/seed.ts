import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create kitchens first
  const kitchens = await Promise.all([
    prisma.kitchen.upsert({
      where: { id: "kitchen_1" },
      update: {},
      create: {
        id: "kitchen_1",
        name: "Thakorji",
        location: "Main Building",
        description: "Main temple kitchen serving traditional meals",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen_2" },
      update: {},
      create: {
        id: "kitchen_2",
        name: "Premvati",
        location: "East Wing",
        description: "East wing kitchen for special occasions",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen_3" },
      update: {},
      create: {
        id: "kitchen_3",
        name: "Aarsh",
        location: "West Wing",
        description: "West wing kitchen for daily meals",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen_4" },
      update: {},
      create: {
        id: "kitchen_4",
        name: "Mandir",
        location: "Temple Complex",
        description: "Temple kitchen for prasad preparation",
      },
    }),
    prisma.kitchen.upsert({
      where: { id: "kitchen_5" },
      update: {},
      create: {
        id: "kitchen_5",
        name: "Prasad",
        location: "Central Kitchen",
        description: "Central kitchen for large scale cooking",
      },
    }),
  ])

  console.log("✅ Created kitchens")

  // Create users with different roles
  const hashedPassword = await bcrypt.hash("admin123", 10)
  const hashedPasswordStaff = await bcrypt.hash("password123", 10)

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kitchen.com" },
    update: {},
    create: {
      email: "admin@kitchen.com",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
      kitchenId: "kitchen_1",
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: "manager1@kitchen.com" },
    update: {},
    create: {
      email: "manager1@kitchen.com",
      name: "Kitchen Manager",
      password: hashedPasswordStaff,
      role: "MANAGER",
      kitchenId: "kitchen_1",
    },
  })

  const chefUser = await prisma.user.upsert({
    where: { email: "chef1@kitchen.com" },
    update: {},
    create: {
      email: "chef1@kitchen.com",
      name: "Head Chef",
      password: hashedPasswordStaff,
      role: "CHEF",
      kitchenId: "kitchen_2",
    },
  })

  const staffUser = await prisma.user.upsert({
    where: { email: "staff1@kitchen.com" },
    update: {},
    create: {
      email: "staff1@kitchen.com",
      name: "Kitchen Staff",
      password: hashedPasswordStaff,
      role: "STAFF",
      kitchenId: "kitchen_3",
    },
  })

  console.log("✅ Created users")

  // Create sample recipes with ingredients
  const recipes = await Promise.all([
    prisma.recipe.upsert({
      where: { id: "recipe_1" },
      update: {},
      create: {
        id: "recipe_1",
        name: "Idli Sambhar",
        description: "Traditional South Indian breakfast with steamed rice cakes and lentil curry",
        instructions:
          "1. Soak rice and urad dal overnight\n2. Grind to smooth batter\n3. Ferment for 8-12 hours\n4. Steam in idli plates\n5. Serve with sambhar",
        prepTime: 30,
        cookTime: 45,
        servings: 100,
        category: "South Indian",
        userId: adminUser.id,
        ingredients: {
          create: [
            {
              name: "Rice",
              quantity: 2.5,
              unit: "kg",
              costPerUnit: 30.0,
            },
            {
              name: "Urad Dal",
              quantity: 0.5,
              unit: "kg",
              costPerUnit: 120.0,
            },
            {
              name: "Toor Dal",
              quantity: 0.3,
              unit: "kg",
              costPerUnit: 100.0,
            },
          ],
        },
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe_2" },
      update: {},
      create: {
        id: "recipe_2",
        name: "Poha",
        description: "Flattened rice with vegetables and spices",
        instructions:
          "1. Wash and drain poha\n2. Heat oil, add mustard seeds\n3. Add onions, potatoes\n4. Add poha and mix\n5. Garnish with coriander",
        prepTime: 15,
        cookTime: 20,
        servings: 80,
        category: "Maharashtrian",
        userId: chefUser.id,
        ingredients: {
          create: [
            {
              name: "Poha",
              quantity: 1.0,
              unit: "kg",
              costPerUnit: 40.0,
            },
            {
              name: "Onion",
              quantity: 0.5,
              unit: "kg",
              costPerUnit: 25.0,
            },
            {
              name: "Potato",
              quantity: 0.3,
              unit: "kg",
              costPerUnit: 20.0,
            },
          ],
        },
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe_3" },
      update: {},
      create: {
        id: "recipe_3",
        name: "Dal Rice",
        description: "Simple and nutritious lentils with rice",
        instructions:
          "1. Cook rice separately\n2. Boil dal with turmeric\n3. Temper with cumin, mustard seeds\n4. Add vegetables if desired\n5. Serve hot with rice",
        prepTime: 20,
        cookTime: 40,
        servings: 120,
        category: "North Indian",
        userId: managerUser.id,
        ingredients: {
          create: [
            {
              name: "Rice",
              quantity: 3.0,
              unit: "kg",
              costPerUnit: 30.0,
            },
            {
              name: "Toor Dal",
              quantity: 1.0,
              unit: "kg",
              costPerUnit: 100.0,
            },
            {
              name: "Turmeric",
              quantity: 0.05,
              unit: "kg",
              costPerUnit: 200.0,
            },
          ],
        },
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe_4" },
      update: {},
      create: {
        id: "recipe_4",
        name: "Chapati",
        description: "Fresh whole wheat flatbread",
        instructions:
          "1. Mix flour with water and salt\n2. Knead into soft dough\n3. Rest for 30 minutes\n4. Roll into circles\n5. Cook on hot tawa",
        prepTime: 45,
        cookTime: 30,
        servings: 150,
        category: "Bread",
        userId: chefUser.id,
        ingredients: {
          create: [
            {
              name: "Wheat Flour",
              quantity: 2.0,
              unit: "kg",
              costPerUnit: 35.0,
            },
            {
              name: "Salt",
              quantity: 0.02,
              unit: "kg",
              costPerUnit: 20.0,
            },
            {
              name: "Oil",
              quantity: 0.1,
              unit: "liter",
              costPerUnit: 120.0,
            },
          ],
        },
      },
    }),
    prisma.recipe.upsert({
      where: { id: "recipe_5" },
      update: {},
      create: {
        id: "recipe_5",
        name: "Mixed Vegetable Curry",
        description: "Seasonal vegetables cooked in aromatic spices",
        instructions:
          "1. Heat oil in pan\n2. Add cumin seeds and onions\n3. Add vegetables and spices\n4. Cook until tender\n5. Garnish with coriander",
        prepTime: 25,
        cookTime: 35,
        servings: 100,
        category: "Vegetarian",
        userId: staffUser.id,
        ingredients: {
          create: [
            {
              name: "Mixed Vegetables",
              quantity: 2.0,
              unit: "kg",
              costPerUnit: 40.0,
            },
            {
              name: "Onion",
              quantity: 0.5,
              unit: "kg",
              costPerUnit: 25.0,
            },
            {
              name: "Spices",
              quantity: 0.1,
              unit: "kg",
              costPerUnit: 300.0,
            },
          ],
        },
      },
    }),
  ])

  console.log("✅ Created sample recipes")

  // Create sample menus for today and tomorrow
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sampleMenus = await Promise.all([
    // Today's menus
    prisma.menu.upsert({
      where: {
        id: "menu_1",
      },
      update: {},
      create: {
        id: "menu_1",
        date: today,
        mealType: "BREAKFAST",
        recipeId: "recipe_1",
        kitchenId: "kitchen_1",
        userId: adminUser.id,
        servings: 100,
        ghanFactor: 1.0,
        status: "PLANNED",
      },
    }),
    prisma.menu.upsert({
      where: {
        id: "menu_2",
      },
      update: {},
      create: {
        id: "menu_2",
        date: today,
        mealType: "LUNCH",
        recipeId: "recipe_3",
        kitchenId: "kitchen_1",
        userId: managerUser.id,
        servings: 120,
        ghanFactor: 1.2,
        status: "PLANNED",
      },
    }),
    prisma.menu.upsert({
      where: {
        id: "menu_3",
      },
      update: {},
      create: {
        id: "menu_3",
        date: today,
        mealType: "DINNER",
        recipeId: "recipe_5",
        kitchenId: "kitchen_2",
        userId: chefUser.id,
        servings: 90,
        ghanFactor: 1.1,
        status: "PLANNED",
      },
    }),
    // Tomorrow's menus
    prisma.menu.upsert({
      where: {
        id: "menu_4",
      },
      update: {},
      create: {
        id: "menu_4",
        date: tomorrow,
        mealType: "BREAKFAST",
        recipeId: "recipe_2",
        kitchenId: "kitchen_2",
        userId: chefUser.id,
        servings: 80,
        ghanFactor: 1.0,
        status: "PLANNED",
      },
    }),
    prisma.menu.upsert({
      where: {
        id: "menu_5",
      },
      update: {},
      create: {
        id: "menu_5",
        date: tomorrow,
        mealType: "LUNCH",
        recipeId: "recipe_4",
        kitchenId: "kitchen_3",
        userId: staffUser.id,
        servings: 150,
        ghanFactor: 1.5,
        status: "PLANNED",
      },
    }),
  ])

  console.log("✅ Created sample menus")

  // Create sample reports
  const sampleReports = await Promise.all([
    prisma.report.upsert({
      where: { id: "report_1" },
      update: {},
      create: {
        id: "report_1",
        date: today,
        kitchenId: "kitchen_1",
        userId: adminUser.id,
        visitorCount: 250,
        mealsCounted: 220,
        notes: "Good turnout for breakfast and lunch. Ran out of sambhar by 2 PM.",
      },
    }),
    prisma.report.upsert({
      where: { id: "report_2" },
      update: {},
      create: {
        id: "report_2",
        date: today,
        kitchenId: "kitchen_2",
        userId: chefUser.id,
        visitorCount: 180,
        mealsCounted: 170,
        notes: "Smooth operations. All meals served on time.",
      },
    }),
  ])

  console.log("✅ Created sample reports")

  console.log("🎉 Database seeded successfully!")
  console.log("\n📧 Login credentials:")
  console.log("Admin: admin@kitchen.com / admin123")
  console.log("Manager: manager1@kitchen.com / password123")
  console.log("Chef: chef1@kitchen.com / password123")
  console.log("Staff: staff1@kitchen.com / password123")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
