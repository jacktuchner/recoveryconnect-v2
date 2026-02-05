-- Add timeSinceSurgery column to Recording table
-- Run this in your Supabase SQL Editor

ALTER TABLE "Recording"
ADD COLUMN IF NOT EXISTS "timeSinceSurgery" TEXT;
