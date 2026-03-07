/**
 * Supabase Auth Helper Functions
 * 
 * Provides signUp, signIn, signOut, and session management using Supabase Auth.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a singleton client for auth operations
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    console.log('[AUTH-SUPABASE] Initializing Supabase client');
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
  };
  error?: string;
}

/**
 * Sign up a new user with Supabase Auth
 */
export async function signUp(credentials: SignUpCredentials): Promise<AuthResult> {
  console.log('[AUTH-SUPABASE] signUp called for:', credentials.email);
  
  try {
    const supabase = getSupabaseClient();
    
    // First, create the auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          username: credentials.username,
          display_name: credentials.displayName,
        },
      },
    });

    if (authError) {
      console.error('[AUTH-SUPABASE] Sign up error:', authError.message);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      console.error('[AUTH-SUPABASE] No user returned from sign up');
      return { success: false, error: 'Failed to create user' };
    }

    console.log('[AUTH-SUPABASE] User created successfully:', authData.user.id);

    // Return the user data
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        username: credentials.username,
        displayName: credentials.displayName,
      },
    };
  } catch (error) {
    console.error('[AUTH-SUPABASE] Unexpected error during sign up:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during sign up' 
    };
  }
}

/**
 * Sign in an existing user with Supabase Auth
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResult> {
  console.log('[AUTH-SUPABASE] signIn called for:', credentials.email);
  
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('[AUTH-SUPABASE] Sign in error:', error.message);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      console.error('[AUTH-SUPABASE] No user returned from sign in');
      return { success: false, error: 'Invalid credentials' };
    }

    console.log('[AUTH-SUPABASE] User signed in successfully:', data.user.id);
    console.log('[AUTH-SUPABASE] Session established');

    // Get user metadata
    const username = data.user.user_metadata?.username || '';
    const displayName = data.user.user_metadata?.display_name || '';

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email!,
        username,
        displayName,
      },
    };
  } catch (error) {
    console.error('[AUTH-SUPABASE] Unexpected error during sign in:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during sign in' 
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  console.log('[AUTH-SUPABASE] signOut called');
  
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[AUTH-SUPABASE] Sign out error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[AUTH-SUPABASE] User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('[AUTH-SUPABASE] Unexpected error during sign out:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during sign out' 
    };
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  console.log('[AUTH-SUPABASE] getSession called');
  
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[AUTH-SUPABASE] Get session error:', error.message);
      return { session: null, error: error.message };
    }

    console.log('[AUTH-SUPABASE] Session retrieved:', data.session ? 'valid' : 'none');
    return { session: data.session, error: null };
  } catch (error) {
    console.error('[AUTH-SUPABASE] Unexpected error getting session:', error);
    return { 
      session: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  console.log('[AUTH-SUPABASE] getCurrentUser called');
  
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[AUTH-SUPABASE] Get user error:', error.message);
      return { user: null, error: error.message };
    }

    console.log('[AUTH-SUPABASE] User retrieved:', data.user ? data.user.id : 'none');
    return { user: data.user, error: null };
  } catch (error) {
    console.error('[AUTH-SUPABASE] Unexpected error getting user:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Export the client for direct use if needed
export { getSupabaseClient as supabaseAuthClient };
