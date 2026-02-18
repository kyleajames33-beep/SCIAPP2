import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const mockUserId = `mock_${username.toLowerCase()}_user`;

    await setAuthCookie({
      userId: mockUserId,
      username: username.toLowerCase(),
      displayName: username,
      role: 'student',
    });

    return NextResponse.json({
      userId: mockUserId,
      username: username.toLowerCase(),
      displayName: username,
      totalCoins: 0,
      totalScore: 0,
      gamesPlayed: 0,
      bestStreak: 0,
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}