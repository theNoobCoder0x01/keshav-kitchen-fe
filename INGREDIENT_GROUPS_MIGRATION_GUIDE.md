# Ingredient Groups Migration Guide

This guide provides step-by-step instructions for deploying the ingredient grouping feature to your production database.

## Overview

The ingredient grouping feature allows users to organize recipe ingredients into logical groups (e.g., "Dough", "Filling", "Sauce"). This migration is designed to be **completely backward compatible** - all existing ingredients will be automatically grouped under "Ungrouped" sections.

## Pre-Migration Checklist

- [ ] **Backup your production database** before starting
- [ ] Ensure you have sufficient database privileges to create tables, indexes, and constraints
- [ ] Verify that your application can be temporarily taken offline during migration (recommended)
- [ ] Test the migration on a staging environment first

## Migration Steps

### Step 1: Update Prisma Schema

The schema has been updated to include the new `IngredientGroup` model and relationships. The changes are:

- Added `IngredientGroup` model with fields: `id`, `name`, `recipeId`, `sortOrder`, `createdAt`, `updatedAt`
- Added `groupId` field to `Ingredient` model (nullable for backward compatibility)
- Added proper indexes and relationships

### Step 2: Generate and Apply Prisma Migration

```bash
# Generate the migration
npx prisma migrate dev --name add-ingredient-groups

# Or for production deployment
npx prisma migrate deploy
```

### Step 3: Manual SQL Migration (Alternative)

If you prefer to run the SQL manually, execute the migration script in this order:

```bash
# Apply the migration SQL file
psql -d your_database_name -f prisma/migrations/add-ingredient-groups.sql
```

The migration will:

1. Create the `IngredientGroup` table
2. Add `groupId` column to `Ingredient` table
3. Create necessary indexes for performance
4. Add foreign key constraints
5. **Automatically create "Ungrouped" groups** for all existing recipes with ingredients
6. **Assign all existing ingredients** to their respective "Ungrouped" groups

### Step 4: Update Prisma Client

```bash
# Regenerate Prisma client with new models
npx prisma generate
```

### Step 5: Deploy Application Code

Deploy the updated application code that includes:

- New API routes for ingredient group management
- Updated recipe APIs that include ingredient groups
- Updated UI components for ingredient grouping

## Data Migration Details

### Backward Compatibility

- **All existing ingredients** will be automatically assigned to an "Ungrouped" group
- **No data loss** - all existing ingredient data remains intact
- **API compatibility** - existing API calls will continue to work
- **UI compatibility** - recipes will display ingredients in an "Ungrouped" section

### Performance Optimizations

The migration includes several indexes:

- `IngredientGroup_recipeId_idx` - Fast lookup of groups by recipe
- `IngredientGroup_recipeId_name_key` - Unique constraint preventing duplicate group names per recipe
- `Ingredient_groupId_idx` - Fast lookup of ingredients by group

### Default Group Behavior

- Each recipe gets an "Ungrouped" group with `sortOrder: 999` (displays at bottom)
- Group IDs follow pattern: `ungrouped_{recipeId}` for predictable identification
- Users can later rename "Ungrouped" groups or create new groups and move ingredients

## Post-Migration Verification

### 1. Data Integrity Checks

```sql
-- Verify all existing ingredients have been assigned to groups
SELECT COUNT(*) FROM "Ingredient" WHERE "groupId" IS NULL;
-- Should return 0

-- Verify all recipes with ingredients have an "Ungrouped" group
SELECT r.id, r.name, COUNT(ig.id) as group_count
FROM "Recipe" r
LEFT JOIN "IngredientGroup" ig ON r.id = ig."recipeId"
WHERE EXISTS (SELECT 1 FROM "Ingredient" i WHERE i."recipeId" = r.id)
GROUP BY r.id, r.name
HAVING COUNT(ig.id) = 0;
-- Should return no results

-- Count total groups created
SELECT COUNT(*) FROM "IngredientGroup" WHERE name = 'Ungrouped';
```

### 2. API Testing

Test these endpoints after deployment:

```bash
# Get recipe with grouped ingredients
GET /api/recipes/{id}

# Get all ingredient groups for a recipe
GET /api/recipes/{id}/ingredient-groups

# Create new ingredient group
POST /api/recipes/{id}/ingredient-groups
```

### 3. UI Testing

- [ ] Recipe detail pages show ingredients grouped under "Ungrouped"
- [ ] Recipe editor allows creating new ingredient groups
- [ ] Ingredients can be moved between groups
- [ ] New recipes work with ingredient grouping

## Rollback Plan (Emergency)

If issues arise, you can rollback using this SQL:

```sql
-- Remove foreign key constraints
ALTER TABLE "Ingredient" DROP CONSTRAINT IF EXISTS "Ingredient_groupId_fkey";
ALTER TABLE "IngredientGroup" DROP CONSTRAINT IF EXISTS "IngredientGroup_recipeId_fkey";

-- Remove the groupId column from Ingredient
ALTER TABLE "Ingredient" DROP COLUMN IF EXISTS "groupId";

-- Drop the IngredientGroup table
DROP TABLE IF EXISTS "IngredientGroup";

-- Regenerate Prisma client
-- npx prisma generate
```

**Note:** After rollback, you'll need to deploy the previous version of your application code.

## Performance Considerations

### Expected Performance Impact

- **Minimal impact** on existing queries
- **Improved performance** for ingredient-heavy recipes due to better organization
- **Slightly increased** database size due to new group records

### Query Optimization

The new queries are optimized for:

- Fetching all ingredients grouped by recipe
- Managing ingredient groups within recipes
- Maintaining sort order for display

## Support

If you encounter issues during migration:

1. Check the application logs for specific error messages
2. Verify database constraints and indexes were created correctly
3. Ensure Prisma client was regenerated after schema changes
4. Test API endpoints individually to isolate issues

## Timeline Estimate

- **Small databases** (< 1000 recipes): 2-5 minutes
- **Medium databases** (1000-10000 recipes): 5-15 minutes  
- **Large databases** (> 10000 recipes): 15-30 minutes

The migration includes automatic data population, so timing depends on your recipe count.