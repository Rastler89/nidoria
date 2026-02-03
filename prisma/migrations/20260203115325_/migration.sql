/*
  Warnings:

  - You are about to drop the column `target_id` on the `Requirement` table. All the data in the column will be lost.
  - Added the required column `targetId` to the `Requirement` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "nidoria"."Requirement_target_id_idx";

-- AlterTable
ALTER TABLE "nidoria"."Requirement" DROP COLUMN "target_id",
ADD COLUMN     "targetId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Requirement_targetId_idx" ON "nidoria"."Requirement"("targetId");
