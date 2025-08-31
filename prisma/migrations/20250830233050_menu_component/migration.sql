-- AlterTable
ALTER TABLE "public"."Menu" ADD COLUMN     "menuComponentId" TEXT;

-- AlterTable
ALTER TABLE "public"."MenuIngredient" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "public"."MenuIngredientGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuIngredientGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "mealType" "public"."MealType" NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,

    CONSTRAINT "MenuComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEvent" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "url" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kitchenId" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuIngredientGroup_menuId_idx" ON "public"."MenuIngredientGroup"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuIngredientGroup_menuId_name_key" ON "public"."MenuIngredientGroup"("menuId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_uid_key" ON "public"."CalendarEvent"("uid");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "public"."CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startDate_idx" ON "public"."CalendarEvent"("startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_uid_idx" ON "public"."CalendarEvent"("uid");

-- CreateIndex
CREATE INDEX "MenuIngredient_groupId_idx" ON "public"."MenuIngredient"("groupId");

-- AddForeignKey
ALTER TABLE "public"."Menu" ADD CONSTRAINT "Menu_menuComponentId_fkey" FOREIGN KEY ("menuComponentId") REFERENCES "public"."MenuComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuIngredientGroup" ADD CONSTRAINT "MenuIngredientGroup_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "public"."Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuIngredient" ADD CONSTRAINT "MenuIngredient_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."MenuIngredientGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "public"."Kitchen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
