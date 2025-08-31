/*
  Warnings:

  - You are about to drop the column `servings` on the `Recipe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Recipe" DROP COLUMN "servings",
ADD COLUMN     "preparedQuantity" INTEGER,
ADD COLUMN     "preparedQuantityUnit" TEXT;
