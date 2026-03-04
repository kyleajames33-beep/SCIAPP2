// import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
// import { getRankInfo } from '@/lib/rank-system'

export const dynamic = 'force-dynamic'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function GET() {
  console.log('[PROFILE] DISABLED - Using Supabase')
  return json({ error: 'Feature temporarily disabled during migration' }, 503)
  
  /*
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get recent game history
    const recentGames = await prisma.gameSession.findMany({
      where: {
        userId: user.id,
        isCompleted: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        gameMode: true,
        score: true,
        correctAnswers: true,
        incorrectAnswers: true,
        maxStreak: true,
        totalQuestions: true,
        completedAt: true,
      },
    })

    // Get leaderboard positions
    const leaderboardPositions = await prisma.$queryRaw`
      SELECT 
        "gameMode",
        COUNT(*)::int as rank
      FROM "LeaderboardEntry"
      WHERE score > (
        SELECT MAX(score) FROM "LeaderboardEntry" WHERE "userId" = ${user.id}
      )
      GROUP BY "gameMode"
    ` as { gameMode: string; rank: number }[]

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        totalCoins: user.totalCoins,
        totalScore: user.totalScore,
        gamesPlayed: user.gamesPlayed,
        bestStreak: user.bestStreak,
        prestigeLevel: user.prestigeLevel,
        lifetimeEarnings: user.lifetimeEarnings,
      },
      recentGames: recentGames.map(game => ({
        id: game.id,
        gameMode: game.gameMode,
        score: game.score,
        accuracy: game.correctAnswers + game.incorrectAnswers > 0
          ? Math.round((game.correctAnswers / (game.correctAnswers + game.incorrectAnswers)) * 100)
          : 0,
        maxStreak: game.maxStreak,
        totalQuestions: game.totalQuestions,
        completedAt: game.completedAt?.toISOString(),
      })),
      leaderboardPositions,
    })
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
  */
}
