import { testConnection, createTables, seedDatabase } from "../lib/db-setup"

async function setupDatabase() {
  console.log("🚀 Setting up Kitchen Management Database...")

  try {
    // Test connection
    console.log("🔌 Testing database connection...")
    const connected = await testConnection()
    if (!connected) {
      throw new Error("Database connection failed")
    }

    // Create tables
    await createTables()

    // Seed database
    await seedDatabase()

    console.log("✅ Database setup complete!")
    console.log("")
    console.log("🎉 You can now start the development server:")
    console.log("npm run dev")
    console.log("")
    console.log("📧 Login credentials:")
    console.log("Email: admin@kitchen.com")
    console.log("Password: admin123")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    process.exit(1)
  }
}

setupDatabase()
