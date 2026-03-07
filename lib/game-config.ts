// Centralized game configuration and constants
import { GameMode, GameModeConfig, PowerUpId, GAME_MODE_CONFIG, STREAK_MULTIPLIERS, getStreakMultiplier, calculatePoints, POWER_UPS } from './game-types'

// Re-export core configs from game-types
export { GAME_MODE_CONFIG, STREAK_MULTIPLIERS, POWER_UPS, getStreakMultiplier, calculatePoints }
export type { GameMode, GameModeConfig, PowerUpId }

// UI-specific game mode display configurations
export type GameModeDisplay = {
  id: GameMode
  name: string
  description: string
  color: string
  details: string[]
}

export const GAME_MODE_DISPLAY: GameModeDisplay[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: '10 questions, 30s each, power-ups available',
    color: 'from-purple-500 to-blue-500',
    details: ['10 Questions', '30s Timer', 'Power-ups']
  },
  {
    id: 'rush',
    name: 'Rush',
    description: '20 questions, 15s each, speed bonuses',
    color: 'from-orange-500 to-red-500',
    details: ['20 Questions', '15s Timer', 'Speed Bonus']
  },
  {
    id: 'survival',
    name: 'Survival',
    description: '3 lives, keep going until you run out',
    color: 'from-green-500 to-emerald-500',
    details: ['3 Lives', '25s Timer', 'Endless']
  },
  {
    id: 'boss_battle',
    name: 'Boss Battle',
    description: 'Team up to defeat the Chemistry Boss!',
    color: 'from-red-500 to-purple-500',
    details: ['Cooperative', 'Boss HP', 'Gem Rewards']
  },
  {
    id: 'tower_climb',
    name: 'Tower Climb',
    description: 'Climb as high as you can with 3 lives',
    color: 'from-cyan-500 to-blue-500',
    details: ['3 Lives', '25s Timer', 'Endless Climb', 'Gem Rewards']
  }
]

// Power-up display with colors for UI
export type PowerUpDisplay = {
  id: PowerUpId
  name: string
  description: string
  cost: number
  color: string
}

export const POWER_UP_DISPLAY: PowerUpDisplay[] = [
  {
    id: 'timeFreeze',
    name: 'Time Freeze',
    description: 'Freeze the timer for this question',
    cost: 150,
    color: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'fiftyFifty',
    name: '50/50',
    description: 'Remove 2 wrong answers',
    cost: 200,
    color: 'from-purple-400 to-pink-400'
  },
  {
    id: 'doublePoints',
    name: 'Double Points',
    description: '2x points on next correct answer',
    cost: 250,
    color: 'from-yellow-400 to-orange-400'
  },
  {
    id: 'skip',
    name: 'Skip Question',
    description: 'Skip without penalty',
    cost: 100,
    color: 'from-green-400 to-emerald-400'
  }
]

// Game constants
export const INITIAL_COINS = 100
export const INITIAL_LIVES = 3
export const DEFAULT_TIME_PER_QUESTION = 30

// Get mode display info helper
export function getModeDisplay(mode: GameMode): GameModeDisplay | undefined {
  return GAME_MODE_DISPLAY.find(m => m.id === mode)
}

// Get power-up display info helper  
export function getPowerUpDisplay(id: PowerUpId): PowerUpDisplay | undefined {
  return POWER_UP_DISPLAY.find(p => p.id === id)
}
