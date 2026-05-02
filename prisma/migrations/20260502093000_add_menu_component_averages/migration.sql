-- CreateTable
CREATE TABLE "public"."MenuComponentAverage" (
    "id" TEXT NOT NULL,
    "menuComponentId" TEXT NOT NULL,
    "personTypeId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "weightPerPiece" DOUBLE PRECISION,
    "weightPerPieceUnit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuComponentAverage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuComponentAverage_menuComponentId_personTypeId_key" ON "public"."MenuComponentAverage"("menuComponentId", "personTypeId");

-- CreateIndex
CREATE INDEX "MenuComponentAverage_menuComponentId_idx" ON "public"."MenuComponentAverage"("menuComponentId");

-- CreateIndex
CREATE INDEX "MenuComponentAverage_personTypeId_idx" ON "public"."MenuComponentAverage"("personTypeId");

-- AddForeignKey
ALTER TABLE "public"."MenuComponentAverage" ADD CONSTRAINT "MenuComponentAverage_menuComponentId_fkey" FOREIGN KEY ("menuComponentId") REFERENCES "public"."MenuComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuComponentAverage" ADD CONSTRAINT "MenuComponentAverage_personTypeId_fkey" FOREIGN KEY ("personTypeId") REFERENCES "public"."KitchenPersonType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
