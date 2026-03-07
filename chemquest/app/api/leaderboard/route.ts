// PRISMA DISABLED - Using Supabase instead
// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function GET() {
  console.log('[LEADERBOARD] DISABLED - Using Supabase')
  // Return empty placeholder data
  return json({ 
    type: 'global',
    users: [
      {
        rank: 1,
        id: 'placeholder-1',
        username: 'chemquest_player',
        displayName: 'ChemQuest Player',
        prestigeLevel: 1,
        lifetimeEarnings: 100,
        totalScore: 500,
        gamesPlayed: 5,
        bestStreak: 3,
      }
    ]
  })
}
