-- CreateEnum
CREATE TYPE "nidoria"."AntType" AS ENUM ('W', 'S');

-- CreateEnum
CREATE TYPE "nidoria"."ResourceType" AS ENUM ('F', 'W', 'L');

-- CreateEnum
CREATE TYPE "nidoria"."DeploymentType" AS ENUM ('S', 'A');

-- CreateEnum
CREATE TYPE "nidoria"."ItemType" AS ENUM ('a', 'c', 'i');

-- CreateTable
CREATE TABLE "nidoria"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nidoria"."Anthill" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "position_x" INTEGER NOT NULL,
    "position_y" INTEGER NOT NULL,
    "eggs" INTEGER NOT NULL,
    "larva" INTEGER NOT NULL,
    "ants" INTEGER NOT NULL,
    "ants_busy" INTEGER NOT NULL,

    CONSTRAINT "Anthill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nidoria"."Construction" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "preview" INTEGER,
    "effects" JSONB,

    CONSTRAINT "Construction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nidoria"."Investigation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "preview" INTEGER,
    "effects" JSONB,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nidoria"."Ant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "nidoria"."AntType" NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "heal" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,

    CONSTRAINT "Ant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nidoria"."Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "nidoria"."ResourceType" NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nidoria"."Deployment" (
    "id" SERIAL NOT NULL,
    "type" "nidoria"."DeploymentType" NOT NULL,
    "anthill_aggressor" INTEGER NOT NULL,
    "anthill_defensor" INTEGER NOT NULL,
    "init" TIMESTAMP(3) NOT NULL,
    "finish" TIMESTAMP(3) NOT NULL,
    "result" JSONB,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nidoria"."ants_deploy" (
    "ants" INTEGER NOT NULL,
    "deployment" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ants_deploy_pkey" PRIMARY KEY ("ants","deployment")
);

-- CreateTable
CREATE TABLE "nidoria"."construction_anthill" (
    "id" SERIAL NOT NULL,
    "anthill" INTEGER NOT NULL,
    "construction" INTEGER NOT NULL,

    CONSTRAINT "construction_anthill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nidoria"."investigation_anthill" (
    "anthill" INTEGER NOT NULL,
    "investigation" INTEGER NOT NULL,

    CONSTRAINT "investigation_anthill_pkey" PRIMARY KEY ("anthill","investigation")
);

-- CreateTable
CREATE TABLE "nidoria"."ants_anthill" (
    "ant" INTEGER NOT NULL,
    "anthill" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "busy" INTEGER NOT NULL,

    CONSTRAINT "ants_anthill_pkey" PRIMARY KEY ("ant","anthill")
);

-- CreateTable
CREATE TABLE "nidoria"."exploration" (
    "anthill" INTEGER NOT NULL,
    "resource_type" INTEGER NOT NULL,
    "ants" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "exploration_pkey" PRIMARY KEY ("anthill","resource_type")
);

-- CreateTable
CREATE TABLE "nidoria"."resource_anthill" (
    "anthill" INTEGER NOT NULL,
    "resource" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "resource_anthill_pkey" PRIMARY KEY ("anthill","resource")
);

-- CreateTable
CREATE TABLE "nidoria"."Requirement" (
    "id" SERIAL NOT NULL,
    "item" INTEGER NOT NULL,
    "type_item" "nidoria"."ItemType" NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "resource_type" "nidoria"."ResourceType" NOT NULL,
    "resource" INTEGER NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "nidoria"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ant_name_key" ON "nidoria"."Ant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_name_key" ON "nidoria"."Resource"("name");

-- AddForeignKey
ALTER TABLE "nidoria"."Anthill" ADD CONSTRAINT "Anthill_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "nidoria"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."Deployment" ADD CONSTRAINT "Deployment_anthill_aggressor_fkey" FOREIGN KEY ("anthill_aggressor") REFERENCES "nidoria"."Anthill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."Deployment" ADD CONSTRAINT "Deployment_anthill_defensor_fkey" FOREIGN KEY ("anthill_defensor") REFERENCES "nidoria"."Anthill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."ants_deploy" ADD CONSTRAINT "ants_deploy_ants_fkey" FOREIGN KEY ("ants") REFERENCES "nidoria"."Ant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."ants_deploy" ADD CONSTRAINT "ants_deploy_deployment_fkey" FOREIGN KEY ("deployment") REFERENCES "nidoria"."Deployment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."construction_anthill" ADD CONSTRAINT "construction_anthill_anthill_fkey" FOREIGN KEY ("anthill") REFERENCES "nidoria"."Anthill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."construction_anthill" ADD CONSTRAINT "construction_anthill_construction_fkey" FOREIGN KEY ("construction") REFERENCES "nidoria"."Construction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."investigation_anthill" ADD CONSTRAINT "investigation_anthill_anthill_fkey" FOREIGN KEY ("anthill") REFERENCES "nidoria"."Anthill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."investigation_anthill" ADD CONSTRAINT "investigation_anthill_investigation_fkey" FOREIGN KEY ("investigation") REFERENCES "nidoria"."Investigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."ants_anthill" ADD CONSTRAINT "ants_anthill_ant_fkey" FOREIGN KEY ("ant") REFERENCES "nidoria"."Ant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."ants_anthill" ADD CONSTRAINT "ants_anthill_anthill_fkey" FOREIGN KEY ("anthill") REFERENCES "nidoria"."Anthill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."exploration" ADD CONSTRAINT "exploration_anthill_fkey" FOREIGN KEY ("anthill") REFERENCES "nidoria"."Anthill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."exploration" ADD CONSTRAINT "exploration_resource_type_fkey" FOREIGN KEY ("resource_type") REFERENCES "nidoria"."Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."resource_anthill" ADD CONSTRAINT "resource_anthill_anthill_fkey" FOREIGN KEY ("anthill") REFERENCES "nidoria"."Anthill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nidoria"."resource_anthill" ADD CONSTRAINT "resource_anthill_resource_fkey" FOREIGN KEY ("resource") REFERENCES "nidoria"."Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
