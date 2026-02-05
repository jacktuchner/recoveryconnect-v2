-- Recording Series Migration
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Create SeriesStatus enum
DO $$ BEGIN
  CREATE TYPE "SeriesStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create RecordingSeries table
CREATE TABLE IF NOT EXISTS "RecordingSeries" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "procedureType" TEXT NOT NULL,
    "status" "SeriesStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecordingSeries_pkey" PRIMARY KEY ("id")
);

-- Create SeriesRecording junction table
CREATE TABLE IF NOT EXISTS "SeriesRecording" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    CONSTRAINT "SeriesRecording_pkey" PRIMARY KEY ("id")
);

-- Create SeriesAccess table
CREATE TABLE IF NOT EXISTS "SeriesAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "paymentId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeriesAccess_pkey" PRIMARY KEY ("id")
);

-- Add intro video fields to Profile
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "introVideoUrl" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "introVideoDuration" INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS "RecordingSeries_contributorId_status_idx" ON "RecordingSeries"("contributorId", "status");

-- Create unique constraints
DO $$ BEGIN
  ALTER TABLE "SeriesRecording" ADD CONSTRAINT "SeriesRecording_seriesId_recordingId_key" UNIQUE ("seriesId", "recordingId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SeriesRecording" ADD CONSTRAINT "SeriesRecording_seriesId_sequenceNumber_key" UNIQUE ("seriesId", "sequenceNumber");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SeriesAccess" ADD CONSTRAINT "SeriesAccess_paymentId_key" UNIQUE ("paymentId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SeriesAccess" ADD CONSTRAINT "SeriesAccess_userId_seriesId_key" UNIQUE ("userId", "seriesId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign keys
DO $$ BEGIN
  ALTER TABLE "RecordingSeries" ADD CONSTRAINT "RecordingSeries_contributorId_fkey"
    FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SeriesRecording" ADD CONSTRAINT "SeriesRecording_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "RecordingSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SeriesRecording" ADD CONSTRAINT "SeriesRecording_recordingId_fkey"
    FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SeriesAccess" ADD CONSTRAINT "SeriesAccess_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SeriesAccess" ADD CONSTRAINT "SeriesAccess_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "RecordingSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SeriesAccess" ADD CONSTRAINT "SeriesAccess_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verify tables were created
SELECT 'RecordingSeries' as table_name, count(*) as row_count FROM "RecordingSeries"
UNION ALL
SELECT 'SeriesRecording', count(*) FROM "SeriesRecording"
UNION ALL
SELECT 'SeriesAccess', count(*) FROM "SeriesAccess";
