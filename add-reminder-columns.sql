-- Add reminder tracking columns to Call table
-- Run this in your Supabase SQL Editor

ALTER TABLE "Call"
ADD COLUMN IF NOT EXISTS "dayReminderSent" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "hourReminderSent" TIMESTAMP;
