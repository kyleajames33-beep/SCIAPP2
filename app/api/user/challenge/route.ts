import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/challenge
 * Returns a safe default (challenge feature pending full Supabase migration)
 */
export async function GET() {
  return NextResponse.json({
    data: { active: false, coins: 0, gems: 0 },
    challenge: null,
    isCompleted: false,
    totalChallengesCompleted: 0,
  })
}

/**
 * POST /api/user/challenge
 * Returns a safe default
 */
export async function POST() {
  return NextResponse.json({
    data: { active: false, coins: 0, gems: 0 },
    success: false,
    message: 'Daily challenges coming soon',
  })
}
