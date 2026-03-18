# Phase 4 — Auth & Persistent Progress
## Goal: Progress Saves Across Sessions

> When Phase 4 is complete, players can create accounts, log in, and have
> their campaign progress (chambers completed, XP, coins) persist across
> browser sessions. Guests can still play; signing up mid-play migrates
> their progress automatically.

---

## ⚠️ GUARDRAILS

1. **The auth system already exists in code.** Login, register, and logout
   API routes and pages are all built. Phase 4 wires them correctly — it does
   NOT rebuild them from scratch.

2. **No new game mechanics.** If you find yourself touching the battle system
   or chamber quiz logic beyond adding auth headers to fetch calls, stop.

3. **Guest play must keep working.** A user with no account must still be
   able to play through Module 1. Auth is additive, not a gate.

4. **The architectural disconnect is the primary problem.** See "Critical Finding"
   below. Understand it fully before writing any code.

5. **One sub-phase at a time.** Each checkpoint is a hard gate.

6. **Do not touch `BATTLE_SPEC.md`, `data/bosses.json`, or `data/chemistry_questions.json`.**

---

## ⚠️ CONTEXT WINDOW SURVIVAL PROTOCOL

### Mandatory reading order for any new session:
1. Read `roadmap/PHASE_04.md` — this file, full read
2. Read `app/auth/supabase-provider.tsx` — understand the auth context
3. Read `app/api/auth/login/route.ts` — understand cookie approach
4. Read `app/api/campaign/progress/route.ts` — understand how auth is checked
5. Read `app/campaign/page.tsx` — find where `/api/auth/me` is called
6. Check PROGRESS TRACKER — find last passed checkpoint
7. Resume from next incomplete task

### PROGRESS TRACKER
```
Last completed checkpoint: [ NONE — update this ]
Last files modified:       [ list them ]
Auth status:               [ WORKING / BROKEN / UNKNOWN — verify in Sub-phase 4.1 ]
Session notes:             [ anything unexpected ]
```

---

## ACCURATE CURRENT STATE AT START OF PHASE 4

*Verified by reading the actual files.*

### What exists:

| Item | State |
|------|-------|
| Login page | `app/auth/login/page.tsx` — fully built, redirects to `/hub` after login |
| Register page | `app/auth/register/page.tsx` — exists (assumed built, verify) |
| `/api/auth/login` | POST — works, sets `sb-access-token` + `sb-refresh-token` cookies |
| `/api/auth/register` | POST — works, creates user in Supabase Auth (email auto-confirmed) |
| `/api/auth/logout` | POST — works, clears cookies |
| `/api/auth/me` | GET — proxies to Supabase edge function using Authorization header |
| `SupabaseAuthProvider` | `app/auth/supabase-provider.tsx` — exists, manages session state |
| Campaign map auth call | Calls `/api/auth/me` with NO Authorization header |

### ⚠️ CRITICAL FINDING — The architectural disconnect

There are **two auth mechanisms** in this codebase that are not connected:

**Mechanism 1: Cookie-based (login API sets cookies)**
- Login sets `sb-access-token` cookie (HttpOnly)
- Cookies are sent automatically by the browser on same-origin requests

**Mechanism 2: Supabase client-side (`SupabaseAuthProvider`)**
- Uses `supabase.auth.getSession()` — reads from Supabase's client-side storage
- Provides session with `access_token` via React context
- NOT the same session as the cookie

**Why this matters for API calls:**
The campaign progress API routes (`/api/campaign/progress`, `/api/campaign/boss/attempt`)
authenticate by calling a Supabase edge function with:
```typescript
const authHeader = request.headers.get("authorization") || "";
```
This reads the `Authorization` header of the incoming API request.
When the campaign map calls these endpoints via `fetch('/api/campaign/progress')`,
it sends NO Authorization header — only cookies (which the API route ignores).

**Result:** Logged-in users appear as guests to all campaign API routes.
Their progress is never saved to the database even when authenticated.

**The fix (implemented in Sub-phase 4.2):**
Use `SupabaseAuthProvider`'s `session.access_token` and pass it as a
`Bearer` token in all fetch calls from campaign-related pages:
```typescript
fetch('/api/campaign/progress', {
  headers: { 'Authorization': `Bearer ${session?.access_token}` }
})
```

