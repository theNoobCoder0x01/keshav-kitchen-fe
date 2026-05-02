-- CreateTable
CREATE TABLE "public"."KitchenPersonType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequenceNumber" INTEGER NOT NULL,
    "kitchenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenPersonType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KitchenPersonType_kitchenId_name_key" ON "public"."KitchenPersonType"("kitchenId", "name");

-- CreateIndex
CREATE INDEX "KitchenPersonType_kitchenId_idx" ON "public"."KitchenPersonType"("kitchenId");

-- CreateIndex
CREATE INDEX "KitchenPersonType_kitchenId_sequenceNumber_idx" ON "public"."KitchenPersonType"("kitchenId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "public"."KitchenPersonType" ADD CONSTRAINT "KitchenPersonType_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "public"."Kitchen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
