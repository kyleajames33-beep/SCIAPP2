import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// TEMPORARY: Mock auth that bypasses database entirely
// This allows users to login without database issues
export async function POST(request: Request) {
  console.log('[LOGIN] Mock login - bypassing database');

  try {
    const body = await request.json();
    const { username, password } = body;

    // Basic validation only
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Generate a mock user ID based on username (consistent for same user)
    const mockUserId = `mock_${username.toLowerCase()}_user`;

    // Set auth cookie with mock user data (stored in JWT, no database)
    await setAuthCookie({
      userId: mockUserId,
      username: username.toLowerCase(),
      displayName: username,
      role: 'student',
    });

    console.log('[LOGIN] Mock login successful:', mockUserId);

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
