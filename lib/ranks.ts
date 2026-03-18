// Rank system — elements of the periodic table as rank names

export interface Rank {
  name: string;
  symbol: string;        // element symbol shown in the rank badge
  minXp: number;         // XP required to reach this rank
  gradient: string;      // Tailwind gradient for the badge (used in RankUpCelebration)
  color: string;         // Hex accent color
}

export const RANKS: Rank[] = [
  { name: "Hydrogen",    symbol: "H",  minXp: 0,     gradient: "from-gray-400 to-gray-600",          color: "#9ca3af" },
  { name: "Helium",      symbol: "He", minXp: 200,   gradient: "from-sky-300 to-blue-500",            color: "#38bdf8" },
  { name: "Lithium",     symbol: "Li", minXp: 500,   gradient: "from-red-400 to-rose-600",            color: "#f87171" },
  { name: "Beryllium",   symbol: "Be", minXp: 1000,  gradient: "from-emerald-400 to-green-600",       color: "#34d399" },
  { name: "Boron",       symbol: "B",  minXp: 2000,  gradient: "from-amber-400 to-orange-600",        color: "#fbbf24" },
  { name: "Carbon",      symbol: "C",  minXp: 3500,  gradient: "from-violet-400 to-purple-700",       color: "#a78bfa" },
  { name: "Nitrogen",    symbol: "N",  minXp: 5500,  gradient: "from-cyan-400 to-teal-600",           color: "#22d3ee" },
  { name: "Oxygen",      symbol: "O",  minXp: 8000,  gradient: "from-yellow-400 via-orange-500 to-red-600", color: "#f59e0b" },
];

/** Get the rank for a given XP value */
export function getRank(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) current = rank;
    else break;
  }
  return current;
}

/** Get the next rank after the given XP (null if at max rank) */
export function getNextRank(xp: number): Rank | null {
  for (let i = 0; i < RANKS.length - 1; i++) {
    if (xp >= RANKS[i].minXp && xp < RANKS[i + 1].minXp) {
      return RANKS[i + 1];
    }
  }
  return null; // max rank
}

/** Progress (0–100) within the current rank toward the next */
export function getRankProgress(xp: number): number {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 100;
  const rangeSize = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return Math.min(100, Math.round((progress / rangeSize) * 100));
}

/** Check if gaining `gained` XP caused a rank-up */
export function checkRankUp(
  previousXp: number,
  newXp: number
): { didRankUp: boolean; previousRank: Rank; newRank: Rank } {
  const previousRank = getRank(previousXp);
  const newRank = getRank(newXp);
  return {
    didRankUp: newRank.name !== previousRank.name,
    previousRank,
    newRank,
  };
}

/** Format XP with commas (compatibility with rank-system.ts) */
export function formatXP(xp: number): string {
  return new Intl.NumberFormat().format(xp);
}

/** Get rank by XP (alias for getRank, compatibility with rank-system.ts) */
export function getRankByXP(xp: number): Rank {
  return getRank(xp);
}

/** Get comprehensive rank info (compatibility with rank-system.ts) */
export interface RankInfo {
  currentRank: Rank;
  nextRank: Rank | null;
  currentXP: number;
  xpProgress: number;
  xpToNextRank: number;
  isMaxRank: boolean;
}

export function getRankInfo(totalXP: number): RankInfo {
  const currentRank = getRank(totalXP);
  const nextRank = getNextRank(totalXP);
  const xpProgress = getRankProgress(totalXP);
  const xpToNextRank = nextRank ? nextRank.minXp - totalXP : 0;
  
  return {
    currentRank,
    nextRank,
    currentXP: totalXP,
    xpProgress,
    xpToNextRank,
    isMaxRank: nextRank === null,
  };
}
