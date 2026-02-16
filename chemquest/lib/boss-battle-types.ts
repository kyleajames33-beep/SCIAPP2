// Boss Battle Types and Utilities

import { StatusEffectType, StatusEffect } from '@/app/game/_components/status-effects';
import { BossIntent } from '@/app/game/_components/boss-intent';
import { ElementalType } from '@/app/game/_components/elemental-particles';

export interface SpecialMove {
  id: string;
  name: string;
  description: string;
  effect: StatusEffectType | 'defense' | 'none';
  damage: number;
  duration: number;
  cooldown: number;
  intent: 'attack' | 'defend' | 'debuff';
}

export interface BossPhase {
  hpThreshold: number;
  speedMultiplier: number;
}

export interface Boss {
  id: string;
  name: string;
  elementalType: ElementalType;
  description: string;
  baseHp: number;
  sprite: string;
  themeColor: string;
  particleColors: string[];
  specialMoves: SpecialMove[];
  enrageThreshold: number;
  phases: BossPhase[];
}

export interface BossBattleState {
  boss: Boss;
  currentHp: number;
  maxHp: number;
  isEnraged: boolean;
  isDefeated: boolean;
  currentPhase: 1 | 2 | 3;
  turnCount: number;
  nextIntent: BossIntent | null;
  activeStatusEffects: StatusEffect[];
  moveCooldowns: Record<string, number>;
  isDefending: boolean;
  defenseBonus: number;
  consecutiveMisses: number;
  lastDamageDealt: number;
}

// Determine boss intent based on battle state
export function determineBossIntent(
  state: BossBattleState,
  wrongAnswerCount: number,
  timeTaken: number // seconds
): BossIntent | null {
  const { boss, currentPhase, turnCount, moveCooldowns, consecutiveMisses } = state;
  const availableMoves = boss.specialMoves.filter(
    (move) => !moveCooldowns[move.id] || moveCooldowns[move.id] <= 0
  );

  if (availableMoves.length === 0) {
    // Basic attack if no special moves available
    return {
      type: 'attack',
      moveName: 'Basic Attack',
      description: 'A standard attack',
      damage: 30 + currentPhase * 10,
    };
  }

  // Priority logic for boss moves
  let selectedMove: SpecialMove | null = null;

  // High priority: Use debuff if player taking too long (>20s)
  if (timeTaken > 20) {
    const debuffMoves = availableMoves.filter((m) => m.intent === 'debuff');
    if (debuffMoves.length > 0) {
      selectedMove = debuffMoves[Math.floor(Math.random() * debuffMoves.length)];
    }
  }

  // High priority: Use attack if player missed questions
  if (!selectedMove && consecutiveMisses >= 2) {
    const attackMoves = availableMoves.filter((m) => m.intent === 'attack');
    if (attackMoves.length > 0) {
      selectedMove = attackMoves[Math.floor(Math.random() * attackMoves.length)];
    }
  }

  // Phase 3: More aggressive - prefer attacks
  if (!selectedMove && currentPhase === 3) {
    const aggressiveMoves = availableMoves.filter((m) => m.intent === 'attack' || m.intent === 'debuff');
    if (aggressiveMoves.length > 0 && Math.random() < 0.7) {
      selectedMove = aggressiveMoves[Math.floor(Math.random() * aggressiveMoves.length)];
    }
  }

  // Phase 2: Balanced approach
  if (!selectedMove && currentPhase === 2) {
    const attackChance = 0.5;
    if (Math.random() < attackChance) {
      const attackMoves = availableMoves.filter((m) => m.intent === 'attack');
      if (attackMoves.length > 0) {
        selectedMove = attackMoves[Math.floor(Math.random() * attackMoves.length)];
      }
    }
  }

  // Default: Random selection
  if (!selectedMove) {
    selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Convert special move to intent
  return {
    type: selectedMove.intent === 'debuff' ? 'special' : selectedMove.intent === 'defend' ? 'defend' : 'attack',
    moveName: selectedMove.name,
    description: selectedMove.description,
    effect: selectedMove.effect === 'none' || selectedMove.effect === 'defense' ? undefined : selectedMove.effect,
    damage: selectedMove.damage,
  };
}

// Apply status effect to player
export function applyStatusEffect(
  currentEffects: StatusEffect[],
  effectType: StatusEffectType,
  duration: number,
  intensity: number = 1
): StatusEffect[] {
  const existingEffect = currentEffects.find((e) => e.type === effectType);
  
  if (existingEffect) {
    // Stack duration and increase intensity (max 3)
    return currentEffects.map((e) =>
      e.type === effectType
        ? {
            ...e,
            turnsRemaining: Math.max(e.turnsRemaining, duration),
            intensity: Math.min(3, e.intensity + 1),
          }
        : e
    );
  }

  // Add new effect
  const newEffect: StatusEffect = {
    id: `${effectType}-${Date.now()}`,
    type: effectType,
    turnsRemaining: duration,
    intensity,
  };

  return [...currentEffects, newEffect];
}

// Process status effects at turn end
export function processStatusEffects(effects: StatusEffect[]): {
  updatedEffects: StatusEffect[];
  burnDamage: number;
  isStunned: boolean;
  energyReduction: number;
} {
  let burnDamage = 0;
  let isStunned = false;
  let energyReduction = 0;

  const updatedEffects = effects
    .map((effect) => {
      // Apply effect
      switch (effect.type) {
        case 'burn':
          burnDamage += 10 * effect.intensity;
          break;
        case 'stun':
          if (effect.turnsRemaining === effect.intensity) {
            // Only stun on first turn
            isStunned = true;
          }
          break;
        case 'corrosion':
          energyReduction += 0.1 * effect.intensity; // 10-30% reduction
          break;
      }

      // Reduce turns remaining
      return {
        ...effect,
        turnsRemaining: effect.turnsRemaining - 1,
      };
    })
    .filter((effect) => effect.turnsRemaining > 0);

  return { updatedEffects, burnDamage, isStunned, energyReduction };
}

// Calculate damage with status effects and boss defense
export function calculateDamageWithEffects(
  baseDamage: number,
  streak: number,
  activeEffects: StatusEffect[],
  isBossDefending: boolean,
  defenseBonus: number
): number {
  let damage = baseDamage + streak * 10;

  // Apply corrosion damage bonus to player (they deal more damage when boss has corrosion)
  const corrosionEffect = activeEffects.find((e) => e.type === 'corrosion');
  if (corrosionEffect) {
    // Corrosion actually reduces player damage output
    damage *= 1 - 0.1 * corrosionEffect.intensity;
  }

  // Apply boss defense
  if (isBossDefending) {
    damage *= 0.5 - defenseBonus * 0.1;
  }

  return Math.max(0, Math.floor(damage));
}

// Update cooldowns at turn end
export function updateCooldowns(cooldowns: Record<string, number>): Record<string, number> {
  const updated: Record<string, number> = {};
  for (const [moveId, turns] of Object.entries(cooldowns)) {
    if (turns > 1) {
      updated[moveId] = turns - 1;
    }
  }
  return updated;
}

// Check for phase transition
export function checkPhaseTransition(
  currentHp: number,
  maxHp: number,
  currentPhase: 1 | 2 | 3
): 1 | 2 | 3 {
  const hpPercent = currentHp / maxHp;
  
  if (hpPercent <= 0.25) return 3;
  if (hpPercent <= 0.6) return 2;
  return 1;
}
