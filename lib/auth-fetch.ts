import type { Session } from "@supabase/supabase-js";

/**
 * Wrapper for fetch that adds Authorization header for authenticated API calls
 * Usage: authFetch('/api/endpoint', session, { method: 'POST', body: ... })
 */
export async function authFetch(
  url: string, 
  session: Session | null, 
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}