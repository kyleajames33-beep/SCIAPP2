import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Public client for auth signup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service role client for database operations (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type SignupResponse = 
  | { success: true; user: { id: string; email: string; username: string } }
  | { success: false; error: string; details?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
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
      return res.status(400).json({ 
        success: false, 
        error: authError.message 
      });
    }

    if (!authData.user) {
      return res.status(500).json({ 
        success: false, 
        error: 'User creation failed' 
      });
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
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create user profile',
        details: insertError.message 
      });
    }

    return res.status(201).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        username: username || email.split('@')[0],
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
