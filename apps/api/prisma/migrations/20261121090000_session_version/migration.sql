-- Session revocation (13.3): the JWT carries this as `ver`; incrementing it invalidates every existing session.
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;
