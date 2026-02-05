-- Add Stripe Connect columns to User table
-- Run this in your Supabase SQL Editor

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "stripeConnectId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeConnectOnboarded" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
