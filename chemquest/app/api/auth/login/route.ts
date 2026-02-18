import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
import { ensureDatabaseSchema } from '@/lib/db-init';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('[LOGIN] Starting login request...');
  console.log('[LOGIN] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
  });

  try {
    // Ensure database schema exists (important for Vercel /tmp SQLite)
    console.log('[LOGIN] Ensuring database schema...');
    await ensureDatabaseSchema(prisma as any);
    console.log('[LOGIN] Database schema ready');
    
    const body = await request.json();
    const { username, password } = body;
    console.log('[LOGIN] Request body parsed:', { username, hasPassword: !!password });

    // Validation
    if (!username || !password) {
      console.log('[LOGIN] Validation failed: missing credentials');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    console.log('[LOGIN] Finding user...');
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      console.log('[LOGIN] User not found');
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    console.log('[LOGIN] User found:', user.id);

    // Compare password with hash
    console.log('[LOGIN] Verifying password...');
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      console.log('[LOGIN] Invalid password');
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    console.log('[LOGIN] Password verified');

    // Set auth cookie
    console.log('[LOGIN] Setting auth cookie...');
    await setAuthCookie({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
    console.log('[LOGIN] Auth cookie set successfully');

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
    console.error('[LOGIN] Login error:', error);
    console.error('[LOGIN] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to login',
        details: process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
