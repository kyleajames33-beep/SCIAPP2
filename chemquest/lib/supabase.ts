/**
 * Supabase Client Initialization
 * 
 * NOTE: Requires @supabase/supabase-js package:
 *   npm install @supabase/supabase-js
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
    'Please add it to your .env.local file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Please add it to your .env.local file.'
  );
}

/**
 * Supabase client instance
 * Use this for all Supabase operations (auth, database, realtime, etc.)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Type for Supabase user metadata that maps to our User model
 */
export interface SupabaseUserMetadata {
  username: string;
  display_name: string;
  role?: string;
}

export default supabase;
