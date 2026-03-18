import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  // Check auth via auth-me edge function
  const authHeader = req.headers.get("authorization") || "";
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
    console.error('[CHAMBER_COMPLETE] Auth check failed:', error);
  }

  // Guest users can't save progress
  if (!user) {
    return json({ error: 'Authentication required' }, 401);
  }

  const { chamberId, score, passed, timeSpent } = await req.json();

  if (!chamberId || score == null || passed == null) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Check if this is first completion for XP award
    const { data: existingProgress } = await db
      .from('CampaignProgress')
      .select('id')
      .eq('userId', user.id)
      .eq('chamberId', chamberId)
      .maybeSingle();

    const isFirstCompletion = !existingProgress && passed;

    // Upsert progress record
    const { error: progressError } = await db
      .from('CampaignProgress')
      .upsert({
        userId: user.id,
        chamberId,
        completed: passed,
        bestScore: score,
        xpEarned: isFirstCompletion ? 25 : 0,
        completedAt: new Date().toISOString(),
      }, {
        onConflict: 'userId,chamberId'
      });

    if (progressError) {
      console.error('[CHAMBER_COMPLETE] Progress upsert error:', progressError);
      return json({ error: 'Failed to save progress' }, 500);
    }

    // Award XP if first completion
    if (isFirstCompletion) {
      // Get current XP first
      const { data: userData } = await db
        .from('User')
        .select('campaignXp')
        .eq('id', user.id)
        .single();

      const currentXp = userData?.campaignXp || 0;
      
      const { error: xpError } = await db
        .from('User')
        .update({ campaignXp: currentXp + 25 })
        .eq('id', user.id);

      if (xpError) {
        console.error('[CHAMBER_COMPLETE] XP award error:', xpError);
      }
    }

    return json({
      success: true,
      firstCompletion: isFirstCompletion,
      xpAwarded: isFirstCompletion ? 25 : 0,
    });

  } catch (error) {
    console.error('[CHAMBER_COMPLETE] Database error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}