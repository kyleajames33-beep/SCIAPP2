import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

type GameMode = 'classic' | 'rush' | 'survival' | 'boss_battle'

const GAME_MODE_CONFIG: Record<GameMode, { 
  questions: number; 
  timePerQuestion: number;
  bossHp?: number;
}> = {
  classic: { questions: 10, timePerQuestion: 30 },
  rush: { questions: 15, timePerQuestion: 15 },
  survival: { questions: 20, timePerQuestion: 25 },
  boss_battle: { questions: 15, timePerQuestion: 20, bossHp: 1000 },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nickname = body?.nickname || 'Host'
    const gameMode: GameMode = body?.gameMode || 'classic'
    const config = GAME_MODE_CONFIG[gameMode] || GAME_MODE_CONFIG.classic

    // Get random questions
    const allQuestions = await prisma.question.findMany()
    const shuffled = allQuestions?.sort(() => 0.5 - Math.random())
    const selectedQuestions = shuffled?.slice(0, config.questions) || []
    const questionIds = selectedQuestions.map(q => q.id)

    // Generate unique game code
    let gameCode = generateGameCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.gameSession.findUnique({ where: { gameCode } })
      if (!existing) break
      gameCode = generateGameCode()
      attempts++
    }

    // Determine if this is a boss battle (cooperative mode)
    const isBossBattle = gameMode === 'boss_battle'

    // Create game session
    const session = await prisma.gameSession.create({
      data: {
        gameCode,
        gameMode,
        isMultiplayer: true,
        totalQuestions: config.questions,
        questionIds,
        gameStatus: 'waiting',
        // Boss Battle specific fields
        bossHp: isBossBattle ? config.bossHp : null,
        bossMaxHp: isBossBattle ? config.bossHp : null,
        isCooperative: isBossBattle,
      },
    })

    // Create host player
    const host = await prisma.player.create({
      data: {
        gameSessionId: session.id,
        nickname,
        isHost: true,
      },
    })

    // Update session with host ID
    await prisma.gameSession.update({
      where: { id: session.id },
      data: { hostId: host.id },
    })

    return NextResponse.json({
      success: true,
      gameCode: session.gameCode,
      sessionId: session.id,
      playerId: host.id,
      gameMode,
      config: {
        timePerQuestion: config.timePerQuestion,
        totalQuestions: config.questions,
        // Include boss battle info
        bossHp: isBossBattle ? config.bossHp : undefined,
        bossMaxHp: isBossBattle ? config.bossHp : undefined,
        isCooperative: isBossBattle,
      },
    })
  } catch (error) {
    console.error('Create multiplayer game error:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}
