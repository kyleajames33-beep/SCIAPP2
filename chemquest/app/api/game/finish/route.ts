import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, coinsEarned, floorReached, chamberId, worldId, bossId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      )
    }

    // Get current session for summary
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Mark session as completed
    const now = new Date()
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        isCompleted: true,
        completedAt: now,
        gameStatus: 'finished',
        // Update current floor if provided (for tower_climb mode)
        ...(floorReached !== undefined && { currentFloor: floorReached }),
      },
    })

    // Calculate accuracy
    const totalAnswered = (updatedSession.correctAnswers || 0) + (updatedSession.incorrectAnswers || 0)
    const accuracy = totalAnswered > 0 
      ? (updatedSession.correctAnswers || 0) / totalAnswered
      : 0
    const accuracyPercent = Math.round(accuracy * 100)

    // Calculate time taken (in seconds)
    const timeTaken = Math.round((now.getTime() - new Date(updatedSession.startedAt).getTime()) / 1000)

    // Get authenticated user (if any)
    const user = await getSessionUser()

    // Track if new high floor was achieved
    let newHighFloor = false
    let previousHighFloor = 0

    // Track if new high score was achieved
    let isNewHighScore = false
    let previousBestScore = 0

    // If user is authenticated, update their stats and create leaderboard entry
    if (user) {
      // Check for previous best score for this mode
      const previousBestEntry = await prisma.leaderboardEntry.findFirst({
        where: {
          userId: user.id,
          gameMode: updatedSession.gameMode,
        },
        orderBy: {
          score: 'desc'
        }
      })

      previousBestScore = previousBestEntry?.score || 0
      isNewHighScore = (updatedSession.score || 0) > previousBestScore
      // Update user stats including lifetimeEarnings
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalCoins: { increment: coinsEarned || 0 },
          totalScore: { increment: updatedSession.score || 0 },
          gamesPlayed: { increment: 1 },
          totalCorrect: { increment: updatedSession.correctAnswers || 0 },
          totalIncorrect: { increment: updatedSession.incorrectAnswers || 0 },
          // Update lifetimeEarnings (never resets)
          lifetimeEarnings: { increment: BigInt(coinsEarned || 0) },
          // Only update bestStreak if the new one is higher
          bestStreak: {
            set: Math.max(user.bestStreak, updatedSession.maxStreak || 0)
          }
        },
      })

      // Update the game session with the user ID
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { userId: user.id },
      })

      // Update UserProgress for tower_climb mode
      if (updatedSession.gameMode === 'tower_climb' && floorReached !== undefined) {
        const existingProgress = await prisma.userProgress.findUnique({
          where: {
            userId_mode: { userId: user.id, mode: 'tower_climb' },
          },
        })

        previousHighFloor = existingProgress?.highestFloor || 0
        newHighFloor = floorReached > previousHighFloor

        await prisma.userProgress.upsert({
          where: {
            userId_mode: { userId: user.id, mode: 'tower_climb' },
          },
          create: {
            userId: user.id,
            mode: 'tower_climb',
            highestFloor: floorReached,
            bestTime: timeTaken,
            totalRuns: 1,
          },
          update: {
            highestFloor: newHighFloor ? floorReached : previousHighFloor,
            bestTime: newHighFloor ? timeTaken : existingProgress?.bestTime || timeTaken,
            totalRuns: { increment: 1 },
          },
        })
      }

      // Update UserProgress for boss_battle mode
      if (updatedSession.gameMode === 'boss_battle') {
        const existingProgress = await prisma.userProgress.findUnique({
          where: {
            userId_mode: { userId: user.id, mode: 'boss_battle' },
          },
        })

        const bossDefeated = (updatedSession.bossHp ?? 0) <= 0
        const currentBestTime = existingProgress?.bestTime || 999999

        await prisma.userProgress.upsert({
          where: {
            userId_mode: { userId: user.id, mode: 'boss_battle' },
          },
          create: {
            userId: user.id,
            mode: 'boss_battle',
            highestFloor: bossDefeated ? 1 : 0,  // Use as "bosses defeated" counter
            bestTime: bossDefeated ? timeTaken : 999999,
            totalRuns: 1,
          },
          update: {
            highestFloor: bossDefeated 
              ? { increment: 1 } 
              : existingProgress?.highestFloor || 0,
            bestTime: bossDefeated && timeTaken < currentBestTime 
              ? timeTaken 
              : currentBestTime,
            totalRuns: { increment: 1 },
          },
        })
      }

      // Create leaderboard entry
      await prisma.leaderboardEntry.create({
        data: {
          userId: user.id,
          questionSetId: updatedSession.questionSetId,
          gameMode: updatedSession.gameMode,
          score: updatedSession.score || 0,
          accuracy,
          maxStreak: updatedSession.maxStreak || 0,
          timeTaken,
        },
      })

      // ─── Campaign Progress Tracking ───────────────────────────
      const campaignXpEarned = chamberId ? Math.round((updatedSession.score || 0) * 0.1) : 0

      if (chamberId && worldId) {
        // Upsert campaign chamber progress
        const existingProgress = await prisma.campaignProgress.findUnique({
          where: { userId_chamberId: { userId: user.id, chamberId } },
        })

        const isNewBest = (updatedSession.score || 0) > (existingProgress?.bestScore || 0)

        await prisma.campaignProgress.upsert({
          where: { userId_chamberId: { userId: user.id, chamberId } },
          create: {
            userId: user.id,
            chamberId,
            worldId,
            completed: true,
            bestScore: updatedSession.score || 0,
            xpEarned: campaignXpEarned,
          },
          update: {
            completed: true,
            bestScore: isNewBest ? (updatedSession.score || 0) : (existingProgress?.bestScore || 0),
            xpEarned: isNewBest ? campaignXpEarned : (existingProgress?.xpEarned || 0),
          },
        })

        // Award campaign XP to user
        if (campaignXpEarned > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              campaignXp: { increment: campaignXpEarned },
            },
          })
        }
      }

      // Track boss attempts if bossId provided
      if (bossId) {
        const bossDefeated = (updatedSession.bossHp ?? 1) <= 0
        await prisma.bossAttempt.create({
          data: {
            userId: user.id,
            bossId,
            defeated: bossDefeated,
            damageDealt: (updatedSession.bossMaxHp || 0) - (updatedSession.bossHp || 0),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        score: updatedSession.score || 0,
        correctAnswers: updatedSession.correctAnswers || 0,
        incorrectAnswers: updatedSession.incorrectAnswers || 0,
        maxStreak: updatedSession.maxStreak || 0,
        accuracy: accuracyPercent,
        timeTaken,
        coinsEarned: coinsEarned || 0,
        isAuthenticated: !!user,
        // High score tracking
        isNewHighScore,
        previousBestScore,
        // Tower climb specific
        floorReached: floorReached || 0,
        newHighFloor,
        previousHighFloor,
        // Boss battle specific
        bossDefeated: (updatedSession.bossHp ?? 1) <= 0,
      }
    })
  } catch (error) {
    console.error('Finish game error:', error)
    return NextResponse.json(
      { error: 'Failed to finish game' },
      { status: 500 }
    )
  }
}
