-- PeerHeal Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/uindledccnosavkwyeft/sql

-- Create ENUMs
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'CONTRIBUTOR', 'BOTH', 'ADMIN');
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'RECREATIONAL', 'COMPETITIVE_ATHLETE', 'PROFESSIONAL_ATHLETE');
CREATE TYPE "RecordingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED');
CREATE TYPE "RecordingCategory" AS ENUM ('WEEKLY_TIMELINE', 'WISH_I_KNEW', 'PRACTICAL_TIPS', 'MENTAL_HEALTH', 'RETURN_TO_ACTIVITY', 'MISTAKES_AND_LESSONS');
CREATE TYPE "TranscriptionStatus" AS ENUM ('NONE', 'PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "CallStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "PaymentType" AS ENUM ('RECORDING_PURCHASE', 'CALL_PAYMENT', 'CONTRIBUTOR_PAYOUT', 'SUBSCRIPTION');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- User table
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT UNIQUE,
  "emailVerified" TIMESTAMP,
  "image" TEXT,
  "passwordHash" TEXT,
  "role" "UserRole" DEFAULT 'PATIENT',
  "bio" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Account table (for OAuth - not used but keeping for compatibility)
CREATE TABLE "Account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  UNIQUE("provider", "providerAccountId")
);

-- Session table
CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires" TIMESTAMP NOT NULL
);

-- VerificationToken table
CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  UNIQUE("identifier", "token")
);

-- Profile table
CREATE TABLE "Profile" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "procedureType" TEXT NOT NULL,
  "procedureDetails" TEXT,
  "ageRange" TEXT NOT NULL,
  "activityLevel" "ActivityLevel" NOT NULL,
  "recoveryGoals" TEXT[] DEFAULT '{}',
  "timeSinceSurgery" TEXT,
  "surgeryDate" TIMESTAMP,
  "complicatingFactors" TEXT[] DEFAULT '{}',
  "lifestyleContext" TEXT[] DEFAULT '{}',
  "hourlyRate" DOUBLE PRECISION,
  "isAvailableForCalls" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- FaqPrompt table
CREATE TABLE "FaqPrompt" (
  "id" TEXT PRIMARY KEY,
  "question" TEXT NOT NULL,
  "category" "RecordingCategory" NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Recording table
CREATE TABLE "Recording" (
  "id" TEXT PRIMARY KEY,
  "contributorId" TEXT NOT NULL REFERENCES "User"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "RecordingCategory" NOT NULL,
  "mediaUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "durationSeconds" INTEGER,
  "isVideo" BOOLEAN DEFAULT FALSE,
  "faqPromptId" TEXT REFERENCES "FaqPrompt"("id"),
  "transcription" TEXT,
  "transcriptionStatus" "TranscriptionStatus" DEFAULT 'NONE',
  "procedureType" TEXT NOT NULL,
  "ageRange" TEXT NOT NULL,
  "activityLevel" "ActivityLevel" NOT NULL,
  "recoveryGoals" TEXT[] DEFAULT '{}',
  "status" "RecordingStatus" DEFAULT 'DRAFT',
  "viewCount" INTEGER DEFAULT 0,
  "price" DOUBLE PRECISION DEFAULT 9.99,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Availability table
CREATE TABLE "Availability" (
  "id" TEXT PRIMARY KEY,
  "contributorId" TEXT NOT NULL REFERENCES "User"("id"),
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "timezone" TEXT DEFAULT 'America/New_York',
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Call table
CREATE TABLE "Call" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL REFERENCES "User"("id"),
  "contributorId" TEXT NOT NULL REFERENCES "User"("id"),
  "scheduledAt" TIMESTAMP NOT NULL,
  "durationMinutes" INTEGER DEFAULT 30,
  "status" "CallStatus" DEFAULT 'REQUESTED',
  "videoRoomUrl" TEXT,
  "questionsInAdvance" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "platformFee" DOUBLE PRECISION NOT NULL,
  "contributorPayout" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Review table
CREATE TABLE "Review" (
  "id" TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL REFERENCES "User"("id"),
  "subjectId" TEXT NOT NULL REFERENCES "User"("id"),
  "recordingId" TEXT REFERENCES "Recording"("id"),
  "callId" TEXT REFERENCES "Call"("id"),
  "rating" INTEGER NOT NULL,
  "matchRelevance" INTEGER,
  "helpfulness" INTEGER,
  "comment" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Payment table
CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "type" "PaymentType" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT DEFAULT 'usd',
  "status" "PaymentStatus" DEFAULT 'PENDING',
  "stripePaymentId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX "Recording_procedureType_idx" ON "Recording"("procedureType");
CREATE INDEX "Recording_status_idx" ON "Recording"("status");
CREATE INDEX "Recording_faqPromptId_idx" ON "Recording"("faqPromptId");
CREATE INDEX "Call_contributorId_scheduledAt_idx" ON "Call"("contributorId", "scheduledAt");
CREATE INDEX "Call_patientId_idx" ON "Call"("patientId");

-- Enable Row Level Security (optional but recommended)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recording" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Call" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FaqPrompt" ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Service role has full access to User" ON "User" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Profile" ON "Profile" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Recording" ON "Recording" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Call" ON "Call" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Review" ON "Review" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Payment" ON "Payment" FOR ALL USING (true);
CREATE POLICY "Service role has full access to Availability" ON "Availability" FOR ALL USING (true);
CREATE POLICY "Service role has full access to FaqPrompt" ON "FaqPrompt" FOR ALL USING (true);
