/**
 * Supabase Auth Provider
 * 
 * Wraps the application with Supabase authentication context.
 * Listens to auth state changes and provides user session to the frontend.
 * 
 * Usage: Wrap your root layout with this provider:
 *   import { SupabaseAuthProvider } from '@/app/auth/supabase-provider';
 *   
 *   <SupabaseAuthProvider>
 *     {children}
 *   </SupabaseAuthProvider>
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Auth context shape
 */
interface SupabaseAuthContextType {
  /** Current authenticated user or null if not logged in */
  user: User | null;
  /** Current session or null if not logged in */
  session: Session | null;
  /** Whether auth state is still being determined */
  isLoading: boolean;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Refresh the current session */
  refreshSession: () => Promise<void>;
}

// Create the auth context with default values
const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

/**
 * Hook to access Supabase auth context
 * @returns SupabaseAuthContextType
 * 
 * Usage:
 *   const { user, isLoading, signOut } = useSupabaseAuth();
 */
export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

/**
 * Props for SupabaseAuthProvider
 */
interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Supabase Auth Provider Component
 * 
 * Wraps children with authentication context and manages auth state.
 */
export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[SupabaseAuth] Error getting initial session:', error);
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error('[SupabaseAuth] Unexpected error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[SupabaseAuth] Auth state changed:', event);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('[SupabaseAuth] User signed in:', newSession?.user?.email);
            break;
          case 'SIGNED_OUT':
            console.log('[SupabaseAuth] User signed out');
            break;
          case 'USER_UPDATED':
            console.log('[SupabaseAuth] User updated');
            break;
          case 'TOKEN_REFRESHED':
            console.log('[SupabaseAuth] Token refreshed');
            break;
          default:
            break;
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[SupabaseAuth] Sign out error:', error);
        throw error;
      }
      // State will be updated by onAuthStateChange listener
    } catch (error) {
      console.error('[SupabaseAuth] Failed to sign out:', error);
      throw error;
    }
  };

  /**
   * Refresh the current session manually
   */
  const refreshSession = async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[SupabaseAuth] Session refresh error:', error);
        throw error;
      }
      
      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (error) {
      console.error('[SupabaseAuth] Failed to refresh session:', error);
      throw error;
    }
  };

  const value: SupabaseAuthContextType = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export default SupabaseAuthProvider;
