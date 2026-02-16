import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function calculatePoints(isCorrect: boolean, streak: number): number {
  if (!isCorrect) return 0

  const basePoints = 100
  
  // Streak bonuses
  if ((streak || 0) >= 7) return basePoints * 5 // 5x multiplier for 7+ streak
  if ((streak || 0) >= 5) return basePoints * 3 // 3x multiplier for 5-6 streak
  if ((streak || 0) >= 3) return basePoints * 2 // 2x multiplier for 3-4 streak
  
  return basePoints // Normal points
}

function calculateCoins(isCorrect: boolean, streak: number): number {
  if (!isCorrect) return 0
  return 50 + ((streak + 1) * 10) // 50 base + streak bonus
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, questionId, selectedAnswer, timeSpent } = body

    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current session
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // BUG-3 FIX: Validate that questionId is in the session's questionIds
    if (session.questionIds.length > 0 && !session.questionIds.includes(questionId)) {
      return NextResponse.json(
        { error: 'Question not part of this session' },
        { status: 400 }
      )
    }

    // Get question to check correct answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const isCorrect = selectedAnswer === question?.correctAnswer
    const currentStreak = session?.streak || 0
    const pointsEarned = calculatePoints(isCorrect, currentStreak)
    const coinsEarned = calculateCoins(isCorrect, currentStreak)
    const newStreak = isCorrect ? (currentStreak || 0) + 1 : 0

    // Save player answer
    await prisma.playerAnswer.create({
      data: {
        gameSessionId: sessionId,
        questionId,
        selectedAnswer: selectedAnswer ?? -1,
        isCorrect,
        timeSpent: timeSpent || 0,
        pointsEarned,
      },
    })

    // Update game session
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        score: (session?.score || 0) + pointsEarned,
        streak: newStreak,
        maxStreak: Math.max(session?.maxStreak || 0, newStreak),
        correctAnswers: isCorrect
          ? (session?.correctAnswers || 0) + 1
          : session?.correctAnswers || 0,
        incorrectAnswers: !isCorrect
          ? (session?.incorrectAnswers || 0) + 1
          : session?.incorrectAnswers || 0,
        currentQuestion: (session?.currentQuestion || 0) + 1,
      },
    })

    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correctAnswer, // Safe to send AFTER answering
      pointsEarned,
      streak: newStreak,
      coinsEarned, // Tell client how many coins
      explanation: question.explanation || null, // Show explanation if available
    })
  } catch (error) {
    console.error('Answer submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
