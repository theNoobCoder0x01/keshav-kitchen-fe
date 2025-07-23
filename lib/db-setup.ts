import { sql } from "./db";

export async function createTables() {
  try {
    console.log("🔧 Creating database tables...");

    // Create kitchens table
    await sql`
      CREATE TABLE IF NOT EXISTS kitchens (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'STAFF',
        kitchen_id TEXT REFERENCES kitchens(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create recipes table
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        instructions TEXT,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        cost_per_serving DECIMAL(10,2),
        image_url TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create recipe_ingredients table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id TEXT PRIMARY KEY,
        recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_name TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit TEXT NOT NULL,
        cost_per_unit DECIMAL(10,2),
        notes TEXT
      )
    `;

    // Create daily_menus table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_menus (
        id TEXT PRIMARY KEY,
        kitchen_id TEXT REFERENCES kitchens(id),
        menu_date DATE NOT NULL,
        meal_type TEXT NOT NULL,
        recipe_id TEXT REFERENCES recipes(id),
        planned_servings INTEGER NOT NULL,
        actual_servings INTEGER,
        ghan_multiplier DECIMAL(5,2) DEFAULT 1.0,
        status TEXT DEFAULT 'PLANNED',
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(kitchen_id, menu_date, meal_type, recipe_id)
      )
    `;

    // Create daily_reports table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id TEXT PRIMARY KEY,
        kitchen_id TEXT REFERENCES kitchens(id),
        report_date DATE NOT NULL,
        total_visitors INTEGER NOT NULL,
        breakfast_count INTEGER NOT NULL,
        lunch_count INTEGER NOT NULL,
        dinner_count INTEGER NOT NULL,
        total_cost DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(kitchen_id, report_date)
      )
    `;

    console.log("✅ Database tables created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

export async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");

    // Create kitchens
    await sql`
      INSERT INTO kitchens (id, name, location) VALUES 
        ('kitchen_1', 'Thakorji', 'Main Building'),
        ('kitchen_2', 'Premvati', 'East Wing'),
        ('kitchen_3', 'Aarsh', 'West Wing'),
        ('kitchen_4', 'Mandir', 'Temple Complex'),
        ('kitchen_5', 'Prasad', 'Central Kitchen')
      ON CONFLICT (id) DO NOTHING
    `;

    // Create admin user (password: admin123 - bcrypt hash)
    const hashedPassword =
      "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";
    await sql`
      INSERT INTO users (id, email, name, password, role, kitchen_id) VALUES 
        ('user_admin', 'admin@kitchen.com', 'Admin User', ${hashedPassword}, 'ADMIN', 'kitchen_1')
      ON CONFLICT (email) DO NOTHING
    `;

    // Create sample recipes
    await sql`
      INSERT INTO recipes (id, name, type, description, created_by, prep_time, cook_time, servings) VALUES 
        ('recipe_1', 'Idali Sambhar', 'BREAKFAST', 'Traditional South Indian breakfast', 'user_admin', 30, 45, 100),
        ('recipe_2', 'Poha', 'BREAKFAST', 'Flattened rice with vegetables', 'user_admin', 15, 20, 80),
        ('recipe_3', 'Dal Rice', 'LUNCH', 'Lentils with rice', 'user_admin', 20, 40, 120)
      ON CONFLICT (id) DO NOTHING
    `;

    // Add ingredients for recipes
    await sql`
      INSERT INTO recipe_ingredients (id, recipe_id, ingredient_name, quantity, unit, cost_per_unit) VALUES 
        ('ing_1', 'recipe_1', 'Rice', 2.5, 'kg', 30.00),
        ('ing_2', 'recipe_1', 'Urad Dal', 0.5, 'kg', 120.00),
        ('ing_3', 'recipe_1', 'Toor Dal', 0.3, 'kg', 100.00),
        ('ing_4', 'recipe_2', 'Poha', 1.0, 'kg', 40.00),
        ('ing_5', 'recipe_2', 'Onion', 0.5, 'kg', 25.00),
        ('ing_6', 'recipe_2', 'Potato', 0.3, 'kg', 20.00),
        ('ing_7', 'recipe_3', 'Rice', 3.0, 'kg', 30.00),
        ('ing_8', 'recipe_3', 'Toor Dal', 1.0, 'kg', 100.00),
        ('ing_9', 'recipe_3', 'Turmeric', 0.05, 'kg', 200.00)
      ON CONFLICT (id) DO NOTHING
    `;

    // Create sample daily menus for today
    const today = new Date().toISOString().split("T")[0];
    await sql`
      INSERT INTO daily_menus (id, kitchen_id, menu_date, meal_type, recipe_id, planned_servings, ghan_multiplier, created_by) VALUES 
        ('menu_1', 'kitchen_1', ${today}, 'BREAKFAST', 'recipe_1', 100, 1.0, 'user_admin'),
        ('menu_2', 'kitchen_1', ${today}, 'LUNCH', 'recipe_3', 120, 1.2, 'user_admin')
      ON CONFLICT (kitchen_id, menu_date, meal_type, recipe_id) DO NOTHING
    `;

    console.log("✅ Database seeded successfully");
    return true;
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
