-- Add display name and anonymity settings to User table
-- Run this in your Supabase SQL Editor
--
-- This enables users to control their privacy on the platform:
-- - showRealName: When TRUE (default), their real name is shown publicly
-- - displayName: An optional custom name shown when showRealName is FALSE
--
-- Admins always see real names for payment and moderation purposes.

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "displayName" TEXT,
ADD COLUMN IF NOT EXISTS "showRealName" BOOLEAN DEFAULT TRUE;

-- Optional: Add a comment to the columns
COMMENT ON COLUMN "User"."displayName" IS 'Custom display name when user chooses to be anonymous';
COMMENT ON COLUMN "User"."showRealName" IS 'Whether to show real name (TRUE) or display name (FALSE) publicly';