### What does NOT exist:
- Session token passed in API calls from campaign map
- "Sign in" / username display in campaign map header
- SessionStorage → DB migration on login
- SessionStorage → DB migration on signup (guest → account upgrade)
- Post-login redirect to `/campaign` instead of `/hub`

---

## PREDICTED PROBLEMS & MITIGATIONS

### P1 — SupabaseAuthProvider may not be in the root layout
**Problem:** `SupabaseAuthProvider` exists but may not wrap the app in
`app/layout.tsx`. If it isn't wrapping the campaign pages, `useSupabaseAuth()`
will throw "must be used within SupabaseAuthProvider".

**Mitigation:**
First task: read `app/layout.tsx`. If `SupabaseAuthProvider` is not wrapping
children, add it. This is a one-line change that must happen before any
`useSupabaseAuth()` calls.

### P2 — Session token is null on first render (timing issue)
**Problem:** `useSupabaseAuth()` returns `{ session: null, isLoading: true }`
on the first render while the session is being fetched. If the campaign map
immediately makes API calls before `isLoading` is false, it sends no token
and the server treats the user as a guest.

**Mitigation:**
In the campaign map's `load()` useEffect, gate the progress fetch behind
`isLoading === false`:
```typescript
useEffect(() => {
  if (isLoading) return; // wait for auth to resolve
  load();
}, [isLoading]);
```

### P3 — Token expiry mid-session
**Problem:** Supabase access tokens expire after 1 hour. If a user plays for
longer than an hour, the token becomes invalid. API calls silently fail.

**Mitigation:**
`SupabaseAuthProvider` already calls `supabase.auth.onAuthStateChange` which
handles `TOKEN_REFRESHED` events automatically. The `session.access_token` in
context is always the current (refreshed) token.
No extra handling needed — just always read from context, not a stored variable.

### P4 — sessionStorage migration sends duplicate DB rows
**Problem:** On login, the migration script reads sessionStorage and POSTs
each completed chamber to `/api/campaign/progress`. If the user already has
those chambers saved in the DB (from a previous session), the upsert creates
duplicates.

**Mitigation:**
The progress POST endpoint uses upsert with `onConflict: "userId,chamberId"`.
Duplicate POSTs will update the existing row, not create new rows.
This is safe — the upsert was designed for exactly this case.

### P5 — Register page returns 201 but does NOT log the user in
**Problem:** The register route creates the user but does NOT create a session.
After registration, the user is not logged in. They need to log in separately.

**Mitigation:**
After successful registration: automatically redirect to the login page with
a success toast "Account created! Please sign in."
OR: call `/api/auth/login` immediately after `/api/auth/register` succeeds
to auto-login. The latter is better UX — implement this.

### P6 — Login redirects to `/hub` but should go to `/campaign`
**Problem:** After login, `router.push('/hub')` sends the user to the hub.
For the MVP, the game is at `/campaign`. The hub is Phase 5.

**Mitigation:**
Change the post-login redirect to `/campaign` (not `/hub`).
Also: pass a `?from=login` param so the campaign map can show a welcome toast.

### P7 — `User` table row may not be created on signup
**Problem:** The register route creates a user in `auth.users` (Supabase Auth)
but does not insert a row into the public `User` table. The campaign progress
route and boss attempt route read from `User` to get XP, coins, etc.
If no `User` row exists, `user.campaignXp` is null — XP display breaks.

**Mitigation:**
After creating the auth user, the register route (or a DB trigger) must also
insert into `User`. Read the current register route (Task 4.1.1) to check if
this is done. If not: add the User row creation to the register route.

### P8 — Guest sessionStorage progress uses map chamber IDs, DB uses same IDs
**Problem (actually not a problem, but verify):**
The sessionStorage key stores `['m1-c1', 'm1-c2', ...]` (campaign map IDs).
The DB stores the same IDs in `CampaignProgress.chamberId`.
The migration code must use the same IDs when posting to the DB.
Verify this is consistent before implementing migration.

---

## TASKS

---

### SUB-PHASE 4.1 — Verify existing auth works end-to-end

**Purpose:** Confirm login, register, and session state all function correctly
before wiring them to the campaign. Do not skip this — building on broken
auth wastes more time than verifying it.

#### Task 4.1.1 — Read app/layout.tsx to check SupabaseAuthProvider wrapping
File: `app/layout.tsx`

Read the file. Confirm:
- Is `SupabaseAuthProvider` imported?
- Does it wrap `{children}`?

