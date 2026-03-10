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
