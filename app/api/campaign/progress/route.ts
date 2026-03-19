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
    // treat as guest
  }

  // Guest: return empty progress so the campaign map still renders
  if (!userId) {
    return json({ progress: [], bossAttempts: [] });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [{ data: progress }, { data: bossAttempts }] = await Promise.all([
    db
      .from("CampaignProgress")
      .select("chamberId, worldId, completed, bestScore, xpEarned")
      .eq("userId", userId),
    db
      .from("BossAttempt")
      .select("bossId, defeated, damageDealt")
      .eq("userId", userId)
      .order("createdAt", { ascending: false }),
  ]);

  return json({
    progress: progress ?? [],
    bossAttempts: bossAttempts ?? [],
  });
}

export async function POST(request: NextRequest) {
  // Check auth via auth-me edge function
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
    // treat as guest
  }

  // Guest: no rewards
  if (!userId) {
    return json({ message: "Must be logged in to earn XP" }, 401);
  }

  const body = await request.json();
  const { chamberId, worldId, score, questionsAnswered, correctAnswers } = body;

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if chamber was already completed (first completion detection)
  const { data: existingProgress } = await db
    .from("CampaignProgress")
    .select("id")
    .eq("userId", userId)
    .eq("chamberId", chamberId)
    .maybeSingle();

  const isFirstCompletion = !existingProgress;

  // Save progress to CampaignProgress table
  await db
    .from("CampaignProgress")
    .upsert(
      {
        userId,
        chamberId,
        worldId,
        completed: true,
        bestScore: score,
        xpEarned: isFirstCompletion ? 25 : 0,
      },
      { onConflict: "userId,chamberId" }
    );

  // Award XP only on first completion
  if (isFirstCompletion) {
    const { data: user } = await db
      .from("User")
      .select("totalXP")
      .eq("id", userId)
      .single();

    const newXP = (user?.totalXP || 0) + 25;

    await db
      .from("User")
      .update({ totalXP: newXP })
      .eq("id", userId);

    return json({
      success: true,
      firstCompletion: true,
      xpAwarded: 25,
      newTotalXP: newXP,
    });
  }

  return json({
    success: true,
    firstCompletion: false,
    xpAwarded: 0,
  });
}
