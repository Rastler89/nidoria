-- PvE: catálogo de monstruos, apariciones, batallas y reportes.
--
-- `battles` nace sin resolver (result/resolved_at nulos) y la cola `pve` la
-- completa cuando termina el viaje. Se guarda una foto de las unidades y sus
-- stats para que el reporte sea reproducible aunque el catálogo cambie.
--
-- `reports.type` incluye ALLIANCE desde el principio para no migrar de nuevo
-- cuando se implementen las alianzas.

-- CreateEnum
CREATE TYPE "BattleType" AS ENUM ('PVE', 'PVP');

-- CreateEnum
CREATE TYPE "BattleResult" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- CreateEnum
CREATE TYPE "MonsterSpawnStatus" AS ENUM ('ACTIVE', 'DEFEATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BATTLE', 'SYSTEM', 'ALLIANCE');

-- CreateTable
CREATE TABLE "monsters" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "hp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 0,
    "loot" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "monsters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monster_spawns" (
    "id" SERIAL NOT NULL,
    "monster" INTEGER NOT NULL,
    "world" INTEGER,
    "level" INTEGER NOT NULL DEFAULT 1,
    "hp_remaining" INTEGER NOT NULL,
    "position_x" INTEGER NOT NULL,
    "position_y" INTEGER NOT NULL,
    "status" "MonsterSpawnStatus" NOT NULL DEFAULT 'ACTIVE',
    "spawned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monster_spawns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battles" (
    "id" SERIAL NOT NULL,
    "type" "BattleType" NOT NULL,
    "attacker_anthill" INTEGER NOT NULL,
    "defender_anthill" INTEGER,
    "monster_spawn" INTEGER,
    "seed" TEXT NOT NULL,
    "result" "BattleResult",
    "rounds" JSONB NOT NULL DEFAULT '[]',
    "attacker_units" JSONB NOT NULL DEFAULT '[]',
    "defender_units" JSONB NOT NULL DEFAULT '[]',
    "loot" JSONB NOT NULL DEFAULT '{}',
    "losses_attacker" JSONB NOT NULL DEFAULT '{}',
    "losses_defender" JSONB NOT NULL DEFAULT '{}',
    "travel_seconds" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "owner_user" INTEGER NOT NULL,
    "type" "ReportType" NOT NULL,
    "battle" INTEGER,
    "title" TEXT NOT NULL,
    "body" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monsters_code_key" ON "monsters"("code");

-- CreateIndex
CREATE INDEX "monsters_tier_idx" ON "monsters"("tier");

-- CreateIndex
CREATE INDEX "monster_spawns_status_expires_at_idx" ON "monster_spawns"("status", "expires_at");

-- CreateIndex
CREATE INDEX "monster_spawns_world_status_idx" ON "monster_spawns"("world", "status");

-- CreateIndex
CREATE INDEX "battles_attacker_anthill_started_at_idx" ON "battles"("attacker_anthill", "started_at");

-- CreateIndex
CREATE INDEX "battles_monster_spawn_idx" ON "battles"("monster_spawn");

-- CreateIndex
CREATE INDEX "reports_owner_user_created_at_idx" ON "reports"("owner_user", "created_at");

-- AddForeignKey
ALTER TABLE "monster_spawns" ADD CONSTRAINT "monster_spawns_monster_fkey" FOREIGN KEY ("monster") REFERENCES "monsters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monster_spawns" ADD CONSTRAINT "monster_spawns_world_fkey" FOREIGN KEY ("world") REFERENCES "worlds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_attacker_anthill_fkey" FOREIGN KEY ("attacker_anthill") REFERENCES "Anthill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_defender_anthill_fkey" FOREIGN KEY ("defender_anthill") REFERENCES "Anthill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_monster_spawn_fkey" FOREIGN KEY ("monster_spawn") REFERENCES "monster_spawns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_owner_user_fkey" FOREIGN KEY ("owner_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_battle_fkey" FOREIGN KEY ("battle") REFERENCES "battles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
