-- AlterTable
ALTER TABLE "nidoria"."User" ADD COLUMN     "refesh_token" TEXT,
ALTER COLUMN "token" DROP NOT NULL;
