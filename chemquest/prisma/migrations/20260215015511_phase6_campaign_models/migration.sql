-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessories" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "campaignXp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ownedItems" TEXT[] DEFAULT ARRAY['red', 'hammer', 'strong']::TEXT[],
ADD COLUMN     "rank" TEXT NOT NULL DEFAULT 'Hydrogen',
ADD COLUMN     "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
ALTER COLUMN "bodyType" SET DEFAULT 'strong',
ALTER COLUMN "hairColor" SET DEFAULT 'red',
ALTER COLUMN "weaponType" SET DEFAULT 'hammer';

-- CreateTable
CREATE TABLE "CampaignProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chamberId" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BossAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "defeated" BOOLEAN NOT NULL DEFAULT false,
    "damageDealt" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BossAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignProgress_userId_idx" ON "CampaignProgress"("userId");

-- CreateIndex
CREATE INDEX "CampaignProgress_worldId_idx" ON "CampaignProgress"("worldId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignProgress_userId_chamberId_key" ON "CampaignProgress"("userId", "chamberId");

-- CreateIndex
CREATE INDEX "BossAttempt_userId_idx" ON "BossAttempt"("userId");

-- CreateIndex
CREATE INDEX "BossAttempt_bossId_idx" ON "BossAttempt"("bossId");

-- AddForeignKey
ALTER TABLE "CampaignProgress" ADD CONSTRAINT "CampaignProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BossAttempt" ADD CONSTRAINT "BossAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
