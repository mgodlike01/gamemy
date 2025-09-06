-- CreateTable
CREATE TABLE "public"."UpgradeType" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "baseCost" INTEGER NOT NULL,
    "costK" DOUBLE PRECISION NOT NULL DEFAULT 1.35,
    "valuePerLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "maxLevel" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UpgradeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserUpgrade" (
    "userId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "UserUpgrade_pkey" PRIMARY KEY ("userId","typeId")
);

-- AddForeignKey
ALTER TABLE "public"."UserUpgrade" ADD CONSTRAINT "UserUpgrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserUpgrade" ADD CONSTRAINT "UserUpgrade_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."UpgradeType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
