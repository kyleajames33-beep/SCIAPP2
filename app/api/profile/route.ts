import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request: NextRequest) {
  // Check auth via auth-me edge function
  const authHeader = request.headers.get("authorization") || "";
  let user: { id: string; email: string } | null = null;

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
      user = { id: authData.id, email: authData.email };
    }
  } catch (error) {
    console.error('[PROFILE] Auth check failed:', error);
  }

  // Guest users get 401
  if (!user) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Get user data
    const { data: userData, error: userError } = await db
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[PROFILE] User query error:', userError);
      return json({ error: 'User not found' }, 404);
    }

    // Get recent boss attempts
    const { data: recentGames, error: gamesError } = await db
      .from('BossAttempt')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(20);

    if (gamesError) {
      console.error('[PROFILE] Games query error:', gamesError);
    }

    // Get campaign progress
    const { data: progress, error: progressError } = await db
      .from('CampaignProgress')
      .select('*')
      .eq('userId', user.id);

    if (progressError) {
      console.error('[PROFILE] Progress query error:', progressError);
    }

    return json({
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        totalScore: userData.totalScore ?? 0,
        campaignXp: userData.campaignXp ?? 0,
        gamesPlayed: userData.gamesPlayed ?? 0,
        bestStreak: userData.bestStreak ?? 0,
        totalCoins: userData.totalCoins ?? 0,
        subscriptionTier: userData.subscriptionTier ?? 'free',
      },
      recentGames: (recentGames || []).map(game => ({
        id: game.id,
        bossId: game.bossId,
        victory: game.victory,
        damageDealt: game.damageDealt,
        questionsAnswered: game.questionsAnswered,
        correctAnswers: game.correctAnswers,
        maxStreak: game.maxStreak,
        completedAt: game.createdAt,
      })),
      progress: progress || [],
    });

  } catch (error) {
    console.error('[PROFILE] Database error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
