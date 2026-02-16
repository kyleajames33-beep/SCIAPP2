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
      return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 })
    }

    if (session.gameStatus !== 'waiting') {
      return NextResponse.json({ error: 'Game has already started' }, { status: 400 })
    }

    if (session.players.length < 1) {
      return NextResponse.json({ error: 'Need at least 1 player to start' }, { status: 400 })
    }

    // Start the game
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        gameStatus: 'playing',
        currentQuestion: 0,
        questionStartedAt: new Date(),
      },
    })

    // Reset all players' current answer
    await prisma.player.updateMany({
      where: { gameSessionId: session.id },
      data: { currentAnswer: null, answeredAt: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Start game error:', error)
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }
}
