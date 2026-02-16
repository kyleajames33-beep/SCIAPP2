import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface StudentAnalytics {
  userId: string
  username: string
  displayName: string
  gamesPlayed: number
  averageAccuracy: number
  totalCorrect: number
  totalIncorrect: number
  mostMissedTopic: string
  totalStudyTime: number // in minutes
  lastPlayed: string | null
}

/**
 * GET /api/teacher/analytics
 * Get analytics for all students who have played teacher's question sets
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

    // Check if user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true },
    })

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Access denied. Teachers only.' },
        { status: 403 }
      )
    }

    // Get all question sets created by this teacher
    const questionSets = await prisma.questionSet.findMany({
      where: { creatorId: sessionUser.id },
      select: { id: true, name: true },
    })

    const questionSetIds = questionSets.map(qs => qs.id)

    if (questionSetIds.length === 0) {
      return NextResponse.json({
        students: [],
        questionSets: [],
      })
    }

    // Get all game sessions that used teacher's question sets
    const gameSessions = await prisma.gameSession.findMany({
      where: {
        questionSetId: { in: questionSetIds },
        isCompleted: true,
        userId: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        playerAnswers: {
          include: {
            question: {
              select: {
                topic: true,
              },
            },
          },
        },
      },
    })

    // Group sessions by student
    const studentMap = new Map<string, {
      user: { id: string; username: string; displayName: string }
      sessions: typeof gameSessions
    }>()

    for (const session of gameSessions) {
      if (!session.user) continue

      if (!studentMap.has(session.user.id)) {
        studentMap.set(session.user.id, {
          user: session.user,
          sessions: [],
        })
      }

      studentMap.get(session.user.id)!.sessions.push(session)
    }

    // Calculate analytics for each student
    const studentAnalytics: StudentAnalytics[] = []

    for (const [userId, data] of studentMap) {
      const sessions = data.sessions
      const totalGames = sessions.length

      // Calculate total correct/incorrect
      let totalCorrect = 0
      let totalIncorrect = 0
      let totalTimeSeconds = 0

      for (const session of sessions) {
        totalCorrect += session.correctAnswers
        totalIncorrect += session.incorrectAnswers

        if (session.completedAt && session.startedAt) {
          totalTimeSeconds += Math.floor(
            (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
          )
        }
      }

      const totalAnswers = totalCorrect + totalIncorrect
      const averageAccuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0

      // Find most missed topic
      const topicMissCount = new Map<string, number>()

      for (const session of sessions) {
        for (const answer of session.playerAnswers) {
          if (!answer.isCorrect && answer.question) {
            const topic = answer.question.topic
            topicMissCount.set(topic, (topicMissCount.get(topic) || 0) + 1)
          }
        }
      }

      let mostMissedTopic = 'N/A'
      let maxMisses = 0

      for (const [topic, count] of topicMissCount) {
        if (count > maxMisses) {
          maxMisses = count
          mostMissedTopic = topic
        }
      }

      // Get last played date
      const lastSession = sessions.reduce((latest, session) => {
        if (!latest.completedAt) return session
        if (!session.completedAt) return latest
        return new Date(session.completedAt) > new Date(latest.completedAt) ? session : latest
      }, sessions[0])

      studentAnalytics.push({
        userId: data.user.id,
        username: data.user.username,
        displayName: data.user.displayName,
        gamesPlayed: totalGames,
        averageAccuracy: Math.round(averageAccuracy),
        totalCorrect,
        totalIncorrect,
        mostMissedTopic,
        totalStudyTime: Math.round(totalTimeSeconds / 60), // Convert to minutes
        lastPlayed: lastSession.completedAt?.toISOString() || null,
      })
    }

    // Sort by most recent activity
    studentAnalytics.sort((a, b) => {
      if (!a.lastPlayed) return 1
      if (!b.lastPlayed) return -1
      return new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
    })

    return NextResponse.json({
      students: studentAnalytics,
      questionSets: questionSets.map(qs => ({ id: qs.id, name: qs.name })),
      totalStudents: studentAnalytics.length,
      totalGames: gameSessions.length,
    })
  } catch (error) {
    console.error('Teacher analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
