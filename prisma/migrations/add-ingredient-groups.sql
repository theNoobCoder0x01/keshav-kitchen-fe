-- Migration: Add Ingredient Groups Support
-- This migration adds ingredient grouping functionality while preserving all existing data

-- Step 1: Create the IngredientGroup table
CREATE TABLE "IngredientGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngredientGroup_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add groupId column to Ingredient table (nullable for backward compatibility)
ALTER TABLE "Ingredient" ADD COLUMN "groupId" TEXT;

-- Step 3: Create indexes for performance
CREATE INDEX "IngredientGroup_recipeId_idx" ON "IngredientGroup"("recipeId");
CREATE UNIQUE INDEX "IngredientGroup_recipeId_name_key" ON "IngredientGroup"("recipeId", "name");
CREATE INDEX "Ingredient_groupId_idx" ON "Ingredient"("groupId");

-- Step 4: Add foreign key constraints
ALTER TABLE "IngredientGroup" ADD CONSTRAINT "IngredientGroup_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IngredientGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Create default "Ungrouped" groups for all existing recipes that have ingredients
-- This ensures backward compatibility by grouping all existing ingredients under "Ungrouped"
INSERT INTO "IngredientGroup" ("id", "name", "recipeId", "sortOrder", "createdAt", "updatedAt")
SELECT 
    'ungrouped_' || "Recipe"."id" as "id",
    'Ungrouped' as "name",
    "Recipe"."id" as "recipeId",
    999 as "sortOrder", -- Put ungrouped at the end by default
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
FROM "Recipe"
WHERE EXISTS (
    SELECT 1 FROM "Ingredient" WHERE "Ingredient"."recipeId" = "Recipe"."id"
);

-- Step 6: Assign all existing ingredients to their recipe's "Ungrouped" group
UPDATE "Ingredient" 
SET "groupId" = 'ungrouped_' || "recipeId"
WHERE "groupId" IS NULL;