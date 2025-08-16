-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "tgId" TEXT NOT NULL,
    "username" TEXT,
    "power" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MineState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ratePerHour" INTEGER NOT NULL DEFAULT 100,
    "buffer" INTEGER NOT NULL DEFAULT 0,
    "bufferCap" INTEGER NOT NULL DEFAULT 1000,
    "warehouse" INTEGER NOT NULL DEFAULT 0,
    "shieldUntil" TIMESTAMP(3),
    "drillLvl" INTEGER NOT NULL DEFAULT 1,
    "shiftLvl" INTEGER NOT NULL DEFAULT 1,
    "storageLvl" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MineState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Raid" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "stolen" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT NOT NULL,
    "log" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Raid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_tgId_key" ON "public"."User"("tgId");

-- CreateIndex
CREATE UNIQUE INDEX "MineState_userId_key" ON "public"."MineState"("userId");

-- AddForeignKey
ALTER TABLE "public"."MineState" ADD CONSTRAINT "MineState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
