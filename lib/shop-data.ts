// Shop Item Definitions
// Categories: avatars, themes, powerups

export type ShopItemType = "avatar" | "theme" | "powerup";

export interface ShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  description: string;
  price: number;
  icon: string; // Lucide icon name or emoji
  rarity: "common" | "rare" | "epic" | "legendary";
  effect?: string; // For powerups: what it does
  color: string; // Gradient color for the card
}

// AVATARS - Character cosmetics
export const AVATARS: ShopItem[] = [
  {
    id: "avatar-alchemist",
    type: "avatar",
    name: "The Alchemist",
    description: "Master of transmutation. Glows with ancient knowledge.",
    price: 500,
    icon: "⚗️",
    rarity: "rare",
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: "avatar-lab-tech",
    type: "avatar",
    name: "Lab Technician",
    description: "Precision and safety first. The unsung hero of science.",
    price: 300,
    icon: "🥽",
    rarity: "common",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "avatar-quantum",
    type: "avatar",
    name: "Quantum Master",
    description: "Exists in multiple states simultaneously. Schrödinger's favorite.",
    price: 1000,
    icon: "⚛️",
    rarity: "epic",
    color: "from-indigo-500/20 to-purple-500/20",
  },
  {
    id: "avatar-mad-scientist",
    type: "avatar",
    name: "Mad Scientist",
    description: "It's ALIVE! Mwahaha! Unconventional but brilliant.",
    price: 750,
    icon: "🧪",
    rarity: "rare",
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: "avatar-cosmic",
    type: "avatar",
    name: "Cosmic Chemist",
    description: "Studies the chemistry of stars. Literally out of this world.",
    price: 1500,
    icon: "🌌",
    rarity: "legendary",
    color: "from-violet-500/20 to-fuchsia-500/20",
  },
  {
    id: "avatar-toxic",
    type: "avatar",
    name: "Toxic Handler",
    description: "Specializes in hazardous materials. Handle with care!",
    price: 600,
    icon: "☢️",
    rarity: "rare",
    color: "from-lime-500/20 to-green-500/20",
  },
];

// THEMES - UI color schemes
export const THEMES: ShopItem[] = [
  {
    id: "theme-neon",
    type: "theme",
    name: "Neon Lab",
    description: "High-energy cyberpunk aesthetic with glowing accents.",
    price: 800,
    icon: "💜",
    rarity: "epic",
    color: "from-fuchsia-500/30 to-cyan-500/30",
  },
  {
    id: "theme-space",
    type: "theme",
    name: "Deep Space",
    description: "Dark cosmic theme with stellar purples and blues.",
    price: 600,
    icon: "🌌",
    rarity: "rare",
    color: "from-indigo-900/40 to-purple-900/40",
  },
  {
    id: "theme-vintage",
    type: "theme",
    name: "Vintage Parchment",
    description: "Old-school chemistry with aged paper and sepia tones.",
    price: 400,
    icon: "📜",
    rarity: "common",
    color: "from-amber-600/20 to-orange-600/20",
  },
  {
    id: "theme-forest",
    type: "theme",
    name: "Bio Lab",
    description: "Organic chemistry theme with natural greens.",
    price: 500,
    icon: "🌿",
    rarity: "rare",
    color: "from-emerald-500/30 to-teal-500/30",
  },
  {
    id: "theme-molten",
    type: "theme",
    name: "Molten Core",
    description: "Thermodynamics-inspired with fiery reds and oranges.",
    price: 700,
    icon: "🔥",
    rarity: "epic",
    color: "from-red-600/30 to-orange-600/30",
  },
  {
    id: "theme-crystal",
    type: "theme",
    name: "Crystal Lattice",
    description: "Icy blue crystalline structure theme.",
    price: 900,
    icon: "💎",
    rarity: "epic",
    color: "from-cyan-400/30 to-blue-500/30",
  },
];

// POWER-UPS - Gameplay advantages
export const POWERUPS: ShopItem[] = [
  {
    id: "powerup-time",
    type: "powerup",
    name: "Time Dilator",
    description: "Adds +10 seconds to any quiz timer. Time is relative!",
    price: 150,
    icon: "⏰",
    rarity: "common",
    effect: "+10s timer",
    color: "from-yellow-500/20 to-amber-500/20",
  },
  {
    id: "powerup-xp",
    type: "powerup",
    name: "Double XP Boost",
    description: "Double XP for your next 5 games. Stack the gains!",
    price: 300,
    icon: "✨",
    rarity: "rare",
    effect: "2x XP (5 games)",
    color: "from-purple-500/20 to-violet-500/20",
  },
  {
    id: "powerup-streak",
    type: "powerup",
    name: "Streak Shield",
    description: "Protects your streak from one wrong answer.",
    price: 200,
    icon: "🛡️",
    rarity: "rare",
    effect: "Streak protection",
    color: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "powerup-hint",
    type: "powerup",
    name: "Atomic Insight",
    description: "Reveals one wrong answer. Eliminate the impossible!",
    price: 100,
    icon: "💡",
    rarity: "common",
    effect: "50/50 hint",
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: "powerup-coins",
    type: "powerup",
    name: "Coin Multiplier",
    description: "Earn 3x coins on your next game. Cha-ching!",
    price: 250,
    icon: "🪙",
    rarity: "rare",
    effect: "3x Coins (1 game)",
    color: "from-yellow-400/20 to-orange-400/20",
  },
  {
    id: "powerup-resurrection",
    type: "powerup",
    name: "Phoenix Down",
    description: "Continue a failed boss battle once. Rise from the ashes!",
    price: 500,
    icon: "🔥",
    rarity: "epic",
    effect: "Boss retry",
    color: "from-red-500/20 to-orange-500/20",
  },
];

// All items combined
export const ALL_ITEMS: ShopItem[] = [...AVATARS, ...THEMES, ...POWERUPS];

// Get item by ID
export function getItemById(id: string): ShopItem | undefined {
  return ALL_ITEMS.find((item) => item.id === id);
}

// Rarity colors for badges
export const RARITY_COLORS: Record<string, string> = {
  common: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  rare: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  legendary: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

// Rarity glow effects
export const RARITY_GLOW: Record<string, string> = {
  common: "",
  rare: "shadow-lg shadow-blue-500/20",
  epic: "shadow-lg shadow-purple-500/30",
  legendary: "shadow-xl shadow-yellow-500/40",
};
