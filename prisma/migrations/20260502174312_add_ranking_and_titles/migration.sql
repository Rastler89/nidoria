-- AlterTable
ALTER TABLE "Ant" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Anthill" ADD COLUMN     "capacities" JSONB NOT NULL DEFAULT '{"FOOD": 500, "LEAD": 500, "WOOD": 500}',
ADD COLUMN     "military_pop_max" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pop_max" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "power_construction" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "power_investigation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "power_military" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "power_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "world_id" INTEGER;

-- AlterTable
ALTER TABLE "Construction" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Investigation" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Title" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requirements" JSONB,
    "style" JSONB,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_title" (
    "user_id" INTEGER NOT NULL,
    "title_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_title_pkey" PRIMARY KEY ("user_id","title_id")
);

-- CreateTable
CREATE TABLE "worlds" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxPlayers" INTEGER NOT NULL DEFAULT 1000,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worlds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Title_name_key" ON "Title"("name");

-- CreateIndex
CREATE UNIQUE INDEX "worlds_name_key" ON "worlds"("name");

-- CreateIndex
CREATE INDEX "Anthill_world_id_idx" ON "Anthill"("world_id");

-- CreateIndex
CREATE INDEX "Anthill_power_total_idx" ON "Anthill"("power_total");

-- AddForeignKey
ALTER TABLE "user_title" ADD CONSTRAINT "user_title_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_title" ADD CONSTRAINT "user_title_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anthill" ADD CONSTRAINT "Anthill_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
