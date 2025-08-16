-- CreateTable
CREATE TABLE "public"."RaidLog" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaidLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RaidLog_attackerId_createdAt_idx" ON "public"."RaidLog"("attackerId", "createdAt");

-- CreateIndex
CREATE INDEX "RaidLog_targetId_createdAt_idx" ON "public"."RaidLog"("targetId", "createdAt");
