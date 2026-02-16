import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Compare password with hash
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Set auth cookie
    await setAuthCookie({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });

    return NextResponse.json({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      totalCoins: user.totalCoins,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
      bestStreak: user.bestStreak,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
