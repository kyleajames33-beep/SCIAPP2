-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
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
    "lifetimeEarnings" BIGINT NOT NULL DEFAULT 0,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "lastChallengeDate" TIMESTAMP(3),
    "challengesCompleted" INTEGER NOT NULL DEFAULT 0,
    "bodyType" TEXT NOT NULL DEFAULT 'athletic',
    "hairColor" TEXT NOT NULL DEFAULT 'blue',
    "weaponType" TEXT NOT NULL DEFAULT 'sword',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUpgrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "upgradeId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserUpgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "highestFloor" INTEGER NOT NULL DEFAULT 0,
    "bestTime" INTEGER NOT NULL DEFAULT 0,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL DEFAULT 'Chemistry',
    "module" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionSetId" TEXT,
    "gameMode" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "maxStreak" INTEGER NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'Chemistry',
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "explanation" TEXT,
    "questionSetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "gameCode" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT 'classic',
    "isMultiplayer" BOOLEAN NOT NULL DEFAULT false,
    "hostId" TEXT,
    "userId" TEXT,
    "questionSetId" TEXT,
    "totalQuestions" INTEGER NOT NULL DEFAULT 10,
    "currentQuestion" INTEGER NOT NULL DEFAULT 0,
    "gameStatus" TEXT NOT NULL DEFAULT 'waiting',
    "questionIds" TEXT[],
    "questionStartedAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "maxStreak" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "bossHp" INTEGER,
    "bossMaxHp" INTEGER,
    "isCooperative" BOOLEAN NOT NULL DEFAULT false,
    "currentFloor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "userId" TEXT,
    "nickname" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "maxStreak" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "currentAnswer" INTEGER,
    "answeredAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAnswer" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "playerId" TEXT,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserUpgrade_userId_idx" ON "UserUpgrade"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserUpgrade_userId_upgradeId_key" ON "UserUpgrade"("userId", "upgradeId");

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "UserProgress_mode_highestFloor_idx" ON "UserProgress"("mode", "highestFloor" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_mode_key" ON "UserProgress"("userId", "mode");

-- CreateIndex
CREATE INDEX "QuestionSet_creatorId_idx" ON "QuestionSet"("creatorId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_questionSetId_gameMode_score_idx" ON "LeaderboardEntry"("questionSetId", "gameMode", "score" DESC);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_userId_idx" ON "LeaderboardEntry"("userId");

-- CreateIndex
CREATE INDEX "Question_questionSetId_idx" ON "Question"("questionSetId");

-- CreateIndex
CREATE INDEX "Question_subject_idx" ON "Question"("subject");

-- CreateIndex
CREATE INDEX "Question_topic_idx" ON "Question"("topic");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_gameCode_key" ON "GameSession"("gameCode");

-- CreateIndex
CREATE INDEX "GameSession_userId_idx" ON "GameSession"("userId");

-- CreateIndex
CREATE INDEX "GameSession_questionSetId_idx" ON "GameSession"("questionSetId");

-- CreateIndex
CREATE INDEX "GameSession_gameStatus_idx" ON "GameSession"("gameStatus");

-- CreateIndex
CREATE INDEX "Player_gameSessionId_idx" ON "Player"("gameSessionId");

-- CreateIndex
CREATE INDEX "Player_userId_idx" ON "Player"("userId");

-- CreateIndex
CREATE INDEX "PlayerAnswer_gameSessionId_idx" ON "PlayerAnswer"("gameSessionId");

-- CreateIndex
CREATE INDEX "PlayerAnswer_playerId_idx" ON "PlayerAnswer"("playerId");

-- AddForeignKey
ALTER TABLE "UserUpgrade" ADD CONSTRAINT "UserUpgrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAnswer" ADD CONSTRAINT "PlayerAnswer_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAnswer" ADD CONSTRAINT "PlayerAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAnswer" ADD CONSTRAINT "PlayerAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
