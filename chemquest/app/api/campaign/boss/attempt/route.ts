import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { checkRankUp, calculateBossXP, getRankInfo } from "@/lib/rank-system";

export const dynamic = "force-dynamic";

interface BossAttemptRequest {
  bossId: string;
  damageDealt: number;
  questionsAnswered: number;
  correctAnswers: number;
  streak: number;
  timeRemaining: number;
  victory: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BossAttemptRequest = await request.json();
    const {
      bossId,
      damageDealt,
      questionsAnswered,
      correctAnswers,
      streak,
      timeRemaining,
      victory
    } = body;

    // Validate required fields
    if (!bossId || damageDealt === undefined || victory === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        totalScore: true,
        totalCoins: true,
        gems: true,
        lifetimeEarnings: true
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousXP = currentUser.totalScore;

    // Calculate rewards - map boss IDs to difficulty levels
    const bossLevelMap: Record<string, number> = {
      "acid-baron": 1,
      "redox-reaper": 2,
      "organic-overlord": 3,
      "thermo-titan": 4,
      "equilibrium-emperor": 5,
      "kinetic-king": 6,
      "atomic-archmage": 7,
      "solution-sovereign": 8,
      "chemical-overlord": 9
    };
    const bossLevel = bossLevelMap[bossId] || 1;
    
    // Chemical Overlord: Special +100 XP bonus for victory
    const isChemicalOverlord = bossId === "chemical-overlord";
    const baseXp = calculateBossXP(damageDealt, bossLevel, streak, timeRemaining);
    const xpEarned = isChemicalOverlord && victory ? baseXp + 100 : baseXp;
    
    const coinsEarned = victory
      ? Math.floor(damageDealt * 0.3) + (correctAnswers * 10) + (streak * 5)
      : Math.floor(damageDealt * 0.1);
    const gemsEarned = victory ? Math.floor(bossLevel * 2) + Math.floor(streak / 3) : 0;

    // Update user stats
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        totalScore: { increment: xpEarned },
        totalXP: { increment: xpEarned },
        totalCoins: { increment: coinsEarned },
        gems: { increment: gemsEarned },
        lifetimeEarnings: { increment: BigInt(coinsEarned) },
        totalCorrect: { increment: correctAnswers },
        totalIncorrect: { increment: questionsAnswered - correctAnswers },
        gamesPlayed: { increment: 1 },
        bestStreak: {
          set: Math.max(currentUser.totalScore > 0 ? streak : 0, streak)
        }
      }
    });

    // Check for rank up
    const newXP = previousXP + xpEarned;
    const rankUpResult = checkRankUp(previousXP, newXP);
    const rankInfo = getRankInfo(newXP);

    // Update or create boss progress
    await prisma.userProgress.upsert({
      where: {
        userId_mode: {
          userId: user.id,
          mode: `boss_${bossId}`
        }
      },
      update: {
        totalRuns: { increment: 1 },
        highestFloor: victory ? { increment: 1 } : undefined,
        bestTime: timeRemaining > 0 ? Math.max(timeRemaining) : undefined
      },
      create: {
        userId: user.id,
        mode: `boss_${bossId}`,
        highestFloor: victory ? 1 : 0,
        bestTime: timeRemaining,
        totalRuns: 1
      }
    });

    // If victory, unlock next world/chamber
    let unlockedContent = null;
    if (victory) {
      // Logic to unlock next content would go here
      // This depends on your campaign.json structure
      unlockedContent = {
        type: "chamber",
        id: `chamber-${bossLevel + 1}`
      };
    }

    return NextResponse.json({
      success: true,
      rewards: {
        xp: xpEarned,
        coins: coinsEarned,
        gems: gemsEarned
      },
      rankUp: rankUpResult.didRankUp ? {
        previous: rankUpResult.previousRank,
        new: rankUpResult.newRank
      } : null,
      rankInfo,
      victory,
      unlockedContent,
      stats: {
        damageDealt,
        questionsAnswered,
        correctAnswers,
        accuracy: questionsAnswered > 0 
          ? Math.round((correctAnswers / questionsAnswered) * 100) 
          : 0,
        bestStreak: streak
      }
    });
  } catch (error) {
    console.error("Boss attempt error:", error);
    return NextResponse.json(
      { error: "Failed to process boss attempt" },
      { status: 500 }
    );
  }
}
