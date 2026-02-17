/**
 * Boss ID Mapping Layer
 * 
 * Maps campaign boss IDs (from campaign.json/world data) to real boss IDs (from bosses.json).
 * This allows the campaign to reference bosses by thematic names while using the actual
 * boss data from the bosses.json file.
 */

import { toast } from "sonner";

// Real boss IDs available in bosses.json
export type RealBossId = 
  | "acid-baron"
  | "redox-reaper"
  | "organic-overlord"
  | "thermo-titan"
  | "equilibrium-emperor"
  | "kinetic-king"
  | "atomic-archmage"
  | "solution-sovereign"
  | "chemical-overlord";

// Campaign boss IDs used in the campaign/world data
export type CampaignBossId =
  | "acid-baron"
  | "mole-master"
  | "reaction-king"
  | "thermo-lord"
  | "equilibrium-master"
  | "kinetic-emperor"
  | "atomic-warlock"
  | "solution-tyrant"
  | "chemical-overlord";

/**
 * Mapping from campaign boss IDs to real boss IDs
 * 
 * Module 1: Properties & Structure → Acid Baron (acid-base chemistry)
 * Module 2: Quantitative Chemistry → Solution Sovereign (concentration/molarity)
 * Module 3: Reactive Chemistry → Redox Reaper (reaction types, redox)
 * Module 4: Thermodynamics → Thermo Titan (energy changes)
 * Module 5: Equilibrium → Equilibrium Emperor (Le Chatelier)
 * Module 6: Kinetics → Kinetic King (reaction rates)
 * Module 7: Atomic Structure → Atomic Archmage (electron configs)
 * Module 8: Solutions → Organic Overlord (as filler, or could be Solution Sovereign)
 */
const BOSS_ID_MAPPING: Record<CampaignBossId, RealBossId> = {
  // Module 1: Properties & Structure of Matter → Acid-Base chemistry
  "acid-baron": "acid-baron",
  
  // Module 2: Quantitative Chemistry → Solutions/Concentration
  "mole-master": "solution-sovereign",
  
  // Module 3: Reactive Chemistry → Redox reactions
  "reaction-king": "redox-reaper",
  
  // Module 4: Thermodynamics → Thermodynamics
  "thermo-lord": "thermo-titan",
  
  // Module 5: Equilibrium → Chemical Equilibrium
  "equilibrium-master": "equilibrium-emperor",
  
  // Module 6: Kinetics → Reaction Kinetics
  "kinetic-emperor": "kinetic-king",
  
  // Module 7: Atomic Structure → Atomic Structure & Periodicity
  "atomic-warlock": "atomic-archmage",
  
  // Module 8: Organic Chemistry → Organic Chemistry
  "solution-tyrant": "organic-overlord",
  
  // World 9: Final Challenge → Chemical Overlord
  "chemical-overlord": "chemical-overlord",
};

/**
 * Set of all valid real boss IDs from bosses.json
 */
export const VALID_BOSS_IDS: Set<RealBossId> = new Set([
  "acid-baron",
  "redox-reaper",
  "organic-overlord",
  "thermo-titan",
  "equilibrium-emperor",
  "kinetic-king",
  "atomic-archmage",
  "solution-sovereign",
  "chemical-overlord",
]);

/**
 * Check if a boss ID is a valid real boss ID
 */
export function isValidBossId(bossId: string): bossId is RealBossId {
  return VALID_BOSS_IDS.has(bossId as RealBossId);
}

/**
 * Check if a boss ID is a known campaign boss ID
 */
export function isCampaignBossId(bossId: string): bossId is CampaignBossId {
  return bossId in BOSS_ID_MAPPING;
}

/**
 * Resolve a campaign boss ID to a real boss ID
 * 
 * @param campaignBossId - The boss ID from campaign data
 * @returns The real boss ID from bosses.json, or null if not found
 */
export function resolveBossId(campaignBossId: string): RealBossId | null {
  // If it's already a valid real boss ID, return it
  if (isValidBossId(campaignBossId)) {
    return campaignBossId;
  }
  
  // If it's a campaign boss ID, map it
  if (isCampaignBossId(campaignBossId)) {
    return BOSS_ID_MAPPING[campaignBossId];
  }
  
  // Unknown boss ID
  return null;
}

/**
 * Get the display name for a boss based on its campaign ID
 * This provides friendlier names for the UI
 */
export function getBossDisplayName(campaignBossId: string): string {
  const displayNames: Record<string, string> = {
    "acid-baron": "The Acid Baron",
    "mole-master": "The Mole Master",
    "reaction-king": "The Reaction King",
    "thermo-lord": "The Thermo Lord",
    "equilibrium-master": "The Equilibrium Master",
    "kinetic-emperor": "The Kinetic Emperor",
    "atomic-warlock": "The Atomic Warlock",
    "solution-tyrant": "The Solution Tyrant",
    "chemical-overlord": "Chemical Overlord",
  };
  
  return displayNames[campaignBossId] || "Unknown Boss";
}

/**
 * Handle boss not found error with toast and optional callback
 * 
 * @param bossId - The boss ID that was not found
 * @param onRedirect - Optional callback to handle redirect
 */
export function handleBossNotFound(
  bossId: string, 
  onRedirect?: () => void
): void {
  toast.error(`Boss "${bossId}" not found!`, {
    description: "This boss hasn't been implemented yet. Try the Acid Baron or Chemical Overlord!",
  });
  
  if (onRedirect) {
    setTimeout(() => {
      onRedirect();
    }, 2000);
  }
}

/**
 * Get all available boss mappings for debugging/admin purposes
 */
export function getAllBossMappings(): Record<CampaignBossId, RealBossId> {
  return { ...BOSS_ID_MAPPING };
}
