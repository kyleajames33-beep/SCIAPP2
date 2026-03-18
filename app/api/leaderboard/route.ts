import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('User')
    .select('id, username, email, totalScore, gamesPlayed, bestStreak')
    .order('totalScore', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[LEADERBOARD] Query error:', error);
    return json({ error: 'Failed to fetch leaderboard' }, 500);
  }

  const users = (data || []).map((user, index) => ({
    rank: index + 1,
    id: user.id,
    username: user.username,
    displayName: user.username, // displayName not in schema - use username
    totalScore: user.totalScore ?? 0,
    campaignXp: user.totalScore ?? 0, // For compatibility with leaderboard page
    gamesPlayed: user.gamesPlayed ?? 0,
    bestStreak: user.bestStreak ?? 0,
    prestigeLevel: 0,       // doesn't exist in schema yet
    lifetimeEarnings: 0,    // doesn't exist in schema yet
  }));

  return json({ type: 'campaign', users });
}
