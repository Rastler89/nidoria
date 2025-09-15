/*
  Warnings:

  - You are about to drop the column `refesh_token` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "nidoria"."User" DROP COLUMN "refesh_token",
ADD COLUMN     "refresh_token" TEXT;
