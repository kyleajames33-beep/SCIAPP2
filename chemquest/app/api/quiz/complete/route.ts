import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Guest user ID for fallback
const GUEST_USER_ID = 'guest-user-123'

// ─── Rank Thresholds (as specified) ───────────────────────────────────────────
const RANK_THRESHOLDS = {
  Bronze: 0,      // 0 - 499 XP
  Silver: 500,    // 500 - 1,499 XP
  Gold: 1500,     // 1,500 - 3,499 XP
  Platinum: 3500, // 3,500 - 6,999 XP
  Diamond: 7000,  // 7,000+ XP
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
 * +5 XP per correct answer for every day in the current streak (capped at +25 XP bonus)
 */
function getStreakBonusXP(streakCount: number): number {
  // +5 XP per streak day, capped at +25 (5 days max effect)
  return Math.min(streakCount * 5, 25)
}

/**
 * Calculate and update streak based on lastQuizDate
 * - Within 24 hours: keep current streak (already completed today)
 * - Between 24-36 hours: increment streak (new day, consecutive)
 * - More than 36 hours: reset streak to 1
 */
function calculateNewStreak(lastQuizDate: Date | null, currentStreak: number): number {
  if (!lastQuizDate) {
    // First quiz ever
    return 1
  }

  const now = new Date()
  const hoursSinceLastQuiz = (now.getTime() - lastQuizDate.getTime()) / (1000 * 60 * 60)

  if (hoursSinceLastQuiz < 24) {
    // Within same day, keep current streak
    return currentStreak
  } else if (hoursSinceLastQuiz <= 36) {
    // Between 24-36 hours, increment streak (consecutive day)
    return currentStreak + 1
  } else {
    // More than 36 hours, reset streak
    return 1
  }
}

/**
 * Ensure guest user exists in database
 */
async function ensureGuestUser() {
  const existingUser = await prisma.user.findUnique({
    where: { id: GUEST_USER_ID },
  })

  if (!existingUser) {
    return await prisma.user.create({
      data: {
        id: GUEST_USER_ID,
        username: 'guest',
        displayName: 'Guest Player',
        email: null,
        passwordHash: '', // No password for guest
        role: 'student',
        totalXP: 0,
        totalCoins: 100, // Starting coins
        streakCount: 1,
        currentRank: 'Bronze',
      },
    })
  }

  return existingUser
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, correctAnswers, totalQuestions } = body

    // Validate required fields
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

    // Determine user ID - use provided userId or fallback to guest
    let actualUserId = userId
    let user = null

    if (userId) {
      // Try to find the provided user
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          totalXP: true,
          totalCoins: true,
          streakCount: true,
          lastLogin: true,
          currentRank: true,
        },
      })
    }

    // If no user found (or no userId provided), use guest user fallback
    if (!user) {
      const guestUser = await ensureGuestUser()
      actualUserId = guestUser.id
      user = await prisma.user.findUnique({
        where: { id: actualUserId },
        select: {
          id: true,
          totalXP: true,
          totalCoins: true,
          streakCount: true,
          lastLogin: true,
          currentRank: true,
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Failed to create or find guest user' },
          { status: 500 }
        )
      }
    }

    // Calculate new streak based on lastLogin (lastQuizDate equivalent)
    const newStreakCount = calculateNewStreak(user.lastLogin, user.streakCount)

    // Calculate XP earned
    // Base: +10 XP per correct answer
    // Streak bonus: +5 XP per correct answer * streak days (capped at +25)
    // Completion bonus: +50 XP
    // Perfect score bonus: +100 XP if 100%
    const baseXP = correctAnswers * 10
    const streakBonusPerCorrect = getStreakBonusXP(newStreakCount)
    const totalStreakBonus = correctAnswers * streakBonusPerCorrect / newStreakCount // Distribute bonus
    const completionBonus = 50 // Quiz completion bonus
    const isPerfectScore = totalQuestions > 0 && correctAnswers === totalQuestions
    const perfectScoreBonus = isPerfectScore ? 100 : 0
    
    const xpEarned = baseXP + Math.floor(totalStreakBonus) + completionBonus + perfectScoreBonus

    // Calculate new total XP
    const newTotalXP = user.totalXP + xpEarned

    // Calculate coins earned
    // Base: +5 coins per correct answer
    // Completion bonus: +20 coins
    // Perfect score bonus: +50 coins
    const coinsEarned = (correctAnswers * 5) + 20 + (isPerfectScore ? 50 : 0)

    // Calculate new rank based on updated total XP
    const newRank = calculateRank(newTotalXP)
    const previousRank = user.currentRank
    const rankChanged = previousRank !== newRank

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: actualUserId },
      data: {
        totalXP: newTotalXP,
        totalCoins: { increment: coinsEarned },
        streakCount: newStreakCount,
        lastLogin: new Date(), // Update lastLogin as lastQuizDate
        currentRank: newRank,
      },
    })

    // Return response with XP and streak information
    return NextResponse.json({
      success: true,
      xpEarned,
      newTotalXP,
      newRank,
      currentStreak: newStreakCount,
      coinsEarned,
      // Additional info for client-side display
      baseXP,
      completionBonus,
      perfectScoreBonus,
      isPerfectScore,
      previousRank,
      rankChanged,
      // User info
      userId: actualUserId,
      isGuestUser: actualUserId === GUEST_USER_ID,
    })
  } catch (error) {
    console.error('Quiz completion error:', error)
    return NextResponse.json(
      { error: 'Failed to process quiz completion' },
      { status: 500 }
    )
  }
}
