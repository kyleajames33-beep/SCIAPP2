import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Helper to create JSON response (avoiding NextResponse due to Next.js 14 bug)
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  console.log('[API LOGIN] Login attempt received');
  
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[API LOGIN] Email provided:', email ? 'yes' : 'no');

    if (!email || !password) {
      console.log('[API LOGIN] Missing credentials');
      return json(
        { error: 'Email and password are required' },
        400
      );
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('[API LOGIN] Attempting Supabase sign in...');

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[API LOGIN] Supabase error:', error.message);
      return json(
        { error: error.message },
        401
      );
    }

    if (!data.user) {
      console.error('[API LOGIN] No user returned');
      return json(
        { error: 'Authentication failed' },
        401
      );
    }

    console.log('[API LOGIN] User authenticated:', data.user.id);
    console.log('[API LOGIN] Session created');

    // Get user metadata
    const username = data.user.user_metadata?.username || email.split('@')[0];
    const displayName = data.user.user_metadata?.display_name || username;

    // Create response with user data
    const response = json({
      userId: data.user.id,
      email: data.user.email,
      username,
      displayName,
      totalCoins: 0,
      totalScore: 0,
      gamesPlayed: 0,
      bestStreak: 0,
    });

    // Set the Supabase session cookies in the response
    if (data.session) {
      console.log('[API LOGIN] Setting session cookies');
      response.headers.append('Set-Cookie', `sb-access-token=${data.session.access_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${data.session.expires_in}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
      
      if (data.session.refresh_token) {
        response.headers.append('Set-Cookie', `sb-refresh-token=${data.session.refresh_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
      }
    }

    console.log('[API LOGIN] Login successful');
    return response;
  } catch (error) {
    console.error('[API LOGIN] Unexpected error:', error);
    return json(
      { error: 'Login failed' },
      500
    );
  }
}
