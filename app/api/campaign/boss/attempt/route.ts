import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRankUp } from "@/lib/ranks";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function calculateRewards(
  victory: boolean,
  damageDealt: number,
  correctAnswers: number,
  streak: number
) {
  if (victory) {
    return {
      xp: 100 + streak * 10,
      coins: Math.floor(damageDealt * 0.3) + correctAnswers * 10 + streak * 5,
      gems: Math.floor(streak / 3) + 1,
    };
  }
  return {
    xp: 20,
    coins: Math.floor(damageDealt * 0.1),
    gems: 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bossId,
      damageDealt = 0,
      questionsAnswered = 0,
      correctAnswers = 0,
      streak = 0,
      victory = false,
    } = body;

    if (!bossId) {
      return json({ error: "Missing bossId" }, 400);
    }

    // Check auth via the auth-me edge function
    const authHeader = request.headers.get("authorization") || "";
    let userId: string | null = null;

    try {
      const authRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-me`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        }
      );
      const authData = await authRes.json();
      if (!authData.isGuest && authData.id) {
        userId = authData.id as string;
      }
    } catch {
      // auth unreachable — treat as guest
    }

    // Guest: return empty rewards (no 503, frontend handles null gracefully)
    if (!userId) {
      return json({ rewards: null, rankUp: null });
    }

    // Logged-in user path
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const rewards = calculateRewards(victory, damageDealt, correctAnswers, streak);

    // Save the attempt record
    await db.from("BossAttempt").insert({
      id: crypto.randomUUID(),
      userId,
      bossId,
      defeated: victory,
      damageDealt,
    });

    // Read current user stats then increment (single-player, so no concurrency issue)
    const { data: user } = await db
      .from("User")
      .select("totalScore, campaignXp, totalCoins, gems, gamesPlayed, gamesWon, totalCorrect, totalIncorrect, bestStreak")
      .eq("id", userId)
      .single();

    let rankUpResult = null;
    if (user) {
      const previousXp = user.campaignXp ?? 0;
      const newXp = previousXp + rewards.xp;

      await db.from("User").update({
        totalScore:     (user.totalScore     ?? 0) + rewards.xp,
        campaignXp:     newXp,
        totalCoins:     (user.totalCoins     ?? 0) + rewards.coins,
        gems:           (user.gems           ?? 0) + rewards.gems,
        gamesPlayed:    (user.gamesPlayed    ?? 0) + 1,
        gamesWon:       (user.gamesWon       ?? 0) + (victory ? 1 : 0),
        totalCorrect:   (user.totalCorrect   ?? 0) + correctAnswers,
        totalIncorrect: (user.totalIncorrect ?? 0) + (questionsAnswered - correctAnswers),
        bestStreak:     Math.max(user.bestStreak ?? 0, streak),
      }).eq("id", userId);

      const { didRankUp, previousRank, newRank } = checkRankUp(previousXp, newXp);
      if (didRankUp) {
        rankUpResult = {
          previous: { name: previousRank.name, symbol: previousRank.symbol, gradient: previousRank.gradient },
          new: { name: newRank.name, symbol: newRank.symbol, gradient: newRank.gradient },
        };
      }
    }

    return json({ rewards, rankUp: rankUpResult });
  } catch (error) {
    console.error("[BOSS_ATTEMPT]", error);
    return json({ error: "Internal server error" }, 500);
  }
}
