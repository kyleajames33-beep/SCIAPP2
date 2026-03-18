# PHASE 05 — LEADERBOARD & PROFILE (REAL DATA)

**Phase Goal:** Make the leaderboard and profile pages show real data from Supabase instead of disabled stubs and hardcoded placeholders.

**Depends On:** Phase 4 complete (authFetch helper exists, SupabaseAuthProvider wired, User table rows being created on register)

**Does NOT include:** Friends leaderboard (disabled in UI with "Soon" badge — leave it), GameSession history (table doesn't exist in Supabase schema), prestige system, coins earning

---

## CONTEXT WINDOW SURVIVAL PROTOCOL

**If you start a new session for Phase 5, READ THESE FILES FIRST — in this order:**

1. `roadmap/PHASE_05.md` (this file — read PROGRESS TRACKER section first)
2. `app/api/leaderboard/route.ts` — currently DISABLED, returns 1 fake user
3. `app/api/profile/route.ts` — currently DISABLED (503), was Prisma-based
4. `app/api/auth/me/route.ts` — proxies to Supabase Edge Function `auth-me`, reads Authorization header
5. `app/leaderboard/page.tsx` — fully built UI, calls API without auth header
6. `app/profile/page.tsx` — fully built UI, calls APIs without auth headers
7. `lib/auth-fetch.ts` — auth-aware fetch helper (created in Phase 4)

**DO NOT start coding until you have read all 7 files above.**

---

## PROGRESS TRACKER

```
[ ] 5.1 — Verify Supabase schema for leaderboard
[ ] 5.2 — Rewrite /api/leaderboard/route.ts for Supabase
[ ] 5.3 — Fix auth headers in leaderboard page
[ ] 5.4 — Rewrite /api/profile/route.ts for Supabase
[ ] 5.5 — Fix auth headers in profile page
[ ] 5.6 — Fix profile navigation (Back to Hub → Back to Campaign)
[ ] 5.7 — Wire leaderboard link from campaign header
[ ] 5.8 — CHECKPOINT: end-to-end verification
```

Update this section at the end of every session. Never start Phase 5 work without reading this tracker first.

---

## ACTUAL CURRENT STATE (verified by reading files)

### `/api/leaderboard/route.ts` — DISABLED
- Entire Prisma implementation is commented out
- Returns 1 hardcoded fake user: `chemquest_player` with totalScore 500
- Query param `type=campaign&limit=50` is ignored
- Must be **completely rewritten** from scratch for Supabase

### `/api/profile/route.ts` — DISABLED
- Returns HTTP 503 with `{ error: 'Feature temporarily disabled during migration' }`
- Was Prisma-based: queried `GameSession` and `LeaderboardEntry` tables
- Neither table exists in Supabase — **GameSession does not exist**
- `recentGames` in the profile UI will be empty until game session tracking is added (that is future work, NOT Phase 5)
- Must be rewritten to return **only what Supabase has**: user stats from User table, boss attempts

### `/api/auth/me/route.ts` — WORKS but requires Authorization header
- Proxies to Supabase Edge Function: `${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-me`
- Reads `Authorization` header from the incoming request
- If called without auth header → returns 401 or guest data from Edge Function
- Profile and leaderboard pages call this **without** auth header → always returns no user

### `app/leaderboard/page.tsx` — UI built, data broken
- Calls `/api/leaderboard?type=campaign&limit=50` — no auth header
- Calls `/api/auth/me` — no auth header
- Shows podium for top 3, ranked list, sticky "my rank" bar
- Leaderboard type is hardcoded to `campaign` (tabs for "Campaign" and "All-Time" exist in UI)
- `myRank` is derived by finding user's ID in the leaderboard response array
- Friends tab exists with "Soon" badge — do not touch

### `app/profile/page.tsx` — UI built, data broken
- Calls `/api/auth/me` — **no auth header** → always 401 → redirects to login
- Calls `/api/campaign/progress` — **no auth header** → returns guest data
- Calls `/api/profile` — **disabled (503)** → `recentGames` always empty array
- Shows boss trophies grid (8 bosses hardcoded matching bosses.json) — works if bossAttempts returned
- Shows rank/XP progress from `user.totalScore` via `getRankInfo()` — works once user data arrives
- "Back to Hub" link goes to `/hub` — should go to `/campaign`
- Logout: calls `/api/auth/logout` then redirects to `/auth/login` — this is fine

### `lib/auth-fetch.ts` — Created in Phase 4
- Wraps fetch to attach `Authorization: Bearer <token>` header
- Usage: `authFetch(url, session, options)`
- Profile and leaderboard pages need to use this after getting session from `useSupabaseAuth()`

---

## GUARDRAILS — READ BEFORE EVERY TASK

1. **DO NOT assume Supabase tables exist** — verify schema before writing queries
2. **DO NOT invent columns** — only use columns you can confirm exist in the table
3. **The `User` table row may not exist** for all auth users — Phase 4 should have fixed register, but leaderboard queries must handle empty results gracefully
4. **recentGames does NOT exist in Supabase** — `/api/profile` must NOT try to query a GameSession table. Return empty array explicitly
5. **The `auth-me` Edge Function schema** — you do not know its exact response shape. Read `/api/auth/me/route.ts` to see what the proxy returns and check Phase 4 notes
6. **Do not touch the Friends tab** — it's marked "Soon", leave it
7. **The leaderboard `type` query param** — the new API can accept it but for MVP only `campaign` type is needed (all users, ranked by `totalScore`)
8. **prestige/lifetimeEarnings** — leaderboard page references `prestigeLevel` and `lifetimeEarnings`. These likely don't exist in User table. Confirm and handle gracefully (default to 0)

---

## SUB-PHASE 5.1 — VERIFY SUPABASE SCHEMA FOR LEADERBOARD

**Purpose:** Before writing any SQL, confirm what columns the `User` table actually has.

### Task 5.1.1 — Query User table schema via Supabase MCP
Use Supabase MCP tool: `list_tables` to see all tables, then `execute_sql` to run:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'User'
ORDER BY ordinal_position;
```
**Expected columns** (from code reading):
- id, username, displayName, email, role
- totalCoins, totalScore, gamesPlayed, bestStreak
- subscriptionTier (or similar)

**Watch for missing columns:** `prestigeLevel`, `lifetimeEarnings` — if missing, the leaderboard page references will crash. Note them as items to default to 0.

### Task 5.1.2 — Verify BossAttempt table schema
Run:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'BossAttempt'
ORDER BY ordinal_position;
```
Profile page expects: `bossId`, `defeated`, `damageDealt`, `createdAt`

### Task 5.1.3 — Count rows in User table
Run:
```sql
SELECT COUNT(*) FROM "User";
```
If 0 rows → Phase 4 Task 4.1.3 (register creates User row) was not completed. Document blocker before continuing.

### Task 5.1.4 — Note confirmed column names
After running queries, write down exact column names with correct casing (Supabase is case-sensitive). Update this file's CONFIRMED SCHEMA section (below).

---

## CONFIRMED SCHEMA
*(Confirmed from register route and boss attempt API)*

**User table columns:**
- id, email, username (from register API)
- campaignXp, totalScore, totalCoins, gems (from boss attempt API)  
- gamesPlayed, gamesWon, totalCorrect, totalIncorrect, bestStreak (from boss attempt API)
- createdAt (from register API)

**BossAttempt table columns:**
- id, userId, bossId, defeated, damageDealt (from boss attempt API)

**Missing columns identified:**
- prestigeLevel, lifetimeEarnings (not in User table - will default to 0)

---

## SUB-PHASE 5.2 — REWRITE `/api/leaderboard/route.ts`

**File:** `app/api/leaderboard/route.ts`

**Purpose:** Replace disabled stub with real Supabase query.

### Task 5.2.1 — Understand what leaderboard page needs

The leaderboard page (`app/leaderboard/page.tsx`) calls:
```
GET /api/leaderboard?type=campaign&limit=50
```

It expects a response in this shape:
```typescript
{
  type: string,
  users: Array<{
    rank: number,
    id: string,
    username: string,
    displayName: string,
    totalScore: number,
    gamesPlayed: number,
    bestStreak: number,
    prestigeLevel: number,    // may not exist in DB
    lifetimeEarnings: number, // may not exist in DB
  }>
}
```

**Note on `prestigeLevel` and `lifetimeEarnings`:** The page renders these fields. If they don't exist in the User table, the query will fail or return null. Default them to 0 in the API response using `COALESCE` in SQL or a fallback in JS.

### Task 5.2.2 — Write the Supabase leaderboard query

The new route must:
1. Accept `type` and `limit` query params (ignore `type` for now, it's always `campaign`)
2. Use Supabase service role client (not anon key — leaderboard needs to read all users)
3. Query User table ordered by totalScore DESC, limit to requested count
4. Return the expected response shape with `rank` as index+1

**Implementation pattern:**
```typescript
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('User')
    .select('id, username, displayName, totalScore, gamesPlayed, bestStreak')
    .order('totalScore', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[LEADERBOARD] Query error:', error);
    return json({ error: 'Failed to fetch leaderboard' }, 500);
  }

  const users = (data || []).map((user, index) => ({
    rank: index + 1,
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    totalScore: user.totalScore ?? 0,
    gamesPlayed: user.gamesPlayed ?? 0,
    bestStreak: user.bestStreak ?? 0,
    prestigeLevel: 0,       // doesn't exist in schema yet
    lifetimeEarnings: 0,    // doesn't exist in schema yet
  }));

  return json({ type: 'campaign', users });
}
```

**CONFIRM before writing:** Check exact column names from Task 5.1.1. If `displayName` is snake_case (`display_name`) in the DB, the query will silently return null.

### Task 5.2.3 — Handle empty leaderboard gracefully
If User table has 0 rows (Phase 4 not done), API must still return `{ type: 'campaign', users: [] }` — not crash. The current pattern above handles this because `data || []`.

### Task 5.2.4 — Test the API route directly
After writing the route, test by visiting:
```
/api/leaderboard?type=campaign&limit=50
```
in the browser while the dev server is running. Confirm you see real user data (not the placeholder). If you see an error, check:
- SUPABASE_SERVICE_ROLE_KEY env var is set
- Column names match exactly (case-sensitive)
- User table has rows

**PASS condition:** Returns JSON with `users` array. At minimum 1 real user after Phase 4 register is working.
**FAIL condition:** 500 error, empty users array when users exist, or placeholder data still showing.

---

## SUB-PHASE 5.3 — FIX AUTH HEADERS IN LEADERBOARD PAGE

**File:** `app/leaderboard/page.tsx`

**Problem:** Page calls `/api/auth/me` without Authorization header → always gets 401/guest → can't identify the logged-in user for the "my rank" sticky bar.

**Note:** The leaderboard itself (list of all users) does NOT need auth — it's public data. Only the "my rank" feature needs auth.

### Task 5.3.1 — Import useSupabaseAuth and authFetch
Add to leaderboard page:
```typescript
import { useSupabaseAuth } from '@/app/auth/supabase-provider';
import { authFetch } from '@/lib/auth-fetch';
```

### Task 5.3.2 — Get session from context
```typescript
const { session } = useSupabaseAuth();
```

### Task 5.3.3 — Update the `/api/auth/me` call
Change:
```typescript
const res = await fetch('/api/auth/me');
```
To:
```typescript
const res = await authFetch('/api/auth/me', session);
```

### Task 5.3.4 — Keep leaderboard fetch unchanged (it's public)
The `/api/leaderboard` fetch does NOT need auth. Leave it as a plain `fetch()`.

### Task 5.3.5 — Handle guest state gracefully
If session is null (guest user), the "my rank" sticky bar should either hide or show "Login to see your rank". Check the current UI and add this null check if not already present.

**PASS condition:** Logged-in user sees their rank highlighted in the leaderboard. Guest user sees leaderboard without personal rank.
**FAIL condition:** Page shows 0 users, page redirects to login, or JS error in console.

---

## SUB-PHASE 5.4 — REWRITE `/api/profile/route.ts`

**File:** `app/api/profile/route.ts`

**Problem:** Returns 503. Profile page calls this for `recentGames`. Since `GameSession` table doesn't exist in Supabase, this will return empty array.

**Scope:** Only return what we have. Do not invent tables.

### Task 5.4.1 — Write the new profile route

The profile page calls:
```
GET /api/profile
```
Expects:
```typescript
{
  recentGames: GameSession[]  // empty array is fine — no GameSession table in Supabase
}
```

**Implementation:**
```typescript
export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET() {
  // GameSession table does not exist in Supabase yet
  // Return empty array — profile page handles this with "No games played yet" state
  return json({ recentGames: [] });
}
```

This is intentionally minimal. The profile page already handles empty `recentGames` with a "No games played yet" message. This unblocks the 503 error without inventing fake data.

### Task 5.4.2 — Verify profile page handles empty recentGames
Check `app/profile/page.tsx` lines 417-421 — it already shows an empty state UI when `recentGames.length === 0`. This is confirmed. No change needed in the page.

**PASS condition:** `/api/profile` returns 200 with `{ recentGames: [] }` instead of 503.

---

## SUB-PHASE 5.5 — FIX AUTH HEADERS IN PROFILE PAGE

**File:** `app/profile/page.tsx`

**Problem:** Three fetches with missing auth headers:
1. `fetch('/api/auth/me')` — no auth header → 401 → redirects to login
2. `fetch('/api/campaign/progress')` — no auth header → returns guest data
3. `fetch('/api/profile')` — was 503, fixed in 5.4

### Task 5.5.1 — Import useSupabaseAuth and authFetch
```typescript
import { useSupabaseAuth } from '@/app/auth/supabase-provider';
import { authFetch } from '@/lib/auth-fetch';
```

### Task 5.5.2 — Get session from context
Add at top of component:
```typescript
const { session, isLoading: authLoading } = useSupabaseAuth();
```

### Task 5.5.3 — Guard the loadProfile effect on session readiness
The current `useEffect` fires immediately. It must wait until auth is resolved:

```typescript
useEffect(() => {
  if (authLoading) return; // wait for auth state

  async function loadProfile() {
    // ... fetches
  }
  loadProfile();
}, [router, session, authLoading]);
```

### Task 5.5.4 — Update fetches to use authFetch
Change:
```typescript
const userRes = await fetch('/api/auth/me');
```
To:
```typescript
const userRes = await authFetch('/api/auth/me', session);
```

Change:
```typescript
const progressRes = await fetch('/api/campaign/progress');
```
To:
```typescript
const progressRes = await authFetch('/api/campaign/progress', session);
```

Leave `fetch('/api/profile')` as-is (it returns empty data, no auth needed).

### Task 5.5.5 — Handle unauthenticated user correctly
Current code: if `/api/auth/me` returns non-ok, redirect to login.
With auth working, this will only redirect if genuinely not logged in. This is correct behavior — leave it.

**PASS condition:** Profile page loads with real user data (displayName, totalScore, totalCoins, boss trophies). No redirect to login for logged-in users.
**FAIL condition:** Page still redirects, shows null user, or boss trophies all locked when user has defeated bosses.

---

## SUB-PHASE 5.6 — FIX PROFILE NAVIGATION

**File:** `app/profile/page.tsx`

### Task 5.6.1 — Fix "Back to Hub" link
Line 164: `<Link href="/hub">` → change to `<Link href="/campaign">`

This is a 1-line change. The profile page was built before campaign existed as the primary flow.

### Task 5.6.2 — Verify logout redirect is correct
Line 127: `router.push('/auth/login')` — this is correct. After logout, go to login. No change needed.

**PASS condition:** "Back" button takes user to campaign map, not the hub.

---

## SUB-PHASE 5.7 — WIRE LEADERBOARD LINK FROM CAMPAIGN

**Purpose:** Users need a way to reach the leaderboard from the campaign map. Currently the leaderboard page exists but may not be linked from anywhere obvious in the campaign flow.

### Task 5.7.1 — Check campaign header for leaderboard link
Read `app/campaign/page.tsx` header section. Look for a `Trophy` or leaderboard icon.

**If a leaderboard link already exists:** Verify it points to `/leaderboard` and is visible. Done.

**If no leaderboard link exists:** Add a Trophy icon button to the campaign header (same style as existing nav buttons in that header). Link to `/leaderboard`.

### Task 5.7.2 — Verify leaderboard page "Back" button
The leaderboard page should have a back link to `/campaign`. Check the current back button destination and update if it goes to `/hub`.

---

## SUB-PHASE 5.8 — CHECKPOINT: END-TO-END VERIFICATION

This is the Phase 5 pass/fail gate. Do not declare Phase 5 done until all checks pass.

### Checkpoint A — Leaderboard shows real users
1. Register a new account (or use existing)
2. Navigate to `/leaderboard`
3. Confirm: real username appears in the list
4. Confirm: rank numbers are correct (1, 2, 3...)
5. Confirm: "my rank" sticky bar appears for logged-in user

**PASS:** Real data visible, no placeholder `chemquest_player`
**FAIL:** Placeholder data, empty list, 500 error

### Checkpoint B — Profile shows real data
1. Login with an account that has defeated at least one boss
2. Navigate to `/profile`
3. Confirm: displayName shown correctly
4. Confirm: totalScore and totalCoins shown (may be 0 if no stats earned yet — that's OK)
5. Confirm: Boss Trophies section shows defeated boss(es) as unlocked
6. Confirm: "No games played yet" message in Recent Activity (correct — no GameSession table)
7. Confirm: "Back to Campaign" button navigates to `/campaign`

**PASS:** All 7 items confirmed
**FAIL:** Page redirects to login, null user, or boss trophies all locked despite defeats

### Checkpoint C — Guest user experience
1. Log out
2. Navigate to `/leaderboard`
3. Confirm: Leaderboard visible (public, no auth required)
4. Confirm: "My rank" bar hidden or shows login prompt
5. Navigate to `/profile`
6. Confirm: Redirects to `/auth/login` (correct — profile requires login)

**PASS:** Leaderboard viewable as guest, profile requires login
**FAIL:** Leaderboard crashes for guest, profile accessible without login

### Checkpoint D — Campaign header has leaderboard access
1. Login and navigate to `/campaign`
2. Confirm: Leaderboard link/button visible in campaign header

**PASS:** Can reach leaderboard from campaign in 1 click
**FAIL:** No leaderboard link visible

---

## PREDICTED PROBLEMS AND MITIGATIONS

### Problem 1: User table has 0 rows
**Symptom:** Leaderboard shows empty list even after registering
**Root cause:** Phase 4 Task 4.1.3 (register creates User table row) was not completed
**Mitigation:** Check phase 4 completion. Run `SELECT COUNT(*) FROM "User"` via Supabase MCP. If 0, fix register route to insert User row before continuing Phase 5.

### Problem 2: Column name case mismatch
**Symptom:** Leaderboard or profile data shows null/undefined values
**Root cause:** Supabase columns might be `display_name` (snake_case) but code uses `displayName` (camelCase)
**Mitigation:** Run the schema verification in Task 5.1.1. Use the exact column names returned. Map to camelCase in the API response if needed.

### Problem 3: auth-me Edge Function schema unknown
**Symptom:** Profile page crashes on `userData.user.totalScore` because the Edge Function returns a different shape
**Root cause:** `/api/auth/me` proxies to a Supabase Edge Function. We don't know its exact response shape.
**Mitigation:** Test `/api/auth/me` with a valid Authorization header and inspect the actual response. Add console.log before using the data to verify the shape.

### Problem 4: Session not available when useEffect runs
**Symptom:** Profile page always redirects to login even when logged in
**Root cause:** `useSupabaseAuth()` starts with `isLoading: true`. If the effect fires before session resolves, it calls `/api/auth/me` without a token, gets 401, redirects.
**Mitigation:** Guard the effect with `if (authLoading) return;` and include `authLoading` in the dependency array (Task 5.5.3).

### Problem 5: Leaderboard `type` param ignored causes wrong data
**Symptom:** "Campaign" tab and "All-Time" tab show identical data
**Root cause:** New API ignores the `type` param entirely (both return same query)
**Mitigation:** This is acceptable for MVP. The leaderboard only has one meaningful metric (totalScore). Note it as future work. Do NOT build separate leaderboard tables now.

### Problem 6: `prestigeLevel` undefined crashes leaderboard page render
**Symptom:** TypeError: Cannot read properties of undefined
**Root cause:** Leaderboard page accesses `user.prestigeLevel` which we're defaulting to 0 in the API, but if the page code uses it in a conditional or calculation it might still crash
**Mitigation:** API always returns `prestigeLevel: 0`. If page still crashes, check which line references it and add a `|| 0` fallback there.

### Problem 7: SUPABASE_SERVICE_ROLE_KEY not in env
**Symptom:** Leaderboard API returns 500 with `supabaseKey is required` or similar
**Root cause:** `process.env.SUPABASE_SERVICE_ROLE_KEY` is undefined in the running environment
**Mitigation:** Check `.env.local` for this key. It's the same key used by the register route (`/api/auth/register/route.ts` uses it). If register works, this key is present.

### Problem 8: recentGames causes profile 503 to persist
**Symptom:** Profile page still shows loading spinner or error after Task 5.4
**Root cause:** Caching — Next.js may cache the old 503 response. Also ensure `export const dynamic = 'force-dynamic'` is in the new route.
**Mitigation:** Hard refresh browser. Confirm `force-dynamic` is exported. If still 503, restart dev server.

---

## SESSION-END INSTRUCTIONS

At the end of every session working on Phase 5:

1. Update the PROGRESS TRACKER at top of this file — check off completed sub-phases
2. Update CONFIRMED SCHEMA section with actual column names from Task 5.1.1
3. Note any blocked tasks and what's needed to unblock them
4. If Checkpoint 5.8 passes, write "PHASE 5 COMPLETE" in the PROGRESS TRACKER

---

## WHAT PHASE 5 DOES NOT INCLUDE

Be explicit about scope boundaries to prevent scope creep:

- ❌ Friends leaderboard (UI says "Soon" — leave it)
- ❌ GameSession / recent games history (table doesn't exist — returns empty)
- ❌ Prestige system (not in Supabase schema — default to 0)
- ❌ Coins earning system (coins exist in User table but not awarded yet — show balance only)
- ❌ Profile avatar upload (not in any existing code — future feature)
- ❌ XP/score earned from gameplay (campaign battle doesn't award XP yet — Phase 1 and 3 work)
- ❌ Leaderboard type filtering (all-time vs campaign — MVP uses one query)

The profile page will look fully built but most stats will show 0 or empty until the battle system (Phase 1) and campaign completion (Phase 3) actually write stats back to the User table.

---

## DEPENDENCY CHAIN

Phase 5 is technically the last in this first arc but it depends on prior phases for meaningful data:

```
Phase 4 (auth wiring) → User table populated → Phase 5 leaderboard has rows
Phase 1 (energy system) → boss defeated → Phase 3 (progress saved) → Phase 5 profile shows boss trophies
Phase 3 (chamber completion) → totalScore updated → Phase 5 leaderboard ranking works
```

If Phase 5 is being done in isolation (before Phases 1, 3, 4), the pages will render without crashing but will show mostly zeros and empty states. That is acceptable and honest — the infrastructure is correct, the data just hasn't been earned yet.
