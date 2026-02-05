-- Add Recording Series feature and Contributor Intro Video

-- Create SeriesStatus enum
CREATE TYPE "SeriesStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Create RecordingSeries table
CREATE TABLE "RecordingSeries" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "procedureType" TEXT NOT NULL,
    "status" "SeriesStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordingSeries_pkey" PRIMARY KEY ("id")
);

-- Create SeriesRecording junction table
CREATE TABLE "SeriesRecording" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,

    CONSTRAINT "SeriesRecording_pkey" PRIMARY KEY ("id")
);

-- Create SeriesAccess table for tracking purchases
CREATE TABLE "SeriesAccess" (
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
CREATE INDEX "RecordingSeries_contributorId_status_idx" ON "RecordingSeries"("contributorId", "status");

-- Create unique constraints for SeriesRecording
CREATE UNIQUE INDEX "SeriesRecording_seriesId_recordingId_key" ON "SeriesRecording"("seriesId", "recordingId");
CREATE UNIQUE INDEX "SeriesRecording_seriesId_sequenceNumber_key" ON "SeriesRecording"("seriesId", "sequenceNumber");

-- Create unique constraints for SeriesAccess
CREATE UNIQUE INDEX "SeriesAccess_paymentId_key" ON "SeriesAccess"("paymentId");
CREATE UNIQUE INDEX "SeriesAccess_userId_seriesId_key" ON "SeriesAccess"("userId", "seriesId");

-- Add foreign keys
ALTER TABLE "RecordingSeries" ADD CONSTRAINT "RecordingSeries_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SeriesRecording" ADD CONSTRAINT "SeriesRecording_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RecordingSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeriesRecording" ADD CONSTRAINT "SeriesRecording_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SeriesAccess" ADD CONSTRAINT "SeriesAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeriesAccess" ADD CONSTRAINT "SeriesAccess_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RecordingSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeriesAccess" ADD CONSTRAINT "SeriesAccess_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
