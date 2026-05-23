-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "cook" TEXT,
ADD COLUMN     "kitchenId" TEXT;

-- CreateTable
CREATE TABLE "Kitchen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultCook" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kitchen_pkey" PRIMARY KEY ("id")
);

-- Insert default kitchen record
INSERT INTO "Kitchen" ("id", "name", "updatedAt")
VALUES ('default-kitchen-001', 'Main Kitchen', NOW());

-- Backfill all existing Menu rows with the default kitchen
UPDATE "Menu" SET "kitchenId" = 'default-kitchen-001' WHERE "kitchenId" IS NULL;

-- Make kitchenId non-nullable now that all rows are populated
ALTER TABLE "Menu" ALTER COLUMN "kitchenId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Menu_kitchenId_idx" ON "Menu"("kitchenId");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