If NOT: add it:
```tsx
import { SupabaseAuthProvider } from './auth/supabase-provider';
// In return:
<SupabaseAuthProvider>
  {children}
</SupabaseAuthProvider>
```

#### Task 4.1.2 — Read app/auth/register/page.tsx
Verify the register page exists and has a form for username, email, password.
Check: does it auto-login after registering, or does it redirect to login?
Note the current behaviour in the PROGRESS TRACKER.

#### Task 4.1.3 — Check User table creation in register route
File: `app/api/auth/register/route.ts`

The current register route creates a user in Supabase Auth but does NOT
insert a row into the public `User` table. Add this after the auth user
is created:

```typescript
// After successful supabase.auth.admin.createUser():
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

await db.from("User").upsert({
  id: data.user.id,
  email: userEmail,
  username: username.toLowerCase(),
  campaignXp: 0,
  totalScore: 0,
  totalCoins: 100,   // starter coins
  gems: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  bestStreak: 0,
  createdAt: new Date().toISOString(),
}, { onConflict: 'id' });
```

If the `User` table has different column names, adjust to match.
Check the Supabase table schema before writing this code.

#### Task 4.1.4 — Manual auth test
Test the following sequence manually in the browser:
1. Go to `/auth/register` — create a new account
2. Confirm: no errors, redirected somewhere
3. Go to `/auth/login` — log in with the new account
4. Confirm: login succeeds, cookie is set (check DevTools → Application → Cookies)
5. Call `/api/auth/me` directly in the browser (open a new tab, paste URL)
   Note: this won't send the token since browser URL bar doesn't send auth header
   Test via fetch in console: `fetch('/api/auth/me').then(r => r.json()).then(console.log)`
6. Note the result — does it return user data or `isGuest: true`?

If step 6 returns `isGuest: true`: the disconnect confirmed — fix in Sub-phase 4.2.

#### ✅ CHECKPOINT 4.1
**Pass criteria:**
- [ ] `SupabaseAuthProvider` wraps the app in `layout.tsx`
- [ ] Register creates both a Supabase Auth user AND a `User` table row
- [ ] Login sets `sb-access-token` cookie (verify in DevTools)
- [ ] `useSupabaseAuth()` returns a non-null `session` after login (verify in React DevTools)

---

### SUB-PHASE 4.2 — Wire session token to campaign API calls

**Purpose:** Fix the architectural disconnect. All campaign API calls must
send the session Bearer token so the server can identify the user.

#### Task 4.2.1 — Create an auth-aware fetch helper
Create new file: `lib/auth-fetch.ts`

```typescript
/**
 * auth-fetch.ts
 * A thin wrapper around fetch that automatically attaches the Supabase
 * session token as an Authorization header.
 *
 * Usage:
 *   import { authFetch } from '@/lib/auth-fetch';
 *   const data = await authFetch('/api/campaign/progress', session);
 *
 * If session is null (guest), sends request without auth header.
 * The server will treat this as a guest request.
 */
import { Session } from '@supabase/supabase-js';

export async function authFetch(
  url: string,
  session: Session | null,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(url, { ...options, headers });
}
```

#### Task 4.2.2 — Update campaign map to use authFetch
File: `app/campaign/page.tsx`

1. Import `useSupabaseAuth` and `authFetch`:
```typescript
import { useSupabaseAuth } from '@/app/auth/supabase-provider';
import { authFetch } from '@/lib/auth-fetch';
```

2. Add to component:
```typescript
const { session, isLoading: authLoading } = useSupabaseAuth();
```

3. Update the `load()` useEffect to wait for auth:
```typescript
useEffect(() => {
  if (authLoading) return; // don't load until auth state is known
  load();
}, [authLoading]);
```

4. Replace the `/api/auth/me` fetch with direct session data:
```typescript
// Instead of calling /api/auth/me (which has the header issue):
// Read directly from the session that SupabaseAuthProvider manages
if (session?.user) {
  // User is logged in — fetch their User table data
  const userRes = await authFetch('/api/auth/me', session);
  const userData = await userRes.json();
  setUserTier(userData.user?.subscriptionTier || 'free');
  if (userData.user?.totalCoins != null) setCoins(userData.user.totalCoins);
  if (userData.user?.campaignXp != null) setCampaignXp(userData.user.campaignXp);
} else {
  // Guest — use defaults
  setUserTier('free');
}
```

