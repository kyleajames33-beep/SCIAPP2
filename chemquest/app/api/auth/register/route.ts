import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
import { generateReferralCode } from '@/lib/referral';
import { ensureDatabaseSchema } from '@/lib/db-init';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('[REGISTER] Starting registration request...');
  console.log('[REGISTER] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
  });

  try {
    // Ensure database schema exists (important for Vercel /tmp SQLite)
    console.log('[REGISTER] Ensuring database schema...');
    await ensureDatabaseSchema(prisma as any);
    console.log('[REGISTER] Database schema ready');
    
    const body = await request.json();
    const { username, displayName, password, email } = body;
    console.log('[REGISTER] Request body parsed:', { username, displayName, hasPassword: !!password, hasEmail: !!email });

    // Validation
    if (!username || !displayName || !password) {
      console.log('[REGISTER] Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Username, display name, and password are required' },
        { status: 400 }
      );
    }

    // Username validation: 3-20 chars, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      console.log('[REGISTER] Validation failed: invalid username format');
      return NextResponse.json(
        { error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
        { status: 400 }
      );
    }

    // Password validation: 6+ characters
    if (password.length < 6) {
      console.log('[REGISTER] Validation failed: password too short');
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Display name validation: 1-50 chars
    if (displayName.length < 1 || displayName.length > 50) {
      console.log('[REGISTER] Validation failed: invalid display name length');
      return NextResponse.json(
        { error: 'Display name must be 1-50 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    console.log('[REGISTER] Checking if username exists...');
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      console.log('[REGISTER] Username already taken');
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      console.log('[REGISTER] Checking if email exists...');
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingEmail) {
        console.log('[REGISTER] Email already registered');
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
    }

    // Hash password with bcrypt (12 rounds)
    console.log('[REGISTER] Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique referral code
    console.log('[REGISTER] Generating referral code...');
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
    console.log('[REGISTER] Referral code generated after', attempts, 'attempts');

    // Create user
    console.log('[REGISTER] Creating user in database...');
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
    console.log('[REGISTER] User created with ID:', user.id);

    // Set auth cookie
    console.log('[REGISTER] Setting auth cookie...');
    await setAuthCookie({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
    console.log('[REGISTER] Auth cookie set successfully');

    return NextResponse.json(
      {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER] Registration error:', error);
    console.error('[REGISTER] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to register user',
        details: process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
