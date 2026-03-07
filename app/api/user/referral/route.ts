// PRISMA DISABLED - Using Supabase instead
// import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/db'
// import { getSessionUser } from '@/lib/auth'
// import { isValidReferralCode } from '@/lib/referral'

import { json } from '@/lib/response';

export const dynamic = 'force-dynamic'

// const REFERRAL_REWARD_COINS = 500
// const REFERRAL_REWARD_GEMS = 10

/**
 * POST /api/user/referral
 * DISABLED - Using Supabase instead
 */
export async function POST() {
  console.log('[REFERRAL] DISABLED - Using Supabase')
  return json(
    { error: 'Referral system temporarily disabled during migration' },
    503
  )
}

/**
 * GET /api/user/referral
 * DISABLED - Using Supabase instead
 */
export async function GET() {
  console.log('[REFERRAL] DISABLED - Using Supabase')
  return json(
    { referralCode: null, referralCount: 0, hasUsedReferral: false },
    200
  )
}
