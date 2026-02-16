import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ─── Rank Thresholds ───────────────────────────────────────────
const RANK_THRESHOLDS = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Platinum: 3000,
  Diamond: 5000,
} as const

type RankType = keyof typeof RANK_THRESHOLDS

/**
 * Calculate rank based on total XP
 */
function calculateRank(totalXP: number): RankType {
  if (totalXP >= RANK_THRESHOLDS.Diamond) return 'Diamond'
  if (totalXP >= RANK_THRESHOLDS.Platinum) return 'Platinum'
  if (totalXP >= RANK_THRESHOLDS.Gold) return 'Gold'
  if (totalXP >= RANK_THRESHOLDS.Silver) return 'Silver'
  return 'Bronze'
}

/**
 * Calculate streak multiplier based on current streak count
 * - Streak 1-3 days: 1.0x
 * - Streak 4-6 days: 1.1x
 * - Streak 7+ days: 1.2x
 */
function getStreakMultiplier(streakCount: number): number {
  if (streakCount >= 7) return 1.2
  if (streakCount >= 4) return 1.1
  return 1.0
}

/**
 * Calculate and update streak based on 48h window logic
 * - If (now - lastLogin) < 24h: Streak remains unchanged
 * - If (now - lastLogin) is between 24h and 48h: Increment streakCount by 1
 * - If (now - lastLogin) > 48h: Reset streakCount to 1
 */
function calculateNewStreak(lastLogin: Date, currentStreak: number): number {
  const now = new Date()
  const hoursSinceLastLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60)

  if (hoursSinceLastLogin < 24) {
    // Within same day, keep current streak
    return currentStreak
  } else if (hoursSinceLastLogin <= 48) {
    // Between 24-48 hours, increment streak
    return currentStreak + 1
  } else {
    // More than 48 hours, reset streak
    return 1
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, correctAnswers, totalQuestions } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    if (correctAnswers === undefined || totalQuestions === undefined) {
      return NextResponse.json(
        { error: 'Missing correctAnswers or totalQuestions' },
        { status: 400 }
      )
    }

    // Validate input values
    if (correctAnswers < 0 || totalQuestions < 0 || correctAnswers > totalQuestions) {
      return NextResponse.json(
        { error: 'Invalid correctAnswers or totalQuestions values' },
        { status: 400 }
      )
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        totalXP: true,
        streakCount: true,
        lastLogin: true,
        currentRank: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate new streak based on 48h window logic
    const newStreakCount = calculateNewStreak(user.lastLogin, user.streakCount)

    // Get streak multiplier based on updated streak
    const streakMultiplier = getStreakMultiplier(newStreakCount)

    // Calculate XP earned
    // Formula: finalXP = (correctAnswers * 10 * multiplier) + 20 (completion bonus)
    const baseXP = correctAnswers * 10
    const multipliedXP = Math.floor(baseXP * streakMultiplier)
    const completionBonus = 20
    const xpEarned = multipliedXP + completionBonus

    // Calculate new total XP
    const newTotalXP = user.totalXP + xpEarned

    // Calculate new rank based on updated total XP
    const newRank = calculateRank(newTotalXP)

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: newTotalXP,
        streakCount: newStreakCount,
        lastLogin: new Date(),
        currentRank: newRank,
      },
    })

    // Return response with XP and streak information
    return NextResponse.json({
      xpEarned,
      newTotalXP,
      newRank,
      currentStreak: newStreakCount,
      // Additional info for client-side display
      streakMultiplier,
      baseXP,
      completionBonus,
      previousRank: user.currentRank,
      rankChanged: user.currentRank !== newRank,
    })
  } catch (error) {
    console.error('Quiz completion error:', error)
    return NextResponse.json(
      { error: 'Failed to process quiz completion' },
      { status: 500 }
    )
  }
}
