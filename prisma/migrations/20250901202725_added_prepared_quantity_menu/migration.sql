/*
  Warnings:

  - You are about to drop the column `actualCount` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `servings` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Menu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Menu" DROP COLUMN "actualCount",
DROP COLUMN "servings",
DROP COLUMN "status",
ADD COLUMN     "preparedQuantity" DOUBLE PRECISION,
ADD COLUMN     "preparedQuantityUnit" TEXT,
ADD COLUMN     "quantityPerPiece" DOUBLE PRECISION,
ADD COLUMN     "servingQuantity" DOUBLE PRECISION,
ADD COLUMN     "servingQuantityUnit" TEXT;

-- AlterTable
ALTER TABLE "public"."Recipe" ADD COLUMN     "quantityPerPiece" DOUBLE PRECISION,
ADD COLUMN     "servingQuantity" DOUBLE PRECISION,
ADD COLUMN     "servingQuantityUnit" TEXT,
ALTER COLUMN "preparedQuantity" SET DATA TYPE DOUBLE PRECISION;

-- DropEnum
DROP TYPE "public"."Status";
