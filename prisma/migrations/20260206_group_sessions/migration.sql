-- Add GROUP_SESSION_PAYMENT to PaymentType enum
ALTER TYPE "PaymentType" ADD VALUE IF NOT EXISTS 'GROUP_SESSION_PAYMENT';

-- Create GroupSessionStatus enum
DO $$ BEGIN
    CREATE TYPE "GroupSessionStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create GroupSession table
CREATE TABLE IF NOT EXISTS "GroupSession" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "procedureType" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxCapacity" INTEGER NOT NULL,
    "minAttendees" INTEGER NOT NULL DEFAULT 3,
    "pricePerPerson" DOUBLE PRECISION NOT NULL,
    "status" "GroupSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "videoRoomUrl" TEXT,
    "freeForSubscribers" BOOLEAN NOT NULL DEFAULT true,
    "dayReminderSent" TIMESTAMP(3),
    "hourReminderSent" TIMESTAMP(3),
    "minimumCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupSession_pkey" PRIMARY KEY ("id")
);

-- Create GroupSessionParticipant table
CREATE TABLE IF NOT EXISTS "GroupSessionParticipant" (
    "id" TEXT NOT NULL,
    "groupSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pricePaid" DOUBLE PRECISION NOT NULL,
    "wasSubscriber" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "stripeSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupSessionParticipant_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "GroupSession_procedureType_status_idx" ON "GroupSession"("procedureType", "status");
CREATE INDEX IF NOT EXISTS "GroupSession_contributorId_idx" ON "GroupSession"("contributorId");
CREATE INDEX IF NOT EXISTS "GroupSession_scheduledAt_status_idx" ON "GroupSession"("scheduledAt", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "GroupSessionParticipant_groupSessionId_userId_key" ON "GroupSessionParticipant"("groupSessionId", "userId");
CREATE INDEX IF NOT EXISTS "GroupSessionParticipant_userId_idx" ON "GroupSessionParticipant"("userId");

-- Add foreign keys
ALTER TABLE "GroupSession" ADD CONSTRAINT "GroupSession_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupSessionParticipant" ADD CONSTRAINT "GroupSessionParticipant_groupSessionId_fkey" FOREIGN KEY ("groupSessionId") REFERENCES "GroupSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupSessionParticipant" ADD CONSTRAINT "GroupSessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
