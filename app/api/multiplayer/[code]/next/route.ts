import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const gameCode = params.code?.toUpperCase()
    const body = await req.json()
    const playerId = body?.playerId

    const session = await prisma.gameSession.findUnique({
      where: { gameCode },
      include: { players: { where: { isConnected: true } } },
    })

    if (!session) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if player is host
    const player = session.players.find(p => p.id === playerId)
    if (!player?.isHost) {
      return NextResponse.json({ error: 'Only the host can advance the game' }, { status: 403 })
    }

    if (session.gameStatus !== 'playing') {
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 })
    }

    const nextQuestion = session.currentQuestion + 1

    if (nextQuestion >= session.totalQuestions) {
      // Game finished
      await prisma.gameSession.update({
        where: { id: session.id },
        data: {
          gameStatus: 'finished',
          isCompleted: true,
          completedAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, gameFinished: true })
    }

    // Move to next question
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        currentQuestion: nextQuestion,
        questionStartedAt: new Date(),
      },
    })

    // Reset all players' current answer for new question
    await prisma.player.updateMany({
      where: { gameSessionId: session.id },
      data: { currentAnswer: null, answeredAt: null },
    })

    return NextResponse.json({ 
      success: true, 
      currentQuestion: nextQuestion,
      gameFinished: false,
    })
  } catch (error) {
    console.error('Next question error:', error)
    return NextResponse.json({ error: 'Failed to advance game' }, { status: 500 })
  }
}
