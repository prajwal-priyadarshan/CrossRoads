-- AlterEnum
ALTER TYPE "ReportTarget" ADD VALUE 'CONVERSATION';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSafeguardingCoordinator" BOOLEAN NOT NULL DEFAULT false;

