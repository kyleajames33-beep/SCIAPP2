import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Upgrade Configuration ───────────────────────────────────
// Kit Mode enterprise upgrades with costs and effects
const UPGRADES = {
  passive_income: {
    name: 'Money Tree',
    description: 'Earn coins passively between questions',
    baseCost: 100,
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: (level: number) => level * 5, // coins per question
  },
  streak_bonus: {
    name: 'Streak Enhancer',
    description: 'Increased multiplier for streaks',
    baseCost: 200,
    costMultiplier: 1.8,
    maxLevel: 5,
    effect: (level: number) => 1 + level * 0.1, // multiplier boost
  },
  coin_multiplier: {
    name: 'Gold Mine',
    description: 'Earn more coins per correct answer',
    baseCost: 150,
    costMultiplier: 1.6,
    maxLevel: 8,
    effect: (level: number) => 1 + level * 0.15, // coin multiplier
  },
  time_bonus: {
    name: 'Time Bank',
    description: 'Extra seconds per question',
    baseCost: 250,
    costMultiplier: 2.0,
    maxLevel: 5,
    effect: (level: number) => level * 2, // extra seconds
  },
  boss_damage: {
    name: 'Power Strike',
    description: 'Deal more damage to bosses',
    baseCost: 300,
    costMultiplier: 1.7,
    maxLevel: 10,
    effect: (level: number) => 1 + level * 0.2, // damage multiplier
  },
} as const;

type UpgradeId = keyof typeof UPGRADES;

function getUpgradeCost(upgradeId: UpgradeId, currentLevel: number): number {
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

// ─── Boss Configuration ──────────────────────────────────────
const BOSS_CONFIG = {
  baseDamage: 50,
  streakDamageBonus: 10, // per streak count
  correctAnswerDamage: 100,
  incorrectAnswerDamage: 25,
};

// ─── Tower Configuration ─────────────────────────────────────
const TOWER_CONFIG = {
  gemsPerFloor: 5,
  bonusGemsAt: [5, 10, 15, 20, 25], // milestone floors
  milestoneBonus: 25,
};

// ─── Action Types ────────────────────────────────────────────
type ActionType = 'BUY_UPGRADE' | 'BOSS_DAMAGE' | 'COLLECT_GEMS' | 'PRESTIGE';

interface BuyUpgradePayload {
  userId: string;
  upgradeId: UpgradeId;
}

interface BossDamagePayload {
  sessionId: string;
  isCorrect: boolean;
  streak: number;
  userId?: string; // for upgrade bonuses
}

interface CollectGemsPayload {
  userId: string;
  floorReached: number;
}

interface PrestigePayload {
  userId: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body as { action: ActionType; payload: unknown };

    switch (action) {
      case 'BUY_UPGRADE':
        return handleBuyUpgrade(payload as BuyUpgradePayload);
      case 'BOSS_DAMAGE':
        return handleBossDamage(payload as BossDamagePayload);
      case 'COLLECT_GEMS':
        return handleCollectGems(payload as CollectGemsPayload);
      case 'PRESTIGE':
        return handlePrestige(payload as PrestigePayload);
      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Game action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── BUY_UPGRADE Handler ─────────────────────────────────────
async function handleBuyUpgrade(payload: BuyUpgradePayload) {
  const { userId, upgradeId } = payload;

  if (!userId || !upgradeId) {
    return NextResponse.json(
      { error: 'Missing userId or upgradeId' },
      { status: 400 }
    );
  }

  const upgradeConfig = UPGRADES[upgradeId];
  if (!upgradeConfig) {
    return NextResponse.json(
      { error: 'Invalid upgrade ID' },
      { status: 400 }
    );
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get user and current upgrade level
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        upgrades: {
          where: { upgradeId },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentUpgrade = user.upgrades[0];
    const currentLevel = currentUpgrade?.level ?? 0;
    const cost = getUpgradeCost(upgradeId, currentLevel);

    // Check max level
    if (currentLevel >= upgradeConfig.maxLevel) {
      throw new Error('Upgrade already at max level');
    }

    // Check if user has enough coins
    if (user.totalCoins < cost) {
      throw new Error('Insufficient coins');
    }

    // Deduct coins
    await tx.user.update({
      where: { id: userId },
      data: { totalCoins: { decrement: cost } },
    });

    // Upsert the upgrade
    const newLevel = currentLevel + 1;
    const upgrade = await tx.userUpgrade.upsert({
      where: {
        userId_upgradeId: { userId, upgradeId },
      },
      create: {
        userId,
        upgradeId,
        level: 1,
      },
      update: {
        level: newLevel,
      },
    });

    return {
      upgrade,
      newLevel,
      coinsSpent: cost,
      remainingCoins: user.totalCoins - cost,
      nextLevelCost: newLevel < upgradeConfig.maxLevel 
        ? getUpgradeCost(upgradeId, newLevel) 
        : null,
      effect: upgradeConfig.effect(newLevel),
    };
  });

  return NextResponse.json({
    success: true,
    ...result,
  });
}

// ─── BOSS_DAMAGE Handler ─────────────────────────────────────
async function handleBossDamage(payload: BossDamagePayload) {
  const { sessionId, isCorrect, streak, userId } = payload;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId' },
      { status: 400 }
    );
  }

  // Get upgrade bonus if user is logged in
  let damageMultiplier = 1;
  if (userId) {
    const upgrade = await prisma.userUpgrade.findUnique({
      where: { userId_upgradeId: { userId, upgradeId: 'boss_damage' } },
    });
    if (upgrade) {
      damageMultiplier = UPGRADES.boss_damage.effect(upgrade.level);
    }
  }

  // Calculate damage
  let baseDamage = isCorrect 
    ? BOSS_CONFIG.correctAnswerDamage 
    : BOSS_CONFIG.incorrectAnswerDamage;
  
  // Streak bonus for correct answers
  if (isCorrect && streak > 0) {
    baseDamage += streak * BOSS_CONFIG.streakDamageBonus;
  }

  const totalDamage = Math.floor(baseDamage * damageMultiplier);

  // Update boss HP atomically
  const session = await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      bossHp: {
        decrement: totalDamage,
      },
    },
    select: {
      bossHp: true,
      bossMaxHp: true,
    },
  });

  // Check if boss is defeated
  const bossDefeated = (session.bossHp ?? 0) <= 0;

  // Ensure HP doesn't go below 0
  if (bossDefeated && session.bossHp !== null && session.bossHp < 0) {
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { bossHp: 0 },
    });
  }

  return NextResponse.json({
    success: true,
    damage: totalDamage,
    damageMultiplier,
    bossHp: Math.max(0, session.bossHp ?? 0),
    bossMaxHp: session.bossMaxHp,
    bossDefeated,
  });
}

