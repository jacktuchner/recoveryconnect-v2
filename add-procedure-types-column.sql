-- Add procedureTypes array column to Profile table
-- Run this in your Supabase SQL Editor

ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "procedureTypes" TEXT[] DEFAULT '{}';

-- Migrate existing data: copy procedureType to procedureTypes array
UPDATE "Profile"
SET "procedureTypes" = ARRAY["procedureType"]
WHERE "procedureTypes" = '{}' OR "procedureTypes" IS NULL;
