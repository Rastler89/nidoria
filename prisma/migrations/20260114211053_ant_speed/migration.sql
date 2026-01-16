/*
  Warnings:

  - You are about to drop the column `speed` on the `Ant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "nidoria"."Ant" DROP COLUMN "speed",
ADD COLUMN     "speed_attack" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "speed_defense" INTEGER NOT NULL DEFAULT 1;
