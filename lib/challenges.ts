/**
 * Daily Challenges System
 */

export type ChallengeType = 'boss_defeat' | 'tower_floor' | 'perfect_streak' | 'games_played' | 'accuracy'

export interface DailyChallenge {
  id: string
  type: ChallengeType
  title: string
  description: string
  requirement: number
  reward: {
    gems: number
    coins?: number
  }
  icon: string
}

/**
 * Get today's daily challenge
 * Uses a deterministic algorithm based on the date to ensure all users get the same challenge
 */
export function getTodaysChallenge(): DailyChallenge {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)

  const challenges: DailyChallenge[] = [
    {
      id: 'boss_defeat',
      type: 'boss_defeat',
      title: 'Boss Slayer',
      description: 'Defeat the Chemistry Boss',
      requirement: 1,
      reward: { gems: 100, coins: 500 },
      icon: '⚔️',
    },
    {
      id: 'tower_floor_20',
      type: 'tower_floor',
      title: 'Tower Climber',
      description: 'Reach Floor 20 in Tower Climb',
      requirement: 20,
      reward: { gems: 100, coins: 500 },
      icon: '🏔️',
    },
    {
      id: 'perfect_streak_10',
      type: 'perfect_streak',
      title: 'Perfect Streak',
      description: 'Get a 10-question streak',
      requirement: 10,
      reward: { gems: 100 },
      icon: '🔥',
    },
    {
      id: 'games_played_5',
      type: 'games_played',
      title: 'Daily Grind',
      description: 'Complete 5 games',
      requirement: 5,
      reward: { gems: 100, coins: 300 },
      icon: '🎮',
    },
    {
      id: 'accuracy_90',
      type: 'accuracy',
      title: 'Perfectionist',
      description: 'Complete a game with 90%+ accuracy',
      requirement: 90,
      reward: { gems: 100, coins: 400 },
      icon: '🎯',
    },
  ]

  // Rotate through challenges based on day of year
  const challengeIndex = dayOfYear % challenges.length
  return challenges[challengeIndex]
}

/**
 * Check if user has completed today's challenge
 */
export function hasCompletedTodaysChallenge(lastChallengeDate: Date | null): boolean {
  if (!lastChallengeDate) return false

  const today = new Date()
  const lastChallenge = new Date(lastChallengeDate)

  return (
    lastChallenge.getFullYear() === today.getFullYear() &&
    lastChallenge.getMonth() === today.getMonth() &&
    lastChallenge.getDate() === today.getDate()
  )
}

/**
 * Get time until next challenge (midnight)
 */
export function getTimeUntilNextChallenge(): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setHours(24, 0, 0, 0)

  const diff = tomorrow.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
}
