-- Add contributorStatus to User table
ALTER TABLE "User" ADD COLUMN "contributorStatus" TEXT;

-- Backfill existing contributors as APPROVED so they aren't locked out
UPDATE "User" SET "contributorStatus" = 'APPROVED' WHERE role IN ('CONTRIBUTOR', 'BOTH');

-- Create ContributorApplication table
CREATE TABLE "ContributorApplication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "applicationText" TEXT NOT NULL,
  "proofUrls" JSONB NOT NULL DEFAULT '[]',
  "preferredContact" TEXT NOT NULL,
  "zoomCompleted" BOOLEAN NOT NULL DEFAULT false,
  "reviewNote" TEXT,
  "reviewedById" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContributorApplication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContributorApplication_userId_key" UNIQUE ("userId")
);

-- Add index for status filtering
CREATE INDEX "ContributorApplication_status_idx" ON "ContributorApplication" ("status");
