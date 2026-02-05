-- Add active procedure tracking to Profile
-- Run this in your Supabase SQL Editor

ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "activeProcedureType" TEXT;

-- Set default active procedure to the first one in procedureTypes or procedureType
UPDATE "Profile"
SET "activeProcedureType" = COALESCE(
  "procedureTypes"[1],
  "procedureType"
)
WHERE "activeProcedureType" IS NULL;

COMMENT ON COLUMN "Profile"."activeProcedureType" IS 'The currently active procedure for matching purposes';