5. Replace the progress fetch:
```typescript
const progRes = await authFetch('/api/campaign/progress', session);
```

#### Task 4.2.3 — Update chamber quiz page to use authFetch
File: `app/campaign/chamber/[chamberId]/page.tsx`

Add `useSupabaseAuth` import and update the progress POST call:
```typescript
const { session } = useSupabaseAuth();
// ...
const result = await authFetch('/api/campaign/progress', session, {
  method: 'POST',
  body: JSON.stringify({ chamberId, worldId, xpEarned }),
});
```

#### Task 4.2.4 — Update boss battle page to use authFetch
File: `app/campaign/boss/[bossId]/page.tsx`

Add `useSupabaseAuth` and update `submitBossAttempt`:
```typescript
const { session } = useSupabaseAuth();
// ...
const response = await authFetch('/api/campaign/boss/attempt', session, {
  method: 'POST',
  body: JSON.stringify({ bossId, damageDealt, questionsAnswered, correctAnswers, streak, victory }),
});
```

#### ✅ CHECKPOINT 4.2
**Pass criteria (test while logged in):**
- [ ] Complete a chamber while logged in → check DB in Supabase: `CampaignProgress` row created
- [ ] Defeat a boss while logged in → check DB: `BossAttempt` row created, `User.campaignXp` increased
- [ ] Campaign map shows correct XP from DB (not 0)
- [ ] React DevTools: `session` is non-null in campaign components after login
- [ ] Guest play still works: complete a chamber as guest → no DB error, no console error

---

### SUB-PHASE 4.3 — Post-login redirect and auth UI in campaign

**Purpose:** After login, send users to the campaign. Show auth state in the
campaign header so users know they are logged in.

#### Task 4.3.1 — Change post-login redirect
File: `app/auth/login/page.tsx`

```typescript
// Change:
router.push('/hub');
// To:
router.push('/campaign?from=login');
```

#### Task 4.3.2 — Add auth state to campaign map header
File: `app/campaign/page.tsx`

In the header section (currently shows coins + shop link), add:
```tsx
{/* Auth state */}
{session?.user ? (
  <div className="flex items-center gap-2">
    <span className="text-white/50 text-xs hidden sm:block">
      {session.user.user_metadata?.username ?? session.user.email?.split('@')[0]}
    </span>
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/auth/login');
      }}
      className="text-white/30 hover:text-white text-xs transition-colors"
    >
      Sign out
    </button>
  </div>
) : (
  <Link
    href="/auth/login"
    className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
  >
    Sign in
  </Link>
)}
```

#### Task 4.3.3 — Show welcome toast on first campaign load after login
File: `app/campaign/page.tsx`

```typescript
// In the load() function, after setting auth state:
const fromLogin = new URLSearchParams(window.location.search).get('from');
if (fromLogin === 'login' && session?.user) {
  const name = session.user.user_metadata?.username ?? 'there';
  toast.success(`Welcome back, ${name}!`);
  router.replace('/campaign'); // remove the query param
}
```

#### ✅ CHECKPOINT 4.3
**Pass criteria:**
- [ ] Logging in redirects to `/campaign`, not `/hub`
- [ ] Campaign header shows username and "Sign out" when logged in
- [ ] Campaign header shows "Sign in" link when not logged in
- [ ] "Sign out" works: clears session, redirects to login page
- [ ] Welcome toast appears after redirecting from login

---

### SUB-PHASE 4.4 — Guest-to-account upgrade (sessionStorage migration)

**Purpose:** A guest who has played through chambers can sign up and have
their progress migrated to their new account automatically.

#### Task 4.4.1 — Create the migration function
Create new file: `lib/migrate-guest-progress.ts`

```typescript
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
  const sessionCompleted: string[] = JSON.parse(
    sessionStorage.getItem(key) ?? '[]'
  );

  if (sessionCompleted.length === 0) return 0;

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
      const res = await authFetch('/api/campaign/progress', session, {
        method: 'POST',
        body: JSON.stringify({ chamberId, worldId, xpEarned: 50 }),
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
  }

  return migrated;
}
```

#### Task 4.4.2 — Call migration on login
File: `app/auth/login/page.tsx`

