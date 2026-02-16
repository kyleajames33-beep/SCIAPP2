import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gameMode = searchParams.get('gameMode')
    const questionSetId = searchParams.get('questionSetId')
    const type = searchParams.get('type') || 'mode' // 'mode', 'global', or 'campaign'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Campaign XP leaderboard - top users by campaign XP (totalScore)
    if (type === 'campaign') {
      const users = await prisma.user.findMany({
        orderBy: {
          totalScore: 'desc',
        },
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          totalScore: true,
          totalCoins: true,
          gamesPlayed: true,
          bestStreak: true,
          prestigeLevel: true,
        },
      })

      return NextResponse.json({ 
        type: 'campaign',
        users: users.map((user, index) => ({
          rank: index + 1,
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          campaignXp: user.totalScore,
          totalCoins: user.totalCoins,
          gamesPlayed: user.gamesPlayed,
          bestStreak: user.bestStreak,
          prestigeLevel: user.prestigeLevel,
        }))
      })
    }

    // Global leaderboard - top users by prestige and lifetime earnings
    if (type === 'global') {
      const users = await prisma.user.findMany({
        orderBy: [
          { prestigeLevel: 'desc' },
          { lifetimeEarnings: 'desc' },
        ],
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          prestigeLevel: true,
          lifetimeEarnings: true,
          totalScore: true,
          gamesPlayed: true,
          bestStreak: true,
          bodyType: true,
          hairColor: true,
          weaponType: true,
        },
      })

      return NextResponse.json({ users })
    }

    // Game mode leaderboard (original behavior)
    const whereClause: Record<string, unknown> = {
      gameMode: gameMode || 'classic',
    }

    if (questionSetId) {
      whereClause.questionSetId = questionSetId
    }

    const entries = await prisma.leaderboardEntry.findMany({
      where: whereClause,
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            prestigeLevel: true,
          },
        },
      },
    })

    const leaderboard = entries.map((entry, index) => ({
      rank: index + 1,
      username: entry.user.username,
      displayName: entry.user.displayName,
      prestigeLevel: entry.user.prestigeLevel,
      score: entry.score,
      accuracy: Math.round(entry.accuracy * 100),
      maxStreak: entry.maxStreak,
      timeTaken: entry.timeTaken,
      createdAt: entry.createdAt.toISOString(),
    }))

    return NextResponse.json({ entries: leaderboard })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
