-- Add reviewRequestSent column to Call table for tracking review request emails
-- Run this against Supabase before deploying the review-requests cron endpoint

ALTER TABLE "Call"
ADD COLUMN IF NOT EXISTS "reviewRequestSent" TIMESTAMP;
