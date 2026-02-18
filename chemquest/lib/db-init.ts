import { PrismaClient } from '@prisma/client'

const globalForInit = globalThis as unknown as {
  dbSchemaInitialized: boolean | undefined
}

/**
 * Ensures the database schema is initialized.
 * On Vercel with /tmp SQLite, we need to create tables on cold starts.
 * 
 * This uses raw SQL to create tables if they don't exist.
 */
export async function ensureDatabaseSchema(prisma: PrismaClient): Promise<void> {
  // Skip if already initialized in this process
  if (globalForInit.dbSchemaInitialized) {
    console.log('[DB-INIT] Schema already initialized in this process')
    return
  }

  console.log('[DB-INIT] Starting schema initialization check...')

  try {
    // Try a simple query to check if database is working
    // If database doesn't exist, SQLite will create it on first write
    let tablesExist = false
    
    try {
      const tables = await prisma.$queryRaw<Array<{name: string}>>`
        SELECT name FROM sqlite_master WHERE type='table' AND name='User'
      `
      tablesExist = tables.length > 0
      console.log('[DB-INIT] User table check:', tablesExist ? 'EXISTS' : 'NOT FOUND')
    } catch (queryError) {
      console.log('[DB-INIT] Database query failed, will create schema:', queryError instanceof Error ? queryError.message : queryError)
      tablesExist = false
    }
    
    if (!tablesExist) {
      console.log('[DB-INIT] Creating database schema...')
      
      // Create the essential tables using raw SQL
      // User table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "username" TEXT NOT NULL,
          "displayName" TEXT NOT NULL,
          "email" TEXT,
          "passwordHash" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'student',
          "totalCoins" INTEGER NOT NULL DEFAULT 0,
          "totalScore" INTEGER NOT NULL DEFAULT 0,
          "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
          "gamesWon" INTEGER NOT NULL DEFAULT 0,
          "bestStreak" INTEGER NOT NULL DEFAULT 0,
          "totalCorrect" INTEGER NOT NULL DEFAULT 0,
          "totalIncorrect" INTEGER NOT NULL DEFAULT 0,
          "gems" INTEGER NOT NULL DEFAULT 0,
          "prestigeLevel" INTEGER NOT NULL DEFAULT 0,
          "lifetimeEarnings" INTEGER NOT NULL DEFAULT 0,
          "referralCode" TEXT,
          "referredBy" TEXT,
          "referralCount" INTEGER NOT NULL DEFAULT 0,
          "lastChallengeDate" DATETIME,
          "challengesCompleted" INTEGER NOT NULL DEFAULT 0,
          "bodyType" TEXT NOT NULL DEFAULT 'strong',
          "hairColor" TEXT NOT NULL DEFAULT 'red',
          "weaponType" TEXT NOT NULL DEFAULT 'hammer',
          "accessories" TEXT NOT NULL DEFAULT '',
          "ownedItems" TEXT NOT NULL DEFAULT '[]',
          "rank" TEXT NOT NULL DEFAULT 'Hydrogen',
          "campaignXp" INTEGER NOT NULL DEFAULT 0,
          "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('[DB-INIT] User table created')
      
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`
      console.log('[DB-INIT] User indexes created')

      // Create Question table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Question" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "question" TEXT NOT NULL,
          "optionA" TEXT NOT NULL,
          "optionB" TEXT NOT NULL,
          "optionC" TEXT NOT NULL,
          "optionD" TEXT NOT NULL,
          "correctAnswer" INTEGER NOT NULL,
          "subject" TEXT NOT NULL DEFAULT 'Chemistry',
          "topic" TEXT NOT NULL DEFAULT 'General',
          "difficulty" TEXT NOT NULL DEFAULT 'medium',
          "explanation" TEXT,
          "questionSetId" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('[DB-INIT] Question table created')

      // Create QuestionSet table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "QuestionSet" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "subject" TEXT NOT NULL DEFAULT 'Chemistry',
          "module" TEXT,
          "isPublic" INTEGER NOT NULL DEFAULT 0,
          "creatorId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('[DB-INIT] QuestionSet table created')

      // Create GameSession table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "GameSession" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "gameCode" TEXT NOT NULL,
          "gameMode" TEXT NOT NULL DEFAULT 'classic',
          "isMultiplayer" INTEGER NOT NULL DEFAULT 0,
          "hostId" TEXT,
          "userId" TEXT,
          "questionSetId" TEXT,
          "totalQuestions" INTEGER NOT NULL DEFAULT 10,
          "currentQuestion" INTEGER NOT NULL DEFAULT 0,
          "gameStatus" TEXT NOT NULL DEFAULT 'waiting',
          "questionIds" TEXT NOT NULL DEFAULT '[]',
          "questionStartedAt" DATETIME,
          "score" INTEGER NOT NULL DEFAULT 0,
          "streak" INTEGER NOT NULL DEFAULT 0,
          "maxStreak" INTEGER NOT NULL DEFAULT 0,
          "correctAnswers" INTEGER NOT NULL DEFAULT 0,
          "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
          "isCompleted" INTEGER NOT NULL DEFAULT 0,
          "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" DATETIME,
          "bossHp" INTEGER,
          "bossMaxHp" INTEGER,
          "isCooperative" INTEGER NOT NULL DEFAULT 0,
          "currentFloor" INTEGER NOT NULL DEFAULT 0
        )
      `
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "GameSession_gameCode_key" ON "GameSession"("gameCode")`
      console.log('[DB-INIT] GameSession table created')

      // Create Player table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Player" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "gameSessionId" TEXT NOT NULL,
          "userId" TEXT,
          "nickname" TEXT NOT NULL,
          "score" INTEGER NOT NULL DEFAULT 0,
          "streak" INTEGER NOT NULL DEFAULT 0,
          "maxStreak" INTEGER NOT NULL DEFAULT 0,
          "correctAnswers" INTEGER NOT NULL DEFAULT 0,
          "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
          "isHost" INTEGER NOT NULL DEFAULT 0,
          "isConnected" INTEGER NOT NULL DEFAULT 1,
          "currentAnswer" INTEGER,
          "answeredAt" DATETIME,
          "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE
        )
      `
      console.log('[DB-INIT] Player table created')

      // Create LeaderboardEntry table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "LeaderboardEntry" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "questionSetId" TEXT,
          "gameMode" TEXT NOT NULL,
          "score" INTEGER NOT NULL,
          "accuracy" REAL NOT NULL,
          "maxStreak" INTEGER NOT NULL,
          "timeTaken" INTEGER NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id")
        )
      `
      console.log('[DB-INIT] LeaderboardEntry table created')

      // Create other essential tables
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "UserUpgrade" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "upgradeId" TEXT NOT NULL,
          "level" INTEGER NOT NULL DEFAULT 1,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "UserUpgrade_userId_upgradeId_key" ON "UserUpgrade"("userId", "upgradeId")`
      console.log('[DB-INIT] UserUpgrade table created')

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "UserProgress" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "mode" TEXT NOT NULL,
          "highestFloor" INTEGER NOT NULL DEFAULT 0,
          "bestTime" INTEGER NOT NULL DEFAULT 0,
          "totalRuns" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "UserProgress_userId_mode_key" ON "UserProgress"("userId", "mode")`
      console.log('[DB-INIT] UserProgress table created')

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "PlayerAnswer" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "gameSessionId" TEXT NOT NULL,
          "playerId" TEXT,
          "questionId" TEXT NOT NULL,
          "selectedAnswer" INTEGER NOT NULL,
          "isCorrect" INTEGER NOT NULL,
          "timeSpent" INTEGER NOT NULL,
          "pointsEarned" INTEGER NOT NULL,
          "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE
        )
      `
      console.log('[DB-INIT] PlayerAnswer table created')

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "CampaignProgress" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "chamberId" TEXT NOT NULL,
          "worldId" TEXT NOT NULL,
          "completed" INTEGER NOT NULL DEFAULT 0,
          "bestScore" INTEGER NOT NULL DEFAULT 0,
          "xpEarned" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "CampaignProgress_userId_chamberId_key" ON "CampaignProgress"("userId", "chamberId")`
      console.log('[DB-INIT] CampaignProgress table created')

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "BossAttempt" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "bossId" TEXT NOT NULL,
          "defeated" INTEGER NOT NULL DEFAULT 0,
          "damageDealt" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        )
      `
      console.log('[DB-INIT] BossAttempt table created')

      console.log('[DB-INIT] All tables created successfully!')
    }
    
    globalForInit.dbSchemaInitialized = true
    console.log('[DB-INIT] Schema initialization complete')
  } catch (error) {
    console.error('[DB-INIT] Error initializing schema:', error)
    console.error('[DB-INIT] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}
