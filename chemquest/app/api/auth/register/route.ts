import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, displayName, password } = body;

    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: 'Username, display name, and password are required' },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const mockUserId = `mock_${username.toLowerCase()}_user`;

    await setAuthCookie({
      userId: mockUserId,
      username: username.toLowerCase(),
      displayName,
      role: 'student',
    });

    return NextResponse.json(
      {
        userId: mockUserId,
        username: username.toLowerCase(),
        displayName,
      },

      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}