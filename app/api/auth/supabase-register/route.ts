/**
 * Supabase Registration API Route
 * 
 * New registration endpoint using Supabase Auth.
 * This exists side-by-side with the old Prisma-based registration for testing.
 * 
 * POST /api/auth/supabase-register
 * Body: { username: string, displayName: string, email: string, password: string }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db';
// import { setAuthCookie } from '@/lib/auth';
import { generateReferralCode } from '@/lib/referral';

export const dynamic = 'force-dynamic';

// Create a server-side Supabase client
// Note: For server components/API routes, we use service role key for admin operations
// but for signUp we use the anon key (same as client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE-REGISTER] Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST handler for user registration with Supabase Auth
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, displayName, email, password } = body;

    // ─── Validation ───────────────────────────────────────────────
    if (!username || !displayName || !email || !password) {
      return NextResponse.json(
        { error: 'Username, display name, email, and password are required' },
        { status: 400 }
      );
    }

    // Username validation: 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
        { status: 400 }
      );
    }

    // Password validation: at least 6 characters
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    // ─── Check for existing username in our database ──────────────
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // ─── Check for existing email in our database ─────────────────
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // ─── Create user in Supabase Auth ─────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password,
      options: {
        data: {
          username: normalizedUsername,
          display_name: displayName.trim(),
        },
      },
    });

    if (authError) {
      console.error('[SUPABASE-REGISTER] Supabase auth error:', authError);
      
      // Handle specific Supabase auth errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email is already registered with Supabase' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Registration failed: ' + authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Registration failed: No user returned from Supabase' },
        { status: 500 }
      );
    }

    // ─── Create user record in our database ───────────────────────
    // We use the Supabase user ID as our user ID for consistency
    const supabaseUserId = authData.user.id;
    
    // Generate a unique referral code for the new user
    let referralCode: string;
    try {
      referralCode = generateReferralCode();
      // Ensure uniqueness
      let codeExists = await prisma.user.findUnique({
        where: { referralCode },
      });
      while (codeExists) {
        referralCode = generateReferralCode();
        codeExists = await prisma.user.findUnique({
          where: { referralCode },
        });
      }
    } catch {
      // Fallback: use a timestamp-based code if generation fails
      referralCode = `REF${Date.now().toString(36).toUpperCase().slice(-6)}`;
    }

    // Create the user in our database with all default values
    // Note: We don't store the password hash since Supabase manages that
    const newUser = await prisma.user.create({
      data: {
        id: supabaseUserId, // Use Supabase UUID as our primary key
        username: normalizedUsername,
        displayName: displayName.trim(),
        email: normalizedEmail,
        passwordHash: '', // Empty - Supabase manages authentication
        role: 'student',
        referralCode,
        // All other fields use Prisma schema defaults:
        // totalCoins: 0, totalScore: 0, gamesPlayed: 0, etc.
      },
    });

    console.log('[SUPABASE-REGISTER] Created user:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    });

    // ─── Set auth cookie (DISABLED during migration) ─────────────
    // TODO: Re-implement with Supabase session
    // await setAuthCookie({
    //   userId: supabaseUserId,
    //   username: normalizedUsername,
    //   displayName: displayName.trim(),
    //   role: 'student',
    // });

    // ─── Return success response ──────────────────────────────────
    return NextResponse.json(
      {
        userId: supabaseUserId,
        username: normalizedUsername,
        displayName: displayName.trim(),
        email: normalizedEmail,
        message: 'Registration successful! Please check your email to confirm your account.',
        // Note: Supabase may require email confirmation depending on settings
        emailConfirmed: authData.user.email_confirmed_at != null,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[SUPABASE-REGISTER] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Registration failed due to an unexpected error' },
      { status: 500 }
    );
  }
}
