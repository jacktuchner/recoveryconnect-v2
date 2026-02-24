-- Community Forum tables

CREATE TABLE "ForumThread" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "threadType" TEXT NOT NULL DEFAULT 'DISCUSSION',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ForumReply" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumReply_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ForumThread_procedureType_createdAt_idx" ON "ForumThread"("procedureType", "createdAt");
CREATE INDEX "ForumThread_procedureType_lastReplyAt_idx" ON "ForumThread"("procedureType", "lastReplyAt");
CREATE INDEX "ForumReply_threadId_createdAt_idx" ON "ForumReply"("threadId", "createdAt");

-- Foreign keys
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
