/*
  Warnings:

  - Added the required column `base_ants` to the `Ant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_ants` to the `Construction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_ants` to the `Investigation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "nidoria"."Ant" ADD COLUMN     "base_ants" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "nidoria"."Construction" ADD COLUMN     "base_ants" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "nidoria"."Investigation" ADD COLUMN     "base_ants" INTEGER NOT NULL;
