-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'DRAFT';
