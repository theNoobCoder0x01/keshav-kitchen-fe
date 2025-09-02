/*
  Warnings:

  - Added the required column `kitchenId` to the `MenuComponent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MenuComponent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MenuComponent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "kitchenId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."MenuComponent" ADD CONSTRAINT "MenuComponent_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "public"."Kitchen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
