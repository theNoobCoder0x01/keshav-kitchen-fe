const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  console.log(`📊 Connected to database: ${process.env.DATABASE_URL.split("@")[1]?.split("/")[0] || "Unknown"}`)

  try {
    // Create kitchens
    const kitchens = await Promise.all([
      prisma.kitchen.upsert({
        where: { id: "kitchen_1" },
        update: {},
        create: {
          id: "kitchen_1",
          name: "Thakorji",
          location: "Main Building",
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_2" },
        update: {},
        create: {
          id: "kitchen_2",
          name: "Premvati",
          location: "East Wing",
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_3" },
        update: {},
        create: {
          id: "kitchen_3",
          name: "Aarsh",
          location: "West Wing",
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_4" },
        update: {},
        create: {
          id: "kitchen_4",
          name: "Mandir",
          location: "Temple Complex",
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_5" },
        update: {},
        create: {
          id: "kitchen_5",
          name: "Prasad",
          location: "Central Kitchen",
        },
      }),
    ])

    console.log("✅ Created kitchens")

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10)

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

    console.log("✅ Created admin user")

    // Create sample recipes
    const recipes = await Promise.all([
      prisma.recipe.upsert({
        where: { id: "recipe_1" },
        update: {},
        create: {
          id: "recipe_1",
          name: "Idali Sambhar",
          type: "BREAKFAST",
          description: "Traditional South Indian breakfast with steamed rice cakes and lentil curry",
          instructions:
            "1. Soak rice and urad dal overnight\n2. Grind to smooth batter\n3. Ferment for 8-12 hours\n4. Steam in idli plates\n5. Serve with sambhar",
          prepTime: 30,
          cookTime: 45,
          servings: 100,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Rice",
                quantity: 2.5,
                unit: "kg",
                costPerUnit: 30.0,
              },
              {
                ingredientName: "Urad Dal",
                quantity: 0.5,
                unit: "kg",
                costPerUnit: 120.0,
              },
              {
                ingredientName: "Toor Dal",
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
          type: "BREAKFAST",
          description: "Flattened rice with vegetables and spices",
          instructions:
            "1. Wash and drain poha\n2. Heat oil, add mustard seeds\n3. Add onions, potatoes\n4. Add poha and mix\n5. Garnish with coriander",
          prepTime: 15,
          cookTime: 20,
          servings: 80,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Poha",
                quantity: 1.0,
                unit: "kg",
                costPerUnit: 40.0,
              },
              {
                ingredientName: "Onion",
                quantity: 0.5,
                unit: "kg",
                costPerUnit: 25.0,
              },
              {
                ingredientName: "Potato",
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
          type: "LUNCH",
          description: "Simple and nutritious lentils with rice",
          instructions:
            "1. Cook rice separately\n2. Boil dal with turmeric\n3. Temper with cumin, mustard seeds\n4. Add vegetables if desired\n5. Serve hot with rice",
          prepTime: 20,
          cookTime: 40,
          servings: 120,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Rice",
                quantity: 3.0,
                unit: "kg",
                costPerUnit: 30.0,
              },
              {
                ingredientName: "Toor Dal",
                quantity: 1.0,
                unit: "kg",
                costPerUnit: 100.0,
              },
              {
                ingredientName: "Turmeric",
                quantity: 0.05,
                unit: "kg",
                costPerUnit: 200.0,
              },
            ],
          },
        },
      }),
    ])

    console.log("✅ Created sample recipes")

    // Create sample daily menus for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sampleMenus = await Promise.all([
      prisma.dailyMenu.upsert({
        where: {
          kitchenId_menuDate_mealType_recipeId: {
            kitchenId: "kitchen_1",
            menuDate: today,
            mealType: "BREAKFAST",
            recipeId: "recipe_1",
          },
        },
        update: {},
        create: {
          kitchenId: "kitchen_1",
          menuDate: today,
          mealType: "BREAKFAST",
          recipeId: "recipe_1",
          plannedServings: 100,
          ghanMultiplier: 1.0,
          createdBy: adminUser.id,
        },
      }),
      prisma.dailyMenu.upsert({
        where: {
          kitchenId_menuDate_mealType_recipeId: {
            kitchenId: "kitchen_1",
            menuDate: today,
            mealType: "LUNCH",
            recipeId: "recipe_3",
          },
        },
        update: {},
        create: {
          kitchenId: "kitchen_1",
          menuDate: today,
          mealType: "LUNCH",
          recipeId: "recipe_3",
          plannedServings: 120,
          ghanMultiplier: 1.2,
          createdBy: adminUser.id,
        },
      }),
    ])

    console.log("✅ Created sample daily menus")

    console.log("🎉 Database seeded successfully!")
    console.log("\n📧 Login credentials:")
    console.log("Email: admin@kitchen.com")
    console.log("Password: admin123")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
