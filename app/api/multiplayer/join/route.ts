import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const GAME_MODE_CONFIG: Record<string, { timePerQuestion: number }> = {
  classic: { timePerQuestion: 30 },
  rush: { timePerQuestion: 15 },
  survival: { timePerQuestion: 25 },
}

const MAX_PLAYERS_PER_GAME = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const gameCode = body?.gameCode?.toUpperCase()?.trim()
    const nickname = body?.nickname?.trim() || 'Player'

    if (!gameCode) {
      return NextResponse.json(
        { error: 'Game code is required' },
        { status: 400 }
      )
    }

    // Find the game session
    const session = await prisma.gameSession.findUnique({
      where: { gameCode },
      include: { players: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (!session.isMultiplayer) {
      return NextResponse.json(
        { error: 'This is not a multiplayer game' },
        { status: 400 }
      )
    }

    if (session.gameStatus !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      )
    }

    // Check player count
    const connectedPlayers = session.players.filter(p => p.isConnected)
    if (connectedPlayers.length >= MAX_PLAYERS_PER_GAME) {
      return NextResponse.json(
        { error: 'Game is full' },
        { status: 400 }
      )
    }

    // Check if nickname is already taken
    const existingPlayer = session.players.find(
      p => p.nickname.toLowerCase() === nickname.toLowerCase() && p.isConnected
    )
    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Nickname already taken in this game' },
        { status: 400 }
      )
    }

    // Create player
    const player = await prisma.player.create({
      data: {
        gameSessionId: session.id,
        nickname,
        isHost: false,
      },
    })

    const config = GAME_MODE_CONFIG[session.gameMode] || GAME_MODE_CONFIG.classic

    return NextResponse.json({
      success: true,
      gameCode: session.gameCode,
      sessionId: session.id,
      playerId: player.id,
      gameMode: session.gameMode,
      config: {
        timePerQuestion: config.timePerQuestion,
        totalQuestions: session.totalQuestions,
      },
    })
  } catch (error) {
    console.error('Join game error:', error)
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    )
  }
}
