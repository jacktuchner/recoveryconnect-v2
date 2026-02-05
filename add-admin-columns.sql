-- Add columns for admin dashboard functionality
-- Run this in your Supabase SQL Editor

-- Recording rejection reason
ALTER TABLE "Recording"
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Report review columns
ALTER TABLE "Report"
ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT,
ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();
