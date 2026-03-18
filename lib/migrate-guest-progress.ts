/**
 * migrate-guest-progress.ts
 *
 * After a guest signs up or logs in, migrate any session-stored
 * chamber progress to their account in the database.
 *
 * Called once after successful auth. Safe to call multiple times
 * (upsert prevents duplicates).
 */
import { Session } from '@supabase/supabase-js';
import { authFetch } from './auth-fetch';

export async function migrateGuestProgress(session: Session): Promise<number> {
  const key = 'chemquest_session_progress';
  
  let sessionCompleted: string[];
  try {
    sessionCompleted = JSON.parse(sessionStorage.getItem(key) ?? '[]');
  } catch (error) {
    console.warn('[migrate] Failed to parse sessionStorage data:', error);
    return 0;
  }

  if (sessionCompleted.length === 0) {
    console.log('[migrate] No guest progress found in sessionStorage');
    return 0;
  }

  console.log(`[migrate] Found ${sessionCompleted.length} chambers to migrate:`, sessionCompleted);

  // Map chamber IDs to world IDs
  // (same mapping as CHAMBER_CONFIG in chamber quiz page)
  const CHAMBER_TO_WORLD: Record<string, string> = {
    'm1-c1': 'module-1',
    'm1-c2': 'module-1',
    'm1-c3': 'module-1',
    'm1-c4': 'module-1',
  };

  let migrated = 0;
  for (const chamberId of sessionCompleted) {
    const worldId = CHAMBER_TO_WORLD[chamberId];
    if (!worldId) continue; // unknown chamber, skip

    try {
      const res = await authFetch('/api/campaign/chamber/complete', session, {
        method: 'POST',
        body: JSON.stringify({ 
          chamberId, 
          score: 80, // Assume reasonable score for migrated progress
          passed: true,
          timeSpent: 0
        }),
      });
      if (res.ok) migrated++;
    } catch {
      // Non-critical: log and continue
      console.warn(`[migrate] Failed to migrate chamber ${chamberId}`);
    }
  }

  // Clear sessionStorage after migration
  if (migrated > 0) {
    sessionStorage.removeItem(key);
    console.log(`[migrate] Migration complete: ${migrated} chambers migrated, sessionStorage cleared`);
  } else {
    console.warn('[migrate] No chambers were successfully migrated');
  }

  return migrated;
}