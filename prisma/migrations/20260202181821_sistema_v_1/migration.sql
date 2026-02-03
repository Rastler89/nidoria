/*
  Warnings:

  - You are about to drop the column `item_type` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `targetAntId` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `targetConstructionId` on the `Requirement` table. All the data in the column will be lost.
  - You are about to drop the column `targetInvestigationId` on the `Requirement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Ant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Construction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Investigation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Ant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Construction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Investigation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `required_type` to the `Requirement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_id` to the `Requirement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_type` to the `Requirement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "nidoria"."ItemType" ADD VALUE 'ANT';

-- DropIndex
DROP INDEX "nidoria"."Requirement_targetAntId_idx";

-- DropIndex
DROP INDEX "nidoria"."Requirement_targetConstructionId_idx";

-- DropIndex
DROP INDEX "nidoria"."Requirement_targetInvestigationId_idx";

-- AlterTable
ALTER TABLE "nidoria"."Ant" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "nidoria"."Construction" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "nidoria"."Investigation" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "nidoria"."Requirement" DROP COLUMN "item_type",
DROP COLUMN "targetAntId",
DROP COLUMN "targetConstructionId",
DROP COLUMN "targetInvestigationId",
ADD COLUMN     "required_type" "nidoria"."ItemType" NOT NULL,
ADD COLUMN     "target_id" INTEGER NOT NULL,
ADD COLUMN     "target_type" "nidoria"."ItemType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Ant_code_key" ON "nidoria"."Ant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Construction_code_key" ON "nidoria"."Construction"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_code_key" ON "nidoria"."Investigation"("code");

-- CreateIndex
CREATE INDEX "Requirement_target_id_idx" ON "nidoria"."Requirement"("target_id");
