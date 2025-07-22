-- Seed data for development
INSERT INTO kitchens (id, name, location) VALUES 
  ('kitchen_1', 'Thakorji', 'Main Building'),
  ('kitchen_2', 'Premvati', 'East Wing'),
  ('kitchen_3', 'Aarsh', 'West Wing'),
  ('kitchen_4', 'Mandir', 'Temple Complex'),
  ('kitchen_5', 'Prasad', 'Central Kitchen');

-- Create admin user (password: admin123)
INSERT INTO users (id, email, name, password, role, kitchen_id) VALUES 
  ('user_admin', 'admin@kitchen.com', 'Admin User', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'kitchen_1');

-- Create sample recipes
INSERT INTO recipes (id, name, type, description, created_by) VALUES 
  ('recipe_1', 'Idali Sambhar', 'BREAKFAST', 'Traditional South Indian breakfast', 'user_admin'),
  ('recipe_2', 'Poha', 'BREAKFAST', 'Flattened rice with vegetables', 'user_admin'),
  ('recipe_3', 'Dal Rice', 'LUNCH', 'Lentils with rice', 'user_admin');

-- Add ingredients for recipes
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, cost_per_unit) VALUES 
  ('recipe_1', 'Rice', 2.5, 'kg', 30.00),
  ('recipe_1', 'Urad Dal', 0.5, 'kg', 120.00),
  ('recipe_1', 'Toor Dal', 0.3, 'kg', 100.00),
  ('recipe_2', 'Poha', 1.0, 'kg', 40.00),
  ('recipe_2', 'Onion', 0.5, 'kg', 25.00),
  ('recipe_2', 'Potato', 0.3, 'kg', 20.00);
