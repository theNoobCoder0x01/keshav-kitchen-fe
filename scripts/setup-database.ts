import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Setting up database...")

  try {
    // Create kitchens
    console.log("Creating kitchens...")
    const kitchens = await Promise.all([
      prisma.kitchen.upsert({
        where: { id: "kitchen_1" },
        update: {},
        create: {
          id: "kitchen_1",
          name: "Thakorji Kitchen",
          location: "Main Building",
          isActive: true,
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_2" },
        update: {},
        create: {
          id: "kitchen_2",
          name: "Premvati Kitchen",
          location: "East Wing",
          isActive: true,
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_3" },
        update: {},
        create: {
          id: "kitchen_3",
          name: "Aarsh Kitchen",
          location: "West Wing",
          isActive: true,
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_4" },
        update: {},
        create: {
          id: "kitchen_4",
          name: "Mandir Kitchen",
          location: "Temple Complex",
          isActive: true,
        },
      }),
      prisma.kitchen.upsert({
        where: { id: "kitchen_5" },
        update: {},
        create: {
          id: "kitchen_5",
          name: "Prasad Kitchen",
          location: "Central Kitchen",
          isActive: true,
        },
      }),
    ])
    console.log("✅ Created kitchens")

    // Create users with different roles
    console.log("Creating users...")
    const hashedPassword = await bcrypt.hash("admin123", 10)
    const chefPassword = await bcrypt.hash("password123", 10)

    const users = await Promise.all([
      // Admin user
      prisma.user.upsert({
        where: { email: "admin@kitchen.com" },
        update: {},
        create: {
          email: "admin@kitchen.com",
          name: "Admin User",
          password: hashedPassword,
          role: "ADMIN",
          kitchenId: "kitchen_1",
        },
      }),
      // Manager users
      prisma.user.upsert({
        where: { email: "manager1@kitchen.com" },
        update: {},
        create: {
          email: "manager1@kitchen.com",
          name: "Manager One",
          password: chefPassword,
          role: "MANAGER",
          kitchenId: "kitchen_1",
        },
      }),
      prisma.user.upsert({
        where: { email: "manager2@kitchen.com" },
        update: {},
        create: {
          email: "manager2@kitchen.com",
          name: "Manager Two",
          password: chefPassword,
          role: "MANAGER",
          kitchenId: "kitchen_2",
        },
      }),
      // Chef users
      prisma.user.upsert({
        where: { email: "chef1@kitchen.com" },
        update: {},
        create: {
          email: "chef1@kitchen.com",
          name: "Chef One",
          password: chefPassword,
          role: "CHEF",
          kitchenId: "kitchen_1",
        },
      }),
      prisma.user.upsert({
        where: { email: "chef2@kitchen.com" },
        update: {},
        create: {
          email: "chef2@kitchen.com",
          name: "Chef Two",
          password: chefPassword,
          role: "CHEF",
          kitchenId: "kitchen_2",
        },
      }),
      // Staff users
      prisma.user.upsert({
        where: { email: "staff1@kitchen.com" },
        update: {},
        create: {
          email: "staff1@kitchen.com",
          name: "Staff One",
          password: chefPassword,
          role: "STAFF",
          kitchenId: "kitchen_1",
        },
      }),
      prisma.user.upsert({
        where: { email: "staff2@kitchen.com" },
        update: {},
        create: {
          email: "staff2@kitchen.com",
          name: "Staff Two",
          password: chefPassword,
          role: "STAFF",
          kitchenId: "kitchen_2",
        },
      }),
    ])
    console.log("✅ Created users")

    const adminUser = users[0]

    // Create sample recipes
    console.log("Creating recipes...")
    const recipes = await Promise.all([
      prisma.recipe.upsert({
        where: { id: "recipe_1" },
        update: {},
        create: {
          id: "recipe_1",
          name: "Idli Sambhar",
          type: "BREAKFAST",
          description: "Traditional South Indian breakfast with steamed rice cakes and lentil curry",
          instructions: `1. Soak rice and urad dal overnight
2. Grind to smooth batter
3. Ferment for 8-12 hours
4. Steam in idli plates for 10-12 minutes
5. Prepare sambhar with toor dal and vegetables
6. Serve hot with coconut chutney`,
          prepTime: 30,
          cookTime: 45,
          servings: 100,
          costPerServing: 15.5,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Rice",
                quantity: 2.5,
                unit: "kg",
                costPerUnit: 30.0,
                notes: "Parboiled rice preferred",
              },
              {
                ingredientName: "Urad Dal",
                quantity: 0.5,
                unit: "kg",
                costPerUnit: 120.0,
                notes: "Black gram dal",
              },
              {
                ingredientName: "Toor Dal",
                quantity: 0.3,
                unit: "kg",
                costPerUnit: 100.0,
                notes: "For sambhar",
              },
              {
                ingredientName: "Mixed Vegetables",
                quantity: 1.0,
                unit: "kg",
                costPerUnit: 40.0,
                notes: "Drumstick, okra, tomato",
              },
              {
                ingredientName: "Coconut",
                quantity: 0.2,
                unit: "kg",
                costPerUnit: 50.0,
                notes: "For chutney",
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
          instructions: `1. Wash and drain poha gently
2. Heat oil in large pan, add mustard seeds
3. Add curry leaves, onions, and green chilies
4. Add potatoes and cook until tender
5. Add poha and mix gently
6. Season with turmeric, salt, and lemon juice
7. Garnish with coriander and serve`,
          prepTime: 15,
          cookTime: 20,
          servings: 80,
          costPerServing: 12.25,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Poha (Flattened Rice)",
                quantity: 1.0,
                unit: "kg",
                costPerUnit: 40.0,
                notes: "Medium thickness",
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
              {
                ingredientName: "Green Chilies",
                quantity: 0.05,
                unit: "kg",
                costPerUnit: 80.0,
              },
              {
                ingredientName: "Mustard Seeds",
                quantity: 0.02,
                unit: "kg",
                costPerUnit: 150.0,
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
          instructions: `1. Cook rice separately until fluffy
2. Boil toor dal with turmeric and salt
3. Prepare tempering with cumin, mustard seeds
4. Add onions, tomatoes to tempering
5. Mix cooked dal with tempering
6. Add vegetables if desired
7. Serve hot with rice and ghee`,
          prepTime: 20,
          cookTime: 40,
          servings: 120,
          costPerServing: 18.75,
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
                ingredientName: "Turmeric Powder",
                quantity: 0.05,
                unit: "kg",
                costPerUnit: 200.0,
              },
              {
                ingredientName: "Onion",
                quantity: 0.5,
                unit: "kg",
                costPerUnit: 25.0,
              },
              {
                ingredientName: "Tomato",
                quantity: 0.5,
                unit: "kg",
                costPerUnit: 30.0,
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
          name: "Vegetable Curry",
          type: "LUNCH",
          description: "Mixed vegetable curry with aromatic spices",
          instructions: `1. Heat oil in large pot
2. Add whole spices and let them splutter
3. Add onions and cook until golden
4. Add ginger-garlic paste and cook
5. Add tomatoes and spices
6. Add mixed vegetables and water
7. Cook until vegetables are tender
8. Garnish with coriander`,
          prepTime: 25,
          cookTime: 35,
          servings: 100,
          costPerServing: 22.5,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Mixed Vegetables",
                quantity: 2.0,
                unit: "kg",
                costPerUnit: 40.0,
                notes: "Potato, cauliflower, peas, carrot",
              },
              {
                ingredientName: "Onion",
                quantity: 0.5,
                unit: "kg",
                costPerUnit: 25.0,
              },
              {
                ingredientName: "Tomato",
                quantity: 0.5,
                unit: "kg",
                costPerUnit: 30.0,
              },
              {
                ingredientName: "Ginger-Garlic Paste",
                quantity: 0.1,
                unit: "kg",
                costPerUnit: 120.0,
              },
              {
                ingredientName: "Spice Mix",
                quantity: 0.1,
                unit: "kg",
                costPerUnit: 300.0,
                notes: "Cumin, coriander, garam masala",
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
          name: "Chapati",
          type: "DINNER",
          description: "Fresh whole wheat flatbread",
          instructions: `1. Mix wheat flour with water and salt
2. Knead into smooth dough
3. Rest dough for 20 minutes
4. Divide into small portions
5. Roll each portion into thin circles
6. Cook on hot tawa until puffed
7. Serve hot with curry`,
          prepTime: 30,
          cookTime: 60,
          servings: 150,
          costPerServing: 8.5,
          createdBy: adminUser.id,
          ingredients: {
            create: [
              {
                ingredientName: "Wheat Flour",
                quantity: 2.0,
                unit: "kg",
                costPerUnit: 35.0,
              },
              {
                ingredientName: "Salt",
                quantity: 0.02,
                unit: "kg",
                costPerUnit: 20.0,
              },
              {
                ingredientName: "Oil",
                quantity: 0.1,
                unit: "liter",
                costPerUnit: 120.0,
              },
            ],
          },
        },
      }),
    ])
    console.log("✅ Created recipes")

    // Create sample daily menus for today and tomorrow
    console.log("Creating daily menus...")
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const menus = await Promise.all([
      // Today's menus
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
          actualServings: 95,
          ghanMultiplier: 1.0,
          status: "COMPLETED",
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
          actualServings: 118,
          ghanMultiplier: 1.2,
          status: "COMPLETED",
          createdBy: adminUser.id,
        },
      }),
      prisma.dailyMenu.upsert({
        where: {
          kitchenId_menuDate_mealType_recipeId: {
            kitchenId: "kitchen_1",
            menuDate: today,
            mealType: "DINNER",
            recipeId: "recipe_5",
          },
        },
        update: {},
        create: {
          kitchenId: "kitchen_1",
          menuDate: today,
          mealType: "DINNER",
          recipeId: "recipe_5",
          plannedServings: 150,
          ghanMultiplier: 1.0,
          status: "IN_PROGRESS",
          createdBy: adminUser.id,
        },
      }),
      // Tomorrow's menus
      prisma.dailyMenu.upsert({
        where: {
          kitchenId_menuDate_mealType_recipeId: {
            kitchenId: "kitchen_1",
            menuDate: tomorrow,
            mealType: "BREAKFAST",
            recipeId: "recipe_2",
          },
        },
        update: {},
        create: {
          kitchenId: "kitchen_1",
          menuDate: tomorrow,
          mealType: "BREAKFAST",
          recipeId: "recipe_2",
          plannedServings: 80,
          ghanMultiplier: 1.0,
          status: "PLANNED",
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
          plannedServings: 60,
          actualServings: 58,
          ghanMultiplier: 0.8,
          status: "COMPLETED",
          createdBy: adminUser.id,
        },
      }),
    ])
    console.log("✅ Created daily menus")

    // Create sample daily reports
    console.log("Creating daily reports...")
    const reports = await Promise.all([
      prisma.dailyReport.upsert({
        where: {
          kitchenId_reportDate: {
            kitchenId: "kitchen_1",
            reportDate: today,
          },
        },
        update: {},
        create: {
          kitchenId: "kitchen_1",
          reportDate: today,
          totalVisitors: 200,
          breakfastCount: 95,
          lunchCount: 118,
          dinnerCount: 0, // Not served yet
          totalCost: 3500.75,
          notes: "Good day, slightly less breakfast attendance",
        },
      }),
      prisma.dailyReport.upsert({
        where: {
          kitchenId_reportDate: {
            kitchenId: "kitchen_2",
            reportDate: today,
          },
        },
        update: {},
        create: {
          kitchenId: "kitchen_2",
          reportDate: today,
          totalVisitors: 150,
          breakfastCount: 58,
          lunchCount: 85,
          dinnerCount: 92,
          totalCost: 2800.5,
          notes: "Normal operations, all meals served",
        },
      }),
    ])
    console.log("✅ Created daily reports")

    console.log("\n🎉 Database setup completed successfully!")
    console.log("\n📧 Login credentials:")
    console.log("Admin: admin@kitchen.com / admin123")
    console.log("Manager: manager1@kitchen.com / password123")
    console.log("Chef: chef1@kitchen.com / password123")
    console.log("Staff: staff1@kitchen.com / password123")
    console.log("\n🏢 Kitchens created:")
    kitchens.forEach((kitchen) => {
      console.log(`- ${kitchen.name} (${kitchen.location})`)
    })
    console.log("\n🍽️ Sample data created:")
    console.log(`- ${recipes.length} recipes with ingredients`)
    console.log(`- ${menus.length} daily menu entries`)
    console.log(`- ${reports.length} daily reports`)
    console.log(`- ${users.length} users with different roles`)
  } catch (error) {
    console.error("❌ Error setting up database:", error)
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
