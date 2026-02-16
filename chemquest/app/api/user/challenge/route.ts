import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { getTodaysChallenge, hasCompletedTodaysChallenge } from '@/lib/challenges'

export const dynamic = 'force-dynamic'

/**
 * POST /api/user/challenge
 * Complete today's daily challenge
 */
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { challengeType, value } = body

    const todaysChallenge = getTodaysChallenge()

    // Validate challenge type matches today's challenge
    if (challengeType !== todaysChallenge.type) {
      return NextResponse.json(
        { error: 'Invalid challenge type for today' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: sessionUser.id },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if already completed today
      if (hasCompletedTodaysChallenge(user.lastChallengeDate)) {
        throw new Error('You have already completed today\'s challenge')
      }

      // Validate requirement is met
      if (value < todaysChallenge.requirement) {
        throw new Error(`Challenge requirement not met (need ${todaysChallenge.requirement})`)
      }

      // Update user with rewards
      const updatedUser = await tx.user.update({
        where: { id: sessionUser.id },
        data: {
          lastChallengeDate: new Date(),
          challengesCompleted: { increment: 1 },
          gems: { increment: todaysChallenge.reward.gems },
          totalCoins: {
            increment: todaysChallenge.reward.coins || 0,
          },
        },
      })

      return {
        gems: updatedUser.gems,
        coins: updatedUser.totalCoins,
        challengesCompleted: updatedUser.challengesCompleted,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Challenge completed!',
      reward: todaysChallenge.reward,
      ...result,
    })
  } catch (error) {
    console.error('Challenge completion error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to complete challenge',
        success: false,
      },
      { status: 400 }
    )
  }
}

/**
 * GET /api/user/challenge
 * Get today's challenge and user's completion status
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        lastChallengeDate: true,
        challengesCompleted: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const todaysChallenge = getTodaysChallenge()
    const isCompleted = hasCompletedTodaysChallenge(user.lastChallengeDate)

    return NextResponse.json({
      challenge: todaysChallenge,
      isCompleted,
      totalChallengesCompleted: user.challengesCompleted,
    })
  } catch (error) {
    console.error('Get challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to get challenge' },
      { status: 500 }
    )
  }
}
