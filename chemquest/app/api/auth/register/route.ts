import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
import { generateReferralCode } from '@/lib/referral';
import { ensureDatabaseSchema } from '@/lib/db-init';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Ensure database schema exists (important for Vercel /tmp SQLite)
    await ensureDatabaseSchema(prisma as any);
    
    const body = await request.json();
    const { username, displayName, password, email } = body;

    // Validation
    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: 'Username, display name, and password are required' },
        { status: 400 }
      );
    }

    // Username validation: 3-20 chars, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
        { status: 400 }
      );
    }

    // Password validation: 6+ characters
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Display name validation: 1-50 chars
    if (displayName.length < 1 || displayName.length > 50) {
      return NextResponse.json(
        { error: 'Display name must be 1-50 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let isUnique = false;
    let attempts = 0;

    // Ensure referral code is unique (max 10 attempts)
    while (!isUnique && attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { referralCode },
      });

      if (!existing) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode();
        attempts++;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        displayName,
        email: email ? email.toLowerCase() : null,
        passwordHash,
        role: 'student',
        totalCoins: 0,
        referralCode,
        updatedAt: new Date(),
      },
    });

    // Set auth cookie
    await setAuthCookie({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });

    return NextResponse.json(
      {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Registration error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: 'Failed to register user',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
