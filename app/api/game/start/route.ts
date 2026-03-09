import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type GameMode = 'classic' | 'rush' | 'survival' | 'boss_battle' | 'tower_climb'

const GAME_MODE_CONFIG: Record<GameMode, {
  questions: number
  timePerQuestion: number
  lives?: number
  bossHp?: number
}> = {
  classic: { questions: 10, timePerQuestion: 30 },
  rush: { questions: 20, timePerQuestion: 15 },
  survival: { questions: 50, timePerQuestion: 25, lives: 3 },
  boss_battle: { questions: 15, timePerQuestion: 20, bossHp: 1000 },
  tower_climb: { questions: 100, timePerQuestion: 30, lives: 3 },
}

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function generateId() {
  return `gs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const gameMode: GameMode = body?.gameMode || 'classic'
    const setId: string | null = body?.questionSetId || body?.setId || null
    const questionCount: number | null = body?.questionCount || null
    const config = GAME_MODE_CONFIG[gameMode] || GAME_MODE_CONFIG.classic
    const totalQuestions = questionCount || config.questions

    // Fetch questions from the specified set (or random from all sets)
    let query = supabaseAdmin.from('Question').select(
      'id, question, "optionA", "optionB", "optionC", "optionD", subject, topic, difficulty, explanation'
    )

    if (setId) {
      query = query.eq('questionSetId', setId)
    } else {
      // Pull from all public sets (exclude boss questions for default games)
      query = query.not('questionSetId', 'is', null).neq('questionSetId', 'qs-boss')
    }

    const { data: allQuestions, error: qError } = await query

    if (qError) {
      console.error('[GAME_START] Question fetch error:', qError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this set' }, { status: 404 })
    }

    // Shuffle and select
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random())
    const selectedQuestions = shuffled.slice(0, totalQuestions)
    const questionIds = selectedQuestions.map(q => q.id)

    // Create GameSession row
    const sessionId = generateId()
    const gameCode = generateGameCode()

    const { error: sessionError } = await supabaseAdmin.from('GameSession').insert({
      id: sessionId,
      gameCode,
      gameMode,
      totalQuestions: selectedQuestions.length,
      questionIds: JSON.stringify(questionIds),
      questionSetId: setId || null,
      gameStatus: 'playing',
      bossHp: config.bossHp || null,
      bossMaxHp: config.bossHp || null,
      currentFloor: gameMode === 'tower_climb' ? 0 : 0,
    })

    if (sessionError) {
      console.error('[GAME_START] Session create error:', sessionError)
      return NextResponse.json({ error: 'Failed to create game session' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId,
      gameId: sessionId,
      gameCode,
      gameMode,
      campaign: null,
      config: {
        timePerQuestion: config.timePerQuestion,
        timeLimitSeconds: config.timePerQuestion,
        lives: config.lives,
        totalQuestions: selectedQuestions.length,
        bossHp: config.bossHp,
        bossMaxHp: config.bossHp,
      },
      user: null,
      questions: selectedQuestions.map(q => ({
        id: q.id,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        // correctAnswer intentionally omitted
        subject: q.subject || 'Chemistry',
        topic: q.topic || '',
        difficulty: q.difficulty || '',
      })),
      data: {
        gameId: sessionId,
        timeLimitSeconds: config.timePerQuestion,
        questions: selectedQuestions.map(q => ({
          id: q.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          subject: q.subject || 'Chemistry',
          topic: q.topic || '',
          difficulty: q.difficulty || '',
        })),
      },
    })
  } catch (error) {
    console.error('[GAME_START] Error:', error)
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }
}
