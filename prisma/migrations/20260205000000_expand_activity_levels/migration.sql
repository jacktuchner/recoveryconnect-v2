-- Expand ActivityLevel enum from 4 options to 5 cleaner options
-- Old values: SEDENTARY, RECREATIONAL, COMPETITIVE_ATHLETE, PROFESSIONAL_ATHLETE
-- New values: SEDENTARY, LIGHTLY_ACTIVE, MODERATELY_ACTIVE, ACTIVE, ATHLETE

-- Add new enum values
ALTER TYPE "ActivityLevel" ADD VALUE IF NOT EXISTS 'LIGHTLY_ACTIVE';
ALTER TYPE "ActivityLevel" ADD VALUE IF NOT EXISTS 'MODERATELY_ACTIVE';
ALTER TYPE "ActivityLevel" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "ActivityLevel" ADD VALUE IF NOT EXISTS 'ATHLETE';

-- Migrate existing data in Profile table
UPDATE "Profile" SET "activityLevel" = 'MODERATELY_ACTIVE' WHERE "activityLevel" = 'RECREATIONAL';
UPDATE "Profile" SET "activityLevel" = 'ATHLETE' WHERE "activityLevel" IN ('COMPETITIVE_ATHLETE', 'PROFESSIONAL_ATHLETE');

-- Migrate existing data in Recording table
UPDATE "Recording" SET "activityLevel" = 'MODERATELY_ACTIVE' WHERE "activityLevel" = 'RECREATIONAL';
UPDATE "Recording" SET "activityLevel" = 'ATHLETE' WHERE "activityLevel" IN ('COMPETITIVE_ATHLETE', 'PROFESSIONAL_ATHLETE');
