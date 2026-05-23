-- ============================================================
-- Rename Kitchen → Premise
-- Renames tables, columns, FK constraints, and indexes so
-- the database structure matches the updated Prisma schema.
-- No data is lost; existing kitchenId values become premiseId.
-- ============================================================

-- --------------------------------------------------------
-- 1. Rename tables
-- --------------------------------------------------------
ALTER TABLE "public"."Kitchen" RENAME TO "Premise";
ALTER TABLE "public"."KitchenPersonType" RENAME TO "PremisePersonType";
ALTER TABLE "public"."KitchenMealPersonCount" RENAME TO "PremiseMealPersonCount";

-- --------------------------------------------------------
-- 2. Rename columns (kitchenId → premiseId)
-- --------------------------------------------------------
ALTER TABLE "public"."User" RENAME COLUMN "kitchenId" TO "premiseId";
ALTER TABLE "public"."Menu" RENAME COLUMN "kitchenId" TO "premiseId";
ALTER TABLE "public"."MenuComponent" RENAME COLUMN "kitchenId" TO "premiseId";
ALTER TABLE "public"."Report" RENAME COLUMN "kitchenId" TO "premiseId";
ALTER TABLE "public"."CalendarEvent" RENAME COLUMN "kitchenId" TO "premiseId";
ALTER TABLE "public"."PremisePersonType" RENAME COLUMN "kitchenId" TO "premiseId";
ALTER TABLE "public"."PremiseMealPersonCount" RENAME COLUMN "kitchenId" TO "premiseId";

-- --------------------------------------------------------
-- 3. Rename primary key constraints
-- --------------------------------------------------------
ALTER TABLE "public"."Premise" RENAME CONSTRAINT "Kitchen_pkey" TO "Premise_pkey";
ALTER TABLE "public"."PremisePersonType" RENAME CONSTRAINT "KitchenPersonType_pkey" TO "PremisePersonType_pkey";
ALTER TABLE "public"."PremiseMealPersonCount" RENAME CONSTRAINT "KitchenMealPersonCount_pkey" TO "PremiseMealPersonCount_pkey";

-- --------------------------------------------------------
-- 4. Rename foreign key constraints
-- --------------------------------------------------------
ALTER TABLE "public"."User" RENAME CONSTRAINT "User_kitchenId_fkey" TO "User_premiseId_fkey";
ALTER TABLE "public"."Menu" RENAME CONSTRAINT "Menu_kitchenId_fkey" TO "Menu_premiseId_fkey";
ALTER TABLE "public"."MenuComponent" RENAME CONSTRAINT "MenuComponent_kitchenId_fkey" TO "MenuComponent_premiseId_fkey";
ALTER TABLE "public"."Report" RENAME CONSTRAINT "Report_kitchenId_fkey" TO "Report_premiseId_fkey";
ALTER TABLE "public"."CalendarEvent" RENAME CONSTRAINT "CalendarEvent_kitchenId_fkey" TO "CalendarEvent_premiseId_fkey";
ALTER TABLE "public"."PremisePersonType" RENAME CONSTRAINT "KitchenPersonType_kitchenId_fkey" TO "PremisePersonType_premiseId_fkey";
ALTER TABLE "public"."PremiseMealPersonCount" RENAME CONSTRAINT "KitchenMealPersonCount_kitchenId_fkey" TO "PremiseMealPersonCount_premiseId_fkey";
ALTER TABLE "public"."PremiseMealPersonCount" RENAME CONSTRAINT "KitchenMealPersonCount_personTypeId_fkey" TO "PremiseMealPersonCount_personTypeId_fkey";

-- --------------------------------------------------------
-- 5. Rename indexes
-- --------------------------------------------------------
-- User
ALTER INDEX "User_kitchenId_idx" RENAME TO "User_premiseId_idx";

-- Menu
ALTER INDEX "Menu_kitchenId_idx" RENAME TO "Menu_premiseId_idx";

-- Report
ALTER INDEX "Report_kitchenId_idx" RENAME TO "Report_premiseId_idx";

-- PremisePersonType (was KitchenPersonType)
ALTER INDEX "KitchenPersonType_kitchenId_name_key" RENAME TO "PremisePersonType_premiseId_name_key";
ALTER INDEX "KitchenPersonType_kitchenId_idx" RENAME TO "PremisePersonType_premiseId_idx";
ALTER INDEX "KitchenPersonType_kitchenId_sequenceNumber_idx" RENAME TO "PremisePersonType_premiseId_sequenceNumber_idx";

-- PremiseMealPersonCount (was KitchenMealPersonCount)
ALTER INDEX "KitchenMealPersonCount_date_kitchenId_mealType_personTypeId_key" RENAME TO "PremiseMealPersonCount_date_premiseId_mealType_personTypeId_key";
ALTER INDEX "KitchenMealPersonCount_kitchenId_date_mealType_idx" RENAME TO "PremiseMealPersonCount_premiseId_date_mealType_idx";
ALTER INDEX "KitchenMealPersonCount_personTypeId_idx" RENAME TO "PremiseMealPersonCount_personTypeId_idx";
