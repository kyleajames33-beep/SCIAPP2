// BUG-6 FIX: Proper game-specific types replacing the stale Expense types

export type GameMode = 'classic' | 'rush' | 'survival' | 'boss_battle' | 'tower_climb'
export type GameState = 'mode-select' | 'lobby' | 'playing' | 'results'
export type GameStatus = 'waiting' | 'playing' | 'finished'

export type Question = {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer?: number // Only available after answering
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export type QuestionWithAnswer = Question & {
  correctAnswer: number
}

export type GameConfig = {
  timePerQuestion: number
  totalQuestions: number
  lives?: number
  speedBonus?: boolean
}

export type PowerUpId = 'timeFreeze' | 'fiftyFifty' | 'doublePoints' | 'skip'

export type PowerUp = {
  id: PowerUpId
  name: string
  description: string
  cost: number
}

export type Player = {
  id: string
  nickname: string
  score: number
  streak: number
  maxStreak: number
  isHost: boolean
  hasAnswered: boolean
  correctAnswers?: number
  incorrectAnswers?: number
}

export type GameSessionState = {
  sessionId: string
  gameCode: string
  gameMode: GameMode
  gameStatus: GameStatus
  currentQuestion: number
  totalQuestions: number
  questions: Question[]
  players: Player[]
  questionStartedAt?: string
  answeredCount?: number
  totalPlayers?: number
}

export type AnswerResult = {
  isCorrect: boolean
  correctAnswer: number
  pointsEarned: number
  coinsEarned?: number
  streak: number
}

export type GameSummary = {
  score: number
  coins?: number
  correctAnswers: number
  incorrectAnswers: number
  maxStreak: number
  accuracy: number
}

// Game mode configuration
export type GameModeConfig = {
  questions: number
  timePerQuestion: number
  totalQuestions: number
  lives?: number
  speedBonus: boolean
}

export const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  classic: { questions: 10, timePerQuestion: 30, speedBonus: false, totalQuestions: 10 },
  rush:    { questions: 20, timePerQuestion: 15, speedBonus: true, totalQuestions: 20 },
  survival:{ questions: 50, timePerQuestion: 25, lives: 3, speedBonus: false, totalQuestions: 50 },
  boss_battle: { questions: 25, timePerQuestion: 20, speedBonus: false, totalQuestions: 25 },
  tower_climb: { questions: 100, timePerQuestion: 25, lives: 3, speedBonus: false, totalQuestions: 100 },
}

// Streak multiplier calculation
export const STREAK_MULTIPLIERS: Array<{ minStreak: number; multiplier: number }> = [
  { minStreak: 7, multiplier: 5 },
  { minStreak: 5, multiplier: 3 },
  { minStreak: 3, multiplier: 2 },
]

export function getStreakMultiplier(streak: number): number {
  for (const { minStreak, multiplier } of STREAK_MULTIPLIERS) {
    if (streak >= minStreak) return multiplier
  }
  return 1
}

export function calculatePoints(isCorrect: boolean, streak: number, gameMode: GameMode, timeRemaining: number): {
  points: number
  coins: number
} {
  if (!isCorrect) return { points: 0, coins: 0 }

  const basePoints = 100
  const multiplier = getStreakMultiplier(streak)
  let points = basePoints * multiplier
  let coins = 50 + (streak * 10)

  // Rush speed bonus
  if (gameMode === 'rush' && timeRemaining > 10) {
    const speedBonus = Math.floor((timeRemaining - 10) * 20)
    points += speedBonus
    coins += Math.floor(speedBonus / 5)
  }

  return { points, coins }
}

// Power-up definitions
export const POWER_UPS: readonly PowerUp[] = [
  { id: 'timeFreeze',   name: 'Time Freeze',   cost: 150, description: 'Freeze the timer for this question' },
  { id: 'fiftyFifty',   name: '50/50',          cost: 200, description: 'Remove 2 wrong answers' },
  { id: 'doublePoints', name: 'Double Points',  cost: 250, description: '2x points on next correct answer' },
  { id: 'skip',         name: 'Skip Question',  cost: 100, description: 'Skip without penalty' },
] as const

// Constants
export const MAX_PLAYERS_PER_GAME = 30
export const GAME_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const GAME_CODE_LENGTH = 6
export const SSE_POLL_INTERVAL_MS = 500
export const AUTO_ADVANCE_BUFFER_SECONDS = 3
