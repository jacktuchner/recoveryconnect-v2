-- CreateTable
CREATE TABLE "RecommendationComment" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecommendationComment_recommendationId_createdAt_idx" ON "RecommendationComment"("recommendationId", "createdAt");

-- AddForeignKey
ALTER TABLE "RecommendationComment" ADD CONSTRAINT "RecommendationComment_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationComment" ADD CONSTRAINT "RecommendationComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';