After successful login response:
```typescript
import { migrateGuestProgress } from '@/lib/migrate-guest-progress';
// ...

// After response.ok:
// Get the session from Supabase client (it was set by the login response)
const { data: { session: newSession } } = await supabase.auth.getSession();
if (newSession) {
  const migrated = await migrateGuestProgress(newSession);
  if (migrated > 0) {
    toast.success(`Progress migrated! ${migrated} chamber${migrated > 1 ? 's' : ''} saved.`);
  }
}
```

Note: `supabase` here is the client-side Supabase instance from `@/lib/supabase`.
After the login API sets cookies, calling `supabase.auth.getSession()` should
return the active session.

#### Task 4.4.3 — Call migration on register
File: `app/auth/register/page.tsx`

After successful registration AND auto-login (see Predicted Problem P5):
```typescript
// After auto-login succeeds:
const { data: { session: newSession } } = await supabase.auth.getSession();
if (newSession) {
  const migrated = await migrateGuestProgress(newSession);
  if (migrated > 0) {
    toast.success(`Your guest progress has been saved to your account!`);
  }
}
```

#### Task 4.4.4 — Auto-login after registration
File: `app/auth/register/page.tsx`

After successful registration (`response.status === 201`), automatically
call the login endpoint to start a session:
```typescript
// After successful registration:
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: formData.email, password: formData.password }),
});

if (loginRes.ok) {
  // Trigger migration then redirect
  // (migration code from Task 4.4.3 goes here)
  router.push('/campaign?from=register');
} else {
  // Login failed after register — send to login page
  router.push('/auth/login?registered=true');
}
```

#### Task 4.4.5 — Show registration success message on login page
File: `app/auth/login/page.tsx`

If navigated from registration:
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('registered')) {
    toast.success('Account created! Please sign in.');
  }
}, []);
```

#### ✅ CHECKPOINT 4.4
**Test the guest-to-account upgrade flow:**
1. Clear all cookies and sessionStorage
2. Open `/campaign` as guest
3. Complete 2 chambers (m1-c1 and m1-c2)
4. Verify: sessionStorage has `['m1-c1', 'm1-c2']`
5. Navigate to `/auth/register`, create a new account
6. Verify: after registration, auto-logged in and redirected to `/campaign`
7. Verify: migration toast appears ("2 chambers saved")
8. Verify: campaign map shows m1-c1 and m1-c2 as complete
9. Verify: sessionStorage is now empty (cleared after migration)
10. Refresh the page — confirm chambers still show as complete (from DB, not sessionStorage)

**Pass criteria:**
- [ ] Guest progress migrated on signup (both chambers show on map)
- [ ] sessionStorage cleared after migration
- [ ] Page refresh after migration: chambers still complete (proving DB save worked)
- [ ] Repeat test with login (not registration): same migration happens on login too

---

## PHASE 4 FINAL CHECKPOINT

**Must be tested manually. Do both flows completely.**

### Flow 1 — New user from scratch:
1. Clear cookies + localStorage + sessionStorage
2. Open app, play as guest through all 4 Module 1 chambers
3. Navigate to register, create account
4. Confirm: auto-logged in, redirected to campaign, all 4 chambers saved
5. Refresh page — chambers still complete
6. Fight boss — confirm: XP updates in header after victory
7. Sign out — confirm: redirected to login
8. Sign back in — confirm: all progress still there

### Flow 2 — Returning user:
1. Log out (or use fresh browser)
2. Log in with existing account that has saved progress
3. Confirm: campaign map loads with progress from DB (not from sessionStorage)
4. Confirm: correct XP shown in header

### Final pass criteria:
- [ ] Both flows completed without console errors
- [ ] DB contains correct `CampaignProgress` rows (verify in Supabase dashboard)
- [ ] `User.campaignXp` increments correctly after boss defeat
- [ ] Auth header appears in campaign API calls (verify in browser Network tab)
- [ ] Guest play still works without an account
- [ ] PROGRESS TRACKER updated

---

## WHAT PHASE 5 RECEIVES

When Phase 4 is complete, Phase 5 starts with:
- Login, register, logout working end-to-end
- Session token passed to all campaign API calls
- Chamber progress and boss attempts saving to DB for auth users
- Guest progress migrates to account on signup/login
- Auth state shown in campaign map header
- Phase 5 focuses on: leaderboard, profile page, and XP/rank display

---

*Previous phase: PHASE_03.md*
*Next phase: PHASE_05.md — Leaderboard & Profile*
*Vision reference: VISION.md*
