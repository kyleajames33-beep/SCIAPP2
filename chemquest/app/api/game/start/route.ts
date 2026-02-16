import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

type GameMode = 'classic' | 'rush' | 'survival' | 'boss_battle' | 'tower_climb'

const GAME_MODE_CONFIG: Record<GameMode, { 
  questions: number; 
  timePerQuestion: number; 
  lives?: number;
  bossHp?: number;  // For boss battles
}> = {
  classic: { questions: 10, timePerQuestion: 30 },
  rush: { questions: 20, timePerQuestion: 15 },
  survival: { questions: 50, timePerQuestion: 25, lives: 3 },
  boss_battle: { questions: 15, timePerQuestion: 20, bossHp: 1000 },
  tower_climb: { questions: 100, timePerQuestion: 30, lives: 3 },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const gameMode: GameMode = body?.gameMode || 'classic'
    const questionSetId: string | null = body?.questionSetId || null
    const subject: string | null = body?.subject || null  // Subject filter
    const chamberId: string | null = body?.chamberId || null  // Campaign chamber
    const worldId: string | null = body?.worldId || null      // Campaign world
    const bossId: string | null = body?.bossId || null        // Campaign boss
    const config = GAME_MODE_CONFIG[gameMode] || GAME_MODE_CONFIG.classic
    const totalQuestions = config.questions

    // Get authenticated user (if any) for persistent coins
    const user = await getSessionUser()

    // SUBSCRIPTION GATING: Check if free user is trying to access premium content
    if (user && chamberId && worldId) {
      // Extract module number from worldId (e.g., "module-2" -> 2)
      const moduleMatch = worldId.match(/module-(\d+)/)
      const moduleNumber = moduleMatch ? parseInt(moduleMatch[1]) : 0
      
      // Module 1 is free, modules 2-8 require Pro subscription
      if (moduleNumber >= 2) {
        // Fetch user's subscription tier
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: { subscriptionTier: true }
        })
        
        if (userData?.subscriptionTier !== 'pro') {
          return NextResponse.json(
            { 
              error: 'Premium content locked',
              message: 'This content requires a Pro subscription',
              requiredTier: 'pro',
              currentTier: userData?.subscriptionTier || 'free',
              redirectUrl: '/pricing'
            },
            { status: 403 }
          )
        }
      }
    }

    // Build query for questions based on questionSetId and subject
    const whereClause: Record<string, unknown> = {}
    
    if (questionSetId) {
      whereClause.questionSetId = questionSetId
    } else {
      whereClause.questionSetId = null // Default questions have no questionSetId
    }
    
    // Add subject filter if provided
    if (subject) {
      whereClause.subject = subject
    }

    // Get random questions from the specified set (or default)
    const allQuestions = await prisma.question.findMany({ where: whereClause })
    const shuffled = allQuestions?.sort(() => 0.5 - Math.random())
    const selectedQuestions = shuffled?.slice(0, totalQuestions) || []
    
    // Store question IDs for the session
    const questionIds = selectedQuestions.map(q => q.id)

    // Create game session with optional userId and questionSetId
    const gameCode = generateGameCode()
    const session = await prisma.gameSession.create({
      data: {
        gameCode,
        gameMode,
        totalQuestions,
        questionIds,
        userId: user?.id || null,
        questionSetId: questionSetId || null,
        // Boss battle fields
        bossHp: config.bossHp || null,
        bossMaxHp: config.bossHp || null,
        // Tower climb starts at floor 0
        currentFloor: gameMode === 'tower_climb' ? 0 : 0,
      },
    })

    // Get user upgrades and gems if authenticated
    let userUpgrades: Record<string, number> = {}
    let gems = 0
    let prestigeLevel = 0
    
    if (user) {
      // Fetch upgrades
      const upgrades = await prisma.userUpgrade.findMany({
        where: { userId: user.id },
      })
      userUpgrades = upgrades.reduce((acc, u) => {
        acc[u.upgradeId] = u.level
        return acc
      }, {} as Record<string, number>)
      
      // Fetch gems and prestige level from full user record
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { gems: true, prestigeLevel: true },
      })
      gems = fullUser?.gems ?? 0
      prestigeLevel = fullUser?.prestigeLevel ?? 0
    }

    return NextResponse.json({
      sessionId: session?.id || '',
      gameCode: session?.gameCode || '',
      gameMode,
      // Campaign context (if applicable)
      campaign: chamberId ? { chamberId, worldId, bossId } : null,
      config: {
        timePerQuestion: config.timePerQuestion,
        lives: config.lives,
        totalQuestions: config.questions,
        bossHp: config.bossHp,
        bossMaxHp: config.bossHp,
      },
      // Return user info including persistent coins, gems, and upgrades
      user: user ? {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        totalCoins: user.totalCoins,
        gems,
        prestigeLevel,
        upgrades: userUpgrades,
      } : null,
      // Remove correctAnswer from response
      questions: selectedQuestions?.map((q) => ({
        id: q?.id || '',
        question: q?.question || '',
        optionA: q?.optionA || '',
        optionB: q?.optionB || '',
        optionC: q?.optionC || '',
        optionD: q?.optionD || '',
        // correctAnswer is intentionally NOT sent to client
        subject: q?.subject || 'Chemistry',
        topic: q?.topic || '',
        difficulty: q?.difficulty || '',
      })) || [],
    })
  } catch (error) {
    console.error('Start game error:', error)
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}
