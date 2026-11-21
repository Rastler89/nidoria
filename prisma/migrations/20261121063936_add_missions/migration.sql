-- CreateEnum
CREATE TYPE "MissionConditionType" AS ENUM ('HAVE_ANTS', 'HAVE_FOOD_STOCK', 'HAVE_WOOD_STOCK', 'HAVE_LEAD_STOCK', 'HAVE_CONSTRUCTIONS_COMPLETED');

-- CreateTable
CREATE TABLE "missions" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "condition_type" "MissionConditionType" NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 1,
    "reward_food" INTEGER NOT NULL DEFAULT 0,
    "reward_wood" INTEGER NOT NULL DEFAULT 0,
    "reward_lead" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_claims" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mission_id" INTEGER NOT NULL,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "missions_key_key" ON "missions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "mission_claims_user_id_mission_id_key" ON "mission_claims"("user_id", "mission_id");

-- AddForeignKey
ALTER TABLE "mission_claims" ADD CONSTRAINT "mission_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_claims" ADD CONSTRAINT "mission_claims_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