// ─── COLLECT_GEMS Handler ────────────────────────────────────
async function handleCollectGems(payload: CollectGemsPayload) {
  const { userId, floorReached } = payload;

  if (!userId || floorReached === undefined) {
    return NextResponse.json(
      { error: 'Missing userId or floorReached' },
      { status: 400 }
    );
  }

  // Calculate gems earned
  let gemsEarned = floorReached * TOWER_CONFIG.gemsPerFloor;
  
  // Add milestone bonuses
  const milestonesReached = TOWER_CONFIG.bonusGemsAt.filter(m => floorReached >= m);
  gemsEarned += milestonesReached.length * TOWER_CONFIG.milestoneBonus;

  // Update user gems atomically
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      gems: { increment: gemsEarned },
    },
    select: {
      gems: true,
    },
  });

  return NextResponse.json({
    success: true,
    gemsEarned,
    totalGems: user.gems,
    milestonesReached,
  });
}

// ─── PRESTIGE Handler ────────────────────────────────────────
async function handlePrestige(payload: PrestigePayload) {
  const { userId } = payload;

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    );
  }

  const PRESTIGE_REQUIREMENT = 100000;

  const result = await prisma.$transaction(async (tx) => {
    // Get user
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { upgrades: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user meets requirement
    if (user.lifetimeEarnings < PRESTIGE_REQUIREMENT) {
      throw new Error(`Need ${PRESTIGE_REQUIREMENT} lifetime coins to prestige`);
    }

    // Calculate new prestige level
    const newPrestigeLevel = user.prestigeLevel + 1;

    // Reset user progress
    await tx.user.update({
      where: { id: userId },
      data: {
        totalCoins: 0,
        prestigeLevel: newPrestigeLevel,
        // Keep lifetimeEarnings as is (it's cumulative)
      },
    });

    // Delete all upgrades
    await tx.userUpgrade.deleteMany({
      where: { userId },
    });

    return {
      prestigeLevel: newPrestigeLevel,
      lifetimeEarnings: user.lifetimeEarnings,
      coinMultiplier: 1 + newPrestigeLevel * 0.1,
    };
  });

  return NextResponse.json({
    success: true,
    ...result,
  });
}

// ─── GET: Retrieve upgrade config and user upgrades ──────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // Return upgrade configuration
  const upgradeConfig = Object.entries(UPGRADES).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    baseCost: config.baseCost,
    maxLevel: config.maxLevel,
  }));

  // If userId provided, include their current levels
  let userUpgrades: Record<string, number> = {};
  if (userId) {
    const upgrades = await prisma.userUpgrade.findMany({
      where: { userId },
    });
    userUpgrades = upgrades.reduce((acc, u) => {
      acc[u.upgradeId] = u.level;
      return acc;
    }, {} as Record<string, number>);
  }

  return NextResponse.json({
    upgrades: upgradeConfig,
    userUpgrades,
    bossConfig: BOSS_CONFIG,
    towerConfig: TOWER_CONFIG,
  });
}
