-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "raidEnergy" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "raidEnergyUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Raid_attackerId_idx" ON "public"."Raid"("attackerId");

-- CreateIndex
CREATE INDEX "Raid_defenderId_idx" ON "public"."Raid"("defenderId");
