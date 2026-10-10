-- Baseline: this column already existed in the database before migration history was tracked.
-- IF NOT EXISTS keeps it a no-op on the live database, and creates it on a fresh one.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
