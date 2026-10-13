-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'SHOWED', 'NO_SHOW', 'NOT_QUALIFIED', 'CLOSED', 'LOST');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('CALENDLY', 'DEMO');

-- CreateTable
CREATE TABLE "Rep" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "inviteeUri" TEXT NOT NULL,
    "previousInviteeUris" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventUri" TEXT NOT NULL,
    "eventTypeName" TEXT,
    "inviteeName" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "inviteePhone" TEXT,
    "inviteeTimeZone" TEXT,
    "hostEmail" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "locationType" TEXT,
    "joinUrl" TEXT,
    "rescheduleUrl" TEXT,
    "cancelUrl" TEXT,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "canceledBy" TEXT,
    "calendlyRaw" JSONB,
    "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
    "qualified" BOOLEAN,
    "qualifiedReason" TEXT,
    "notes" TEXT,
    "repId" TEXT,
    "source" "BookingSource" NOT NULL DEFAULT 'CALENDLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallAttempt" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered" BOOLEAN NOT NULL,
    "note" TEXT,
    "repId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rep_email_key" ON "Rep"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_inviteeUri_key" ON "Booking"("inviteeUri");

-- CreateIndex
CREATE INDEX "Booking_startTime_idx" ON "Booking"("startTime");

-- CreateIndex
CREATE INDEX "Booking_repId_idx" ON "Booking"("repId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "CallAttempt_bookingId_idx" ON "CallAttempt"("bookingId");

-- CreateIndex
CREATE INDEX "CallAttempt_attemptedAt_idx" ON "CallAttempt"("attemptedAt");

-- CreateIndex
CREATE INDEX "SyncRun_startedAt_idx" ON "SyncRun"("startedAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_repId_fkey" FOREIGN KEY ("repId") REFERENCES "Rep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttempt" ADD CONSTRAINT "CallAttempt_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttempt" ADD CONSTRAINT "CallAttempt_repId_fkey" FOREIGN KEY ("repId") REFERENCES "Rep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

