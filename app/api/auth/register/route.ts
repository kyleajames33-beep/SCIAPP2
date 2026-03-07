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
  console.log('[API REGISTER] Registration attempt received');
  
  try {
    const body = await request.json();
    const { username, displayName, email, password } = body;

    console.log('[API REGISTER] Data received - Username:', username, 'Email:', email ? 'yes' : 'no');

    // Validation
    if (!username || !displayName || !password) {
      console.log('[API REGISTER] Missing required fields');
      return json(
        { error: 'Username, display name, and password are required' },
        400
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      console.log('[API REGISTER] Invalid username format');
      return json(
        { error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
        400
      );
    }

    if (password.length < 6) {
      console.log('[API REGISTER] Password too short');
      return json(
        { error: 'Password must be at least 6 characters' },
        400
      );
    }

    // Create Supabase client with service role
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

    console.log('[API REGISTER] Creating user in Supabase...');

    // Create user in Supabase Auth
    // Use email if provided, otherwise create a placeholder email using username
    const userEmail = email || `${username}@chemquest.local`;
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: userEmail,
      password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        username: username.toLowerCase(),
        display_name: displayName,
      },
    });

    if (error) {
      console.error('[API REGISTER] Supabase error:', error.message);
      return json(
        { error: error.message },
        400
      );
    }

    if (!data.user) {
      console.error('[API REGISTER] No user returned from Supabase');
      return json(
        { error: 'Failed to create user' },
        500
      );
    }

    console.log('[API REGISTER] User created successfully:', data.user.id);
    console.log('[API REGISTER] Registration complete');

    return json(
      {
        userId: data.user.id,
        email: data.user.email,
        username,
        displayName,
      },
      201
    );
  } catch (error) {
    console.error('[API REGISTER] Unexpected error:', error);
    return json(
      { error: 'Registration failed' },
      500
    );
  }
}
