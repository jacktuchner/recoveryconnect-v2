-- Expand ActivityLevel enum from 4 options to 5 cleaner options
-- Old values: SEDENTARY, RECREATIONAL, COMPETITIVE_ATHLETE, PROFESSIONAL_ATHLETE
-- New values: SEDENTARY, LIGHTLY_ACTIVE, MODERATELY_ACTIVE, ACTIVE, ATHLETE

-- Add new enum values (these cannot be used until committed, so we add all first)
ALTER TYPE "ActivityLevel" ADD VALUE IF NOT EXISTS 'LIGHTLY_ACTIVE';
ALTER TYPE "ActivityLevel" ADD VALUE IF NOT EXISTS 'MODERATELY_ACTIVE';
ALTER TYPE "ActivityLevel" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "ActivityLevel" ADD VALUE IF NOT EXISTS 'ATHLETE';

-- NOTE: Data migration from old values (RECREATIONAL -> MODERATELY_ACTIVE, etc.)
-- must be done in a separate transaction/migration after these new values are committed.
-- This is a PostgreSQL limitation: new enum values cannot be used until the transaction
-- that added them is committed.
