/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Construction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Investigation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Construction_name_key" ON "nidoria"."Construction"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_name_key" ON "nidoria"."Investigation"("name");
