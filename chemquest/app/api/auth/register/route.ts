import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// TEMPORARY: Mock auth that bypasses database entirely
// This allows users to register without database issues
export async function POST(request: Request) {
  console.log('[REGISTER] Mock registration - bypassing database');

  try {
    const body = await request.json();
    const { username, displayName, password } = body;

    // Basic validation only
    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: 'Username, display name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Generate a mock user ID (timestamp + random)
    const mockUserId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set auth cookie with mock user data (stored in JWT, no database)
    await setAuthCookie({
      userId: mockUserId,
      username: username.toLowerCase(),
      displayName,
      role: 'student',
    });

    console.log('[REGISTER] Mock user created:', mockUserId);

    return NextResponse.json(
      {
        userId: mockUserId,
        username: username.toLowerCase(),
        displayName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER] Error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
