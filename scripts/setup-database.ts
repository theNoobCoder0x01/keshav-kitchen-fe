import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function setupDatabase() {
  console.log("🚀 Setting up Kitchen Management Database with Prisma...")

  try {
    // Test connection
    console.log("🔌 Testing database connection...")
    await prisma.$connect()
    console.log("✅ Database connected successfully")

    // Check if data already exists
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      console.log("📊 Database already has data, skipping seed...")
      return
    }

    console.log("🌱 Seeding database...")

    // Create kitchens
    const kitchens = await Promise.all([
      prisma.kitchen.upsert({
        where: { id: "kitchen_1" },
        update: {},
        create: {
          id: "kitchen_1",
          name: "Thakorji Kitchen",
          location: "Main Building",
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_2" },
        update: {},
        create: {
          id: "kitchen_2",
          name: "Premvati Kitchen",
          location: "East Wing",
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_3" },
        update: {},
        create: {
          id: "kitchen_3",
          name: "Aarsh Kitchen",
          location: "West Wing",
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_4" },
        update: {},
        create: {
          id: "kitchen_4",
          name: "Mandir Kitchen",
          location: "Temple Complex",
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_5" },
        update: {},
        create: {
          id: "kitchen_5",
          name: "Prasad Kitchen",
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

    // Create sample users for each kitchen
    const sampleUsers = [
      { email: "chef1@kitchen.com", name: "Chef Ramesh", role: "CHEF", kitchenId: "kitchen_1" },
      { email: "chef2@kitchen.com", name: "Chef Priya", role: "CHEF", kitchenId: "kitchen_2" },
      { email: "manager1@kitchen.com", name: "Manager Suresh", role: "MANAGER", kitchenId: "kitchen_3" },
      { email: "staff1@kitchen.com", name: "Staff Meera", role: "STAFF", kitchenId: "kitchen_4" },
    ]

    for (const user of sampleUsers) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          ...user,
          password: await bcrypt.hash("password123", 10),
        },
      })
    }

    console.log("✅ Created sample users")

    // Create sample recipes
    const recipes = await Promise.all([
      prisma.recipe.upsert({
        where: { id: "recipe_1" },
        update: {},
        create: {
          id: "recipe_1",
          name: "Idli Sambhar",
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
      prisma.recipe.upsert({
        where: { id: "recipe_4" },
        update: {},
        create: {
          id: "recipe_4",
          name: "Roti Sabzi",
          type: "DINNER",
          description: "Fresh rotis with seasonal vegetable curry",
          instructions:
            "1. Knead wheat flour dough\n2. Prepare vegetable curry\n3. Roll and cook rotis on tawa\n4. Serve hot with sabzi",
          prepTime: 25,
          cookTime: 35,
          servings: 100,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Wheat Flour",
                quantity: 2.0,
                unit: "kg",
                costPerUnit: 25.0,
              },
              {
                ingredientName: "Mixed Vegetables",
                quantity: 1.5,
                unit: "kg",
                costPerUnit: 40.0,
              },
              {
                ingredientName: "Oil",
                quantity: 0.2,
                unit: "liter",
                costPerUnit: 100.0,
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
          name: "Khichdi",
          type: "DINNER",
          description: "Comfort food made with rice and lentils",
          instructions:
            "1. Wash rice and dal together\n2. Add turmeric and salt\n3. Cook in pressure cooker\n4. Temper with ghee and cumin\n5. Serve hot",
          prepTime: 10,
          cookTime: 25,
          servings: 90,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Rice",
                quantity: 1.5,
                unit: "kg",
                costPerUnit: 30.0,
              },
              {
                ingredientName: "Moong Dal",
                quantity: 0.5,
                unit: "kg",
                costPerUnit: 80.0,
              },
              {
                ingredientName: "Ghee",
                quantity: 0.1,
                unit: "kg",
                costPerUnit: 400.0,
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
      prisma.dailyMenu.upsert({
        where: {
          kitchenId_menuDate_mealType_recipeId: {
            kitchenId: "kitchen_2",
            menuDate: today,
            mealType: "BREAKFAST",
            recipeId: "recipe_2",
          },
        },
        update: {},
        create: {
          kitchenId: "kitchen_2",
          menuDate: today,
          mealType: "BREAKFAST",
          recipeId: "recipe_2",
          plannedServings: 80,
          ghanMultiplier: 1.0,
          createdBy: adminUser.id,
        },
      }),
      prisma.dailyMenu.upsert({
        where: {
          kitchenId_menuDate_mealType_recipeId: {
            kitchenId: "kitchen_2",
            menuDate: today,
            mealType: "DINNER",
            recipeId: "recipe_4",
          },
        },
        update: {},
        create: {
          kitchenId: "kitchen_2",
          menuDate: today,
          mealType: "DINNER",
          recipeId: "recipe_4",
          plannedServings: 100,
          ghanMultiplier: 1.1,
          createdBy: adminUser.id,
        },
      }),
    ])

    console.log("✅ Created sample daily menus")

    console.log("🎉 Database seeded successfully!")
    console.log("\n📧 Login credentials:")
    console.log("Email: admin@kitchen.com")
    console.log("Password: admin123")
    console.log("\nOther test accounts:")
    console.log("Chef: chef1@kitchen.com / password123")
    console.log("Manager: manager1@kitchen.com / password123")
    console.log("Staff: staff1@kitchen.com / password123")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log("✅ Setup completed!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Setup failed:", error)
      process.exit(1)
    })
}

export { setupDatabase }
