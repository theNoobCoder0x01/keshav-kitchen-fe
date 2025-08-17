-- Migration: Add Menu Ingredient Groups
-- This migration adds ingredient grouping functionality to menus

-- Create MenuIngredientGroup table
CREATE TABLE IF NOT EXISTS "MenuIngredientGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuIngredientGroup_pkey" PRIMARY KEY ("id")
);

-- Create MenuIngredient table with groupId support
CREATE TABLE IF NOT EXISTS "MenuIngredient_new" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "costPerUnit" REAL NOT NULL,
    "menuId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuIngredient_new_pkey" PRIMARY KEY ("id")
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "MenuIngredientGroup_menuId_idx" ON "MenuIngredientGroup"("menuId");
CREATE INDEX IF NOT EXISTS "MenuIngredient_new_menuId_idx" ON "MenuIngredient_new"("menuId");
CREATE INDEX IF NOT EXISTS "MenuIngredient_new_groupId_idx" ON "MenuIngredient_new"("groupId");

-- Add unique constraint for group names per menu
CREATE UNIQUE INDEX IF NOT EXISTS "MenuIngredientGroup_menuId_name_key" ON "MenuIngredientGroup"("menuId", "name");

-- Add foreign key constraints
ALTER TABLE "MenuIngredientGroup" ADD CONSTRAINT "MenuIngredientGroup_menuId_fkey" 
    FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuIngredient_new" ADD CONSTRAINT "MenuIngredient_new_menuId_fkey" 
    FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuIngredient_new" ADD CONSTRAINT "MenuIngredient_new_groupId_fkey" 
    FOREIGN KEY ("groupId") REFERENCES "MenuIngredientGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Copy existing data from MenuIngredient to MenuIngredient_new
INSERT INTO "MenuIngredient_new" ("id", "name", "quantity", "unit", "costPerUnit", "menuId", "createdAt", "updatedAt")
SELECT "id", "name", "quantity", "unit", "costPerUnit", "menuId", "createdAt", "updatedAt"
FROM "MenuIngredient";

-- Drop the old table and rename the new one
DROP TABLE "MenuIngredient";
ALTER TABLE "MenuIngredient_new" RENAME TO "MenuIngredient";

-- Update the Menu table to include the ingredientGroups relationship
-- (This is handled by Prisma schema changes)

-- Create a default "Ungrouped" group for each existing menu that has ingredients
INSERT INTO "MenuIngredientGroup" ("id", "name", "menuId", "sortOrder", "createdAt", "updatedAt")
SELECT 
    'ungrouped_' || m.id as id,
    'Ungrouped' as name,
    m.id as menuId,
    999 as sortOrder,
    CURRENT_TIMESTAMP as createdAt,
    CURRENT_TIMESTAMP as updatedAt
FROM "Menu" m
WHERE EXISTS (
    SELECT 1 FROM "MenuIngredient" mi WHERE mi."menuId" = m.id
);

-- Commit the transaction
COMMIT;