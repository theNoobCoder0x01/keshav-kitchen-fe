-- Allow ad hoc menu entries that are built only from menu ingredients.
ALTER TABLE "public"."Menu" DROP CONSTRAINT IF EXISTS "Menu_recipeId_fkey";
ALTER TABLE "public"."Menu" ALTER COLUMN "recipeId" DROP NOT NULL;
ALTER TABLE "public"."Menu" ADD CONSTRAINT "Menu_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Store daily per-meal person counts by kitchen and person type.
CREATE TABLE "public"."KitchenMealPersonCount" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mealType" "public"."MealType" NOT NULL,
    "kitchenId" TEXT NOT NULL,
    "personTypeId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenMealPersonCount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KitchenMealPersonCount_date_kitchenId_mealType_personTypeId_key" ON "public"."KitchenMealPersonCount"("date", "kitchenId", "mealType", "personTypeId");
CREATE INDEX "KitchenMealPersonCount_kitchenId_date_mealType_idx" ON "public"."KitchenMealPersonCount"("kitchenId", "date", "mealType");
CREATE INDEX "KitchenMealPersonCount_personTypeId_idx" ON "public"."KitchenMealPersonCount"("personTypeId");

ALTER TABLE "public"."KitchenMealPersonCount" ADD CONSTRAINT "KitchenMealPersonCount_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "public"."Kitchen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."KitchenMealPersonCount" ADD CONSTRAINT "KitchenMealPersonCount_personTypeId_fkey" FOREIGN KEY ("personTypeId") REFERENCES "public"."KitchenPersonType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
