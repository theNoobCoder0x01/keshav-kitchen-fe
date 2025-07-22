import { sql } from "@/lib/db"

async function setupDatabase() {
  try {
    console.log("Setting up database tables...")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        email_verified TIMESTAMP,
        image TEXT,
        role VARCHAR(50) DEFAULT 'USER',
        kitchen_id VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create kitchens table
    await sql`
      CREATE TABLE IF NOT EXISTS kitchens (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipes table
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        instructions TEXT,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        cost_per_serving DECIMAL(10,2),
        image_url TEXT,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `

    // Create recipe_ingredients table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id VARCHAR(255) PRIMARY KEY,
        recipe_id VARCHAR(255) NOT NULL,
        ingredient_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        cost_per_unit DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      )
    `

    // Create daily_menus table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_menus (
        id VARCHAR(255) PRIMARY KEY,
        kitchen_id VARCHAR(255) NOT NULL,
        menu_date DATE NOT NULL,
        meal_type VARCHAR(50) NOT NULL,
        recipe_id VARCHAR(255) NOT NULL,
        planned_servings INTEGER NOT NULL,
        actual_servings INTEGER,
        ghan_multiplier DECIMAL(5,2) DEFAULT 1.0,
        status VARCHAR(50) DEFAULT 'PLANNED',
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(kitchen_id, menu_date, meal_type, recipe_id)
      )
    `

    // Create accounts table for NextAuth
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type VARCHAR(255),
        scope VARCHAR(255),
        id_token TEXT,
        session_state VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(provider, provider_account_id)
      )
    `

    // Create sessions table for NextAuth
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `

    // Create verification_tokens table for NextAuth
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `

    // Add foreign key constraint for users.kitchen_id
    await sql`
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_kitchen 
      FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE SET NULL
    `.catch(() => {
      // Constraint might already exist, ignore error
    })

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_menus_date ON daily_menus(menu_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_menus_kitchen ON daily_menus(kitchen_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_menus_meal_type ON daily_menus(meal_type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_type ON recipes(type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_kitchen ON users(kitchen_id)`

    console.log("Database setup completed successfully!")

    // Insert sample data if tables are empty
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    if (Number(userCount[0].count) === 0) {
      console.log("Inserting sample data...")
      await insertSampleData()
    }
  } catch (error) {
    console.error("Database setup failed:", error)
    throw error
  }
}

async function insertSampleData() {
  try {
    // Insert sample kitchens
    const kitchens = [
      { id: "kitchen_1", name: "Thakorji Kitchen", location: "Main Building" },
      { id: "kitchen_2", name: "Premvati Kitchen", location: "East Wing" },
      { id: "kitchen_3", name: "Aarsh Kitchen", location: "West Wing" },
      { id: "kitchen_4", name: "Mandir Kitchen", location: "Temple Complex" },
      { id: "kitchen_5", name: "Prasad Kitchen", location: "Central Hall" },
    ]

    for (const kitchen of kitchens) {
      await sql`
        INSERT INTO kitchens (id, name, location) 
        VALUES (${kitchen.id}, ${kitchen.name}, ${kitchen.location})
        ON CONFLICT (id) DO NOTHING
      `
    }

    // Insert sample admin user
    await sql`
      INSERT INTO users (id, name, email, role, kitchen_id) 
      VALUES ('user_admin', 'Admin User', 'admin@keshavkitchen.com', 'ADMIN', 'kitchen_1')
      ON CONFLICT (email) DO NOTHING
    `

    // Insert sample recipes
    const recipes = [
      { id: "recipe_1", name: "Idli Sambhar", type: "BREAKFAST" },
      { id: "recipe_2", name: "Poha", type: "BREAKFAST" },
      { id: "recipe_3", name: "Dal Rice", type: "LUNCH" },
      { id: "recipe_4", name: "Roti Sabzi", type: "DINNER" },
      { id: "recipe_5", name: "Khichdi", type: "DINNER" },
    ]

    for (const recipe of recipes) {
      await sql`
        INSERT INTO recipes (id, name, type, created_by) 
        VALUES (${recipe.id}, ${recipe.name}, ${recipe.type}, 'user_admin')
        ON CONFLICT (id) DO NOTHING
      `
    }

    // Insert sample ingredients
    const ingredients = [
      { recipe_id: "recipe_1", name: "Rice", quantity: 2, unit: "kg" },
      { recipe_id: "recipe_1", name: "Urad Dal", quantity: 0.5, unit: "kg" },
      { recipe_id: "recipe_2", name: "Poha", quantity: 1, unit: "kg" },
      { recipe_id: "recipe_2", name: "Onion", quantity: 0.3, unit: "kg" },
      { recipe_id: "recipe_3", name: "Dal", quantity: 0.5, unit: "kg" },
      { recipe_id: "recipe_3", name: "Rice", quantity: 1, unit: "kg" },
    ]

    for (const ingredient of ingredients) {
      const ingredientId = `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await sql`
        INSERT INTO recipe_ingredients (id, recipe_id, ingredient_name, quantity, unit) 
        VALUES (${ingredientId}, ${ingredient.recipe_id}, ${ingredient.name}, ${ingredient.quantity}, ${ingredient.unit})
      `
    }

    console.log("Sample data inserted successfully!")
  } catch (error) {
    console.error("Failed to insert sample data:", error)
  }
}

if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log("Setup completed!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Setup failed:", error)
      process.exit(1)
    })
}

export { setupDatabase }
