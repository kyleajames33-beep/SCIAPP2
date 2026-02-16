import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const GAME_MODE_CONFIG: Record<string, { timePerQuestion: number }> = {
  classic: { timePerQuestion: 30 },
  rush: { timePerQuestion: 15 },
  survival: { timePerQuestion: 25 },
  boss_battle: { timePerQuestion: 20 },
}

const AUTO_ADVANCE_BUFFER_SECONDS = 3
const BOSS_ENRAGE_THRESHOLD_MS = 25000 // 25 seconds

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const gameCode = params.code?.toUpperCase()
  const playerId = req.nextUrl.searchParams.get('playerId')

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      let lastState = ''
      let isActive = true

      const poll = async () => {
        if (!isActive) return

        try {
          const session = await prisma.gameSession.findUnique({
            where: { gameCode },
            include: {
              players: {
                where: { isConnected: true },
                orderBy: { score: 'desc' },
              },
            },
          })

          if (!session) {
            sendEvent('error', { message: 'Game not found' })
            controller.close()
            return
          }

          const isBossBattle = session.gameMode === 'boss_battle'

          // BUG-8 FIX: Server-side auto-advance on timeout
          // Note: For boss battles, we still auto-advance questions but don't end game on question exhaustion
          if (session.gameStatus === 'playing' && session.questionStartedAt) {
            const config = GAME_MODE_CONFIG[session.gameMode] || GAME_MODE_CONFIG.classic
            const elapsed = (Date.now() - session.questionStartedAt.getTime()) / 1000
            const timeoutThreshold = config.timePerQuestion + AUTO_ADVANCE_BUFFER_SECONDS
            
            if (elapsed >= timeoutThreshold) {
              // Auto-advance to next question
              const nextQuestion = session.currentQuestion + 1
              
              // For boss battles, game ends when boss HP reaches 0, not when questions run out
              // If questions run out in boss battle, the players lose (boss wins)
              const gameFinished = isBossBattle 
                ? (nextQuestion >= session.totalQuestions) // Boss wins if questions exhaust
                : (nextQuestion >= session.totalQuestions)
              
              if (gameFinished) {
                // Game finished
                await prisma.gameSession.update({
                  where: { id: session.id },
                  data: {
                    gameStatus: 'finished',
                    isCompleted: true,
                    completedAt: new Date(),
                  },
                })
              } else {
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
              }
              
              // Continue polling with updated state
              setTimeout(poll, 100)
              return
            }
          }

          // Get current question if game is playing
          let currentQuestion = null
          if (session.gameStatus === 'playing' && session.questionIds[session.currentQuestion]) {
            const q = await prisma.question.findUnique({
              where: { id: session.questionIds[session.currentQuestion] },
            })
            if (q) {
              currentQuestion = {
                id: q.id,
                question: q.question,
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                topic: q.topic,
                // NOTE: correctAnswer is intentionally NOT sent
              }
            }
          }

          // Check who has answered current question
          const answeredPlayerIds = session.players
            .filter(p => p.currentAnswer !== null)
            .map(p => p.id)

          // Calculate boss enraged status (more than 25 seconds on current question)
          const bossEnraged = isBossBattle && session.questionStartedAt
            ? (Date.now() - session.questionStartedAt.getTime()) > BOSS_ENRAGE_THRESHOLD_MS
            : false

          // Determine if boss was defeated (HP <= 0)
          const bossDefeated = isBossBattle && session.bossHp !== null && session.bossHp <= 0

          const state = {
            gameStatus: session.gameStatus,
            currentQuestion: session.currentQuestion,
            totalQuestions: session.totalQuestions,
            gameMode: session.gameMode,
            players: session.players.map(p => ({
              id: p.id,
              nickname: p.nickname,
              score: p.score,
              streak: p.streak,
              isHost: p.isHost,
              hasAnswered: p.currentAnswer !== null,
            })),
            question: currentQuestion,
            questionStartedAt: session.questionStartedAt?.toISOString(),
            answeredCount: answeredPlayerIds.length,
            totalPlayers: session.players.length,
            // Boss Battle specific fields
            ...(isBossBattle && {
              bossHp: session.bossHp,
              bossMaxHp: session.bossMaxHp,
              bossEnraged,
              bossDefeated,
              isCooperative: session.isCooperative,
            }),
          }

          const stateString = JSON.stringify(state)
          if (stateString !== lastState) {
            lastState = stateString
            sendEvent('gameState', state)
          }

          // Continue polling
          if (session.gameStatus !== 'finished') {
            setTimeout(poll, 500) // Poll every 500ms
          } else {
            // Send final results
            sendEvent('gameFinished', {
              gameMode: session.gameMode,
              players: session.players.map(p => ({
                id: p.id,
                nickname: p.nickname,
                score: p.score,
                correctAnswers: p.correctAnswers,
                maxStreak: p.maxStreak,
                isHost: p.isHost,
              })),
              // Boss Battle specific results
              ...(isBossBattle && {
                bossDefeated: session.bossHp !== null && session.bossHp <= 0,
                bossHp: session.bossHp,
                bossMaxHp: session.bossMaxHp,
                questionsAnswered: session.currentQuestion + 1,
              }),
            })
            controller.close()
          }
        } catch (error) {
          console.error('Stream poll error:', error)
          setTimeout(poll, 1000)
        }
      }

      // Update player connection status
      if (playerId) {
        await prisma.player.update({
          where: { id: playerId },
          data: { isConnected: true },
        }).catch(() => {})
      }

      // Start polling
      poll()

      // Handle cleanup when client disconnects
      req.signal.addEventListener('abort', async () => {
        isActive = false
        if (playerId) {
          await prisma.player.update({
            where: { id: playerId },
            data: { isConnected: false },
          }).catch(() => {})
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
