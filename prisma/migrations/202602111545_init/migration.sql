-- CreateEnum
CREATE TYPE "SurfaceType" AS ENUM ('plaster', 'vinyl', 'fiberglass', 'other');
CREATE TYPE "SanitizerType" AS ENUM ('chlorine', 'salt', 'bromine', 'other');
CREATE TYPE "PlanSource" AS ENUM ('calculator', 'llm');
CREATE TYPE "Confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");

CREATE TABLE "Pool" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "volumeGallons" INTEGER NOT NULL,
  "surfaceType" "SurfaceType" NOT NULL,
  "sanitizerType" "SanitizerType" NOT NULL,
  "isSalt" BOOLEAN NOT NULL DEFAULT false,
  "equipmentNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pool_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Pool_customerId_idx" ON "Pool"("customerId");

CREATE TABLE "WaterTest" (
  "id" TEXT PRIMARY KEY,
  "poolId" TEXT NOT NULL,
  "testedAt" TIMESTAMP(3) NOT NULL,
  "fc" DOUBLE PRECISION,
  "cc" DOUBLE PRECISION,
  "ph" DOUBLE PRECISION,
  "ta" DOUBLE PRECISION,
  "ch" DOUBLE PRECISION,
  "cya" DOUBLE PRECISION,
  "salt" DOUBLE PRECISION,
  "tempF" DOUBLE PRECISION,
  "symptoms" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WaterTest_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "WaterTest_poolId_testedAt_idx" ON "WaterTest"("poolId", "testedAt" DESC);

CREATE TABLE "TreatmentPlan" (
  "id" TEXT PRIMARY KEY,
  "poolId" TEXT NOT NULL,
  "waterTestId" TEXT,
  "source" "PlanSource" NOT NULL,
  "diagnosis" TEXT NOT NULL,
  "confidence" "Confidence" NOT NULL,
  "steps" JSONB NOT NULL,
  "chemicalAdditions" JSONB NOT NULL,
  "safetyNotes" JSONB NOT NULL,
  "retestInHours" INTEGER,
  "whenToCallPro" JSONB NOT NULL,
  "conversationSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TreatmentPlan_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TreatmentPlan_waterTestId_fkey" FOREIGN KEY ("waterTestId") REFERENCES "WaterTest"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "TreatmentPlan_poolId_createdAt_idx" ON "TreatmentPlan"("poolId", "createdAt" DESC);
