// Rank System for ChemQuest
// 10 element-based ranks with XP scaling

export interface Rank {
  id: number;
  name: string;
  element: string;
  symbol: string;
  minXP: number;
  maxXP: number;
  color: string;
  gradient: string;
  badge: string;
}

export const RANKS: Rank[] = [
  {
    id: 1,
    name: "Hydrogen",
    element: "H",
    symbol: "H",
    minXP: 0,
    maxXP: 100,
    color: "#E8E8E8",
    gradient: "from-gray-200 to-gray-400",
    badge: "⚪"
  },
  {
    id: 2,
    name: "Carbon",
    element: "C",
    symbol: "C",
    minXP: 100,
    maxXP: 300,
    color: "#4A4A4A",
    gradient: "from-gray-600 to-gray-800",
    badge: "⚫"
  },
  {
    id: 3,
    name: "Nitrogen",
    element: "N",
    symbol: "N",
    minXP: 300,
    maxXP: 600,
    color: "#3B82F6",
    gradient: "from-blue-400 to-blue-600",
    badge: "🔵"
  },
  {
    id: 4,
    name: "Oxygen",
    element: "O",
    symbol: "O",
    minXP: 600,
    maxXP: 1000,
    color: "#EF4444",
    gradient: "from-red-400 to-red-600",
    badge: "🔴"
  },
  {
    id: 5,
    name: "Sodium",
    element: "Na",
    symbol: "Na",
    minXP: 1000,
    maxXP: 1500,
    color: "#F59E0B",
    gradient: "from-yellow-400 to-orange-500",
    badge: "🟠"
  },
  {
    id: 6,
    name: "Iron",
    element: "Fe",
    symbol: "Fe",
    minXP: 1500,
    maxXP: 2200,
    color: "#78716C",
    gradient: "from-stone-500 to-stone-700",
    badge: "🪨"
  },
  {
    id: 7,
    name: "Copper",
    element: "Cu",
    symbol: "Cu",
    minXP: 2200,
    maxXP: 3000,
    color: "#B87333",
    gradient: "from-orange-600 to-amber-700",
    badge: "🟤"
  },
  {
    id: 8,
    name: "Silver",
    element: "Ag",
    symbol: "Ag",
    minXP: 3000,
    maxXP: 4000,
    color: "#C0C0C0",
    gradient: "from-slate-300 to-slate-500",
    badge: "🥈"
  },
  {
    id: 9,
    name: "Gold",
    element: "Au",
    symbol: "Au",
    minXP: 4000,
    maxXP: 5500,
    color: "#FFD700",
    gradient: "from-yellow-300 to-yellow-500",
    badge: "🥇"
  },
  {
    id: 10,
    name: "Platinum",
    element: "Pt",
    symbol: "Pt",
    minXP: 5500,
    maxXP: Infinity,
    color: "#E5E4E2",
    gradient: "from-slate-200 via-white to-slate-300",
    badge: "💎"
  }
];

export interface RankInfo {
  currentRank: Rank;
  nextRank: Rank | null;
  currentXP: number;
  xpToNextRank: number;
  xpProgress: number; // 0-100 percentage
  isMaxRank: boolean;
}

export interface RankUpResult {
  didRankUp: boolean;
  previousRank: Rank;
  newRank: Rank;
  xpGained: number;
}

/**
 * Get rank by XP amount
 */
export function getRankByXP(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

/**
 * Get rank by ID
 */
export function getRankById(id: number): Rank | undefined {
  return RANKS.find(r => r.id === id);
}

/**
 * Get complete rank information for a user
 */
export function getRankInfo(totalXP: number): RankInfo {
  const currentRank = getRankByXP(totalXP);
  const nextRank = currentRank.id < RANKS.length ? RANKS[currentRank.id] : null;
  const isMaxRank = nextRank === null;
  
  const xpInCurrentRank = totalXP - currentRank.minXP;
  const xpRequiredForNextRank = isMaxRank ? 0 : nextRank!.minXP - currentRank.minXP;
  const xpToNextRank = isMaxRank ? 0 : nextRank!.minXP - totalXP;
  const xpProgress = isMaxRank ? 100 : Math.min(100, (xpInCurrentRank / xpRequiredForNextRank) * 100);

  return {
    currentRank,
    nextRank,
    currentXP: totalXP,
    xpToNextRank,
    xpProgress,
    isMaxRank
  };
}

/**
 * Calculate XP reward based on boss difficulty and performance
 */
export function calculateBossXP(
  baseDamage: number,
  bossLevel: number,
  streak: number,
  timeBonus: number = 0
): number {
  const baseXP = Math.floor(baseDamage * 0.5);
  const levelMultiplier = 1 + (bossLevel * 0.1);
  const streakBonus = Math.floor(streak * 2);
  const timeBonusXP = Math.floor(timeBonus * 0.1);
  
  return Math.floor((baseXP * levelMultiplier) + streakBonus + timeBonusXP);
}

/**
 * Check if user ranked up after gaining XP
 */
export function checkRankUp(previousXP: number, newXP: number): RankUpResult {
  const previousRank = getRankByXP(previousXP);
  const newRank = getRankByXP(newXP);
  
  return {
    didRankUp: newRank.id > previousRank.id,
    previousRank,
    newRank,
    xpGained: newXP - previousXP
  };
}

/**
 * Get XP required to reach a specific rank
 */
export function getXPForRank(rankId: number): number {
  const rank = getRankById(rankId);
  return rank ? rank.minXP : 0;
}

/**
 * Format XP display
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}
