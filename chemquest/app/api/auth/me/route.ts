import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        totalCoins: user.totalCoins,
        totalScore: user.totalScore,
        gamesPlayed: user.gamesPlayed,
        bestStreak: user.bestStreak,
        rank: user.rank,
        campaignXp: user.campaignXp,
        subscriptionTier: user.subscriptionTier,
      },
      // Keep flat fields for backward compatibility
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      totalCoins: user.totalCoins,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
      bestStreak: user.bestStreak,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
