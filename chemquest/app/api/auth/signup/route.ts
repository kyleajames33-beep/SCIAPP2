import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public client for auth signup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service role client for database operations (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use public client for signUp
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Use service role client to insert into User table (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Insert user profile into the User table
    const { error: insertError } = await supabaseAdmin
      .from('User')
      .insert({
        id: authData.user.id,
        email: email,
        username: username || email.split('@')[0],
        displayName: username || email.split('@')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting user:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: username || email.split('@')[0],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
