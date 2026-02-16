import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { isValidReferralCode } from '@/lib/referral'

export const dynamic = 'force-dynamic'

const REFERRAL_REWARD_COINS = 500
const REFERRAL_REWARD_GEMS = 10

/**
 * POST /api/user/referral
 * Redeem a referral code
 */
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { referralCode } = body

    if (!referralCode || !isValidReferralCode(referralCode)) {
      return NextResponse.json(
        { error: 'Invalid referral code format' },
        { status: 400 }
      )
    }

    // Normalize code to uppercase
    const normalizedCode = referralCode.toUpperCase().replace('-', '')

    const result = await prisma.$transaction(async (tx) => {
      // Get the current user
      const currentUser = await tx.user.findUnique({
        where: { id: sessionUser.id },
      })

      if (!currentUser) {
        throw new Error('User not found')
      }

      // Check if user has already used a referral code
      if (currentUser.referredBy) {
        throw new Error('You have already used a referral code')
      }

      // Find the referrer by code
      const referrer = await tx.user.findUnique({
        where: { referralCode: normalizedCode },
      })

      if (!referrer) {
        throw new Error('Referral code not found')
      }

      // Can't refer yourself
      if (referrer.id === currentUser.id) {
        throw new Error('You cannot use your own referral code')
      }

      // Update current user - add referral and rewards
      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          referredBy: referrer.id,
          totalCoins: { increment: REFERRAL_REWARD_COINS },
          gems: { increment: REFERRAL_REWARD_GEMS },
        },
      })

      // Update referrer - add rewards and increment referral count
      await tx.user.update({
        where: { id: referrer.id },
        data: {
          totalCoins: { increment: REFERRAL_REWARD_COINS },
          gems: { increment: REFERRAL_REWARD_GEMS },
          referralCount: { increment: 1 },
        },
      })

      return {
        referrerName: referrer.displayName,
        coinsEarned: REFERRAL_REWARD_COINS,
        gemsEarned: REFERRAL_REWARD_GEMS,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed referral code!`,
      ...result,
    })
  } catch (error) {
    console.error('Referral redemption error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to redeem referral code',
        success: false,
      },
      { status: 400 }
    )
  }
}

/**
 * GET /api/user/referral
 * Get referral stats for the current user
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        referralCode: true,
        referralCount: true,
        referredBy: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      hasUsedReferral: !!user.referredBy,
    })
  } catch (error) {
    console.error('Get referral stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get referral stats' },
      { status: 500 }
    )
  }
}
