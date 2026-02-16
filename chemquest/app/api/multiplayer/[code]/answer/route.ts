import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const GAME_MODE_CONFIG: Record<string, { timePerQuestion: number }> = {
  classic: { timePerQuestion: 30 },
  rush: { timePerQuestion: 15 },
  survival: { timePerQuestion: 25 },
  boss_battle: { timePerQuestion: 20 },
}

// Boss Battle Configuration
const BOSS_CONFIG = {
  baseDamage: 50,
  streakDamageBonus: 10,      // per streak count
  upgradeBonus: 5,            // per upgrade level
  healAmount: 20,             // HP healed on wrong answer
  enragedHealAmount: 50,      // HP healed when enraged
  enrageTimeThreshold: 25000, // 25 seconds in ms
  gemsPerQuestion: 5,         // gems awarded per question on victory
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const gameCode = params.code?.toUpperCase()
    const body = await req.json()
    const { playerId, selectedAnswer } = body

    if (!playerId || selectedAnswer === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const session = await prisma.gameSession.findUnique({
      where: { gameCode },
    })

    if (!session) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (session.gameStatus !== 'playing') {
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 })
    }

    // Get current question
    const questionId = session.questionIds[session.currentQuestion]
    const question = await prisma.question.findUnique({ where: { id: questionId } })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const isCorrect = selectedAnswer === question.correctAnswer
    const config = GAME_MODE_CONFIG[session.gameMode] || GAME_MODE_CONFIG.classic
    const isBossBattle = session.gameMode === 'boss_battle'
    
    // Calculate time spent
    const timeSpent = session.questionStartedAt
      ? Math.floor((Date.now() - session.questionStartedAt.getTime()) / 1000)
      : config.timePerQuestion

    // Check if boss is enraged (more than 25 seconds elapsed)
    const bossEnraged = isBossBattle && session.questionStartedAt
      ? (Date.now() - session.questionStartedAt.getTime()) > BOSS_CONFIG.enrageTimeThreshold
      : false

    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Get fresh player data within transaction
      const player = await tx.player.findUnique({ where: { id: playerId } })
      
      if (!player || player.gameSessionId !== session.id) {
        throw new Error('Player not found in this game')
      }

      // Check if already answered
      if (player.currentAnswer !== null) {
        throw new Error('Already answered this question')
      }

      // Calculate points
      let pointsEarned = 0
      let newStreak = player.streak
      let bossDamage = 0
      let bossHeal = 0
      let bossDefeated = false
      let gemsAwarded = 0
      
      if (isCorrect) {
        const basePoints = 100
        newStreak = player.streak + 1
        
        // Streak multiplier
        let multiplier = 1
        if (newStreak >= 7) multiplier = 5
        else if (newStreak >= 5) multiplier = 3
        else if (newStreak >= 3) multiplier = 2
        
        // Speed bonus for rush mode
        let speedBonus = 0
        if (session.gameMode === 'rush') {
          const timeRemaining = config.timePerQuestion - timeSpent
          if (timeRemaining > 5) {
            speedBonus = Math.floor(timeRemaining * 15)
          }
        }
        
        pointsEarned = (basePoints * multiplier) + speedBonus

        // Boss Battle: Calculate damage
        if (isBossBattle && session.bossHp !== null) {
          // Get user upgrade for boss_damage if player has a linked user
          let upgradeLevel = 0
          if (player.userId) {
            const upgrade = await tx.userUpgrade.findUnique({
              where: { userId_upgradeId: { userId: player.userId, upgradeId: 'boss_damage' } },
            })
            upgradeLevel = upgrade?.level ?? 0
          }

          bossDamage = BOSS_CONFIG.baseDamage 
            + (newStreak * BOSS_CONFIG.streakDamageBonus)
            + (upgradeLevel * BOSS_CONFIG.upgradeBonus)
        }
      } else {
        newStreak = 0

        // Boss Battle: Boss heals on wrong answer
        if (isBossBattle && session.bossHp !== null && session.bossMaxHp !== null) {
          bossHeal = bossEnraged ? BOSS_CONFIG.enragedHealAmount : BOSS_CONFIG.healAmount
        }
      }

      // Update player within transaction
      await tx.player.update({
        where: { id: playerId },
        data: {
          currentAnswer: selectedAnswer,
          answeredAt: new Date(),
          score: player.score + pointsEarned,
          streak: newStreak,
          maxStreak: Math.max(player.maxStreak, newStreak),
          correctAnswers: isCorrect ? player.correctAnswers + 1 : player.correctAnswers,
          incorrectAnswers: !isCorrect ? player.incorrectAnswers + 1 : player.incorrectAnswers,
        },
      })

      // Record the answer within transaction
      await tx.playerAnswer.create({
        data: {
          gameSessionId: session.id,
          playerId,
          questionId,
          selectedAnswer,
          isCorrect,
          timeSpent,
          pointsEarned,
        },
      })

      // Boss Battle: Update boss HP
      let newBossHp = session.bossHp
      if (isBossBattle && session.bossHp !== null && session.bossMaxHp !== null) {
        if (bossDamage > 0) {
          newBossHp = Math.max(0, session.bossHp - bossDamage)
        } else if (bossHeal > 0) {
          newBossHp = Math.min(session.bossMaxHp, session.bossHp + bossHeal)
        }

        // Check if boss is defeated
        bossDefeated = newBossHp !== null && newBossHp <= 0

        // Update session with new boss HP
        const sessionUpdate: Record<string, unknown> = { bossHp: newBossHp }
        
        if (bossDefeated) {
          sessionUpdate.gameStatus = 'finished'
          sessionUpdate.isCompleted = true
          sessionUpdate.completedAt = new Date()
        }

        await tx.gameSession.update({
          where: { id: session.id },
          data: sessionUpdate,
        })

        // Award gems to ALL players if boss is defeated
        if (bossDefeated) {
          gemsAwarded = BOSS_CONFIG.gemsPerQuestion * (session.currentQuestion + 1)
          
          // Get all players in this session with linked users
          const allPlayers = await tx.player.findMany({
            where: { gameSessionId: session.id, userId: { not: null } },
            select: { userId: true },
          })

          // Award gems to each user
          for (const p of allPlayers) {
            if (p.userId) {
              await tx.user.update({
                where: { id: p.userId },
                data: { gems: { increment: gemsAwarded } },
              })
            }
          }
        }
      }

      return { 
        pointsEarned, 
        newStreak, 
        bossDamage, 
        bossHeal, 
        bossDefeated, 
        newBossHp,
        gemsAwarded,
        bossEnraged,
      }
    })

    return NextResponse.json({
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      pointsEarned: result.pointsEarned,
      newStreak: result.newStreak,
      // Boss Battle specific response
      ...(isBossBattle && {
        bossDamage: result.bossDamage,
        bossHeal: result.bossHeal,
        bossDefeated: result.bossDefeated,
        bossHp: result.newBossHp,
        bossEnraged: result.bossEnraged,
        gemsAwarded: result.gemsAwarded,
      }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit answer'
    
    // Handle specific errors
    if (message === 'Player not found in this game') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    if (message === 'Already answered this question') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    
    console.error('Submit answer error:', error)
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
  }
}
