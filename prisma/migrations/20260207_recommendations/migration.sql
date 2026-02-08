-- CreateEnum
CREATE TYPE "RecommendationCategory" AS ENUM ('RECOVERY_PRODUCT', 'PT_PROVIDER', 'MASSAGE_THERAPY', 'MEDICAL_PROVIDER', 'APP_OR_TOOL', 'BOOK_OR_RESOURCE', 'OTHER');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "EndorsementSource" AS ENUM ('MANUAL', 'AI_EXTRACTED');

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" "RecommendationCategory" NOT NULL,
    "procedureType" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "url" TEXT,
    "priceRange" TEXT,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "endorsementCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationEndorsement" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "comment" TEXT,
    "recoveryPhase" TEXT,
    "source" "EndorsementSource" NOT NULL DEFAULT 'MANUAL',
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationVote" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_normalizedName_procedureType_key" ON "Recommendation"("normalizedName", "procedureType");

-- CreateIndex
CREATE INDEX "Recommendation_procedureType_status_idx" ON "Recommendation"("procedureType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationEndorsement_recommendationId_contributorId_key" ON "RecommendationEndorsement"("recommendationId", "contributorId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationVote_recommendationId_userId_key" ON "RecommendationVote"("recommendationId", "userId");

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationEndorsement" ADD CONSTRAINT "RecommendationEndorsement_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationEndorsement" ADD CONSTRAINT "RecommendationEndorsement_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationVote" ADD CONSTRAINT "RecommendationVote_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationVote" ADD CONSTRAINT "RecommendationVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';
