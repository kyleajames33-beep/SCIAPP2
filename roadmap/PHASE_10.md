# Phase 10 — Production Launch
## "Ship It"

> When Phase 10 is complete, ChemQuest is deployed to Vercel with a production Supabase
> project, the Pro paywall is active for Modules 2–3, the TypeScript build is clean,
> and API endpoints have basic rate limiting.

---

## CONTEXT WINDOW SURVIVAL PROTOCOL

If you run out of context mid-phase, the next session must:
1. Read `roadmap/PHASE_10.md` (this file) in full
2. Check the PROGRESS TRACKER table below
3. Read the files listed under each incomplete sub-phase before touching them
4. Never re-read files already marked ✅ in the tracker

---

## PROGRESS TRACKER

| Sub-phase | Title                           | Status | Key files touched |
|-----------|---------------------------------|--------|-------------------|
| 10.1      | Fix next.config.js build flags  | ⬜     | next.config.js |
| 10.2      | Update .env.example             | ⬜     | .env.example |
| 10.3      | Reinstate Pro paywall           | ⬜     | app/campaign/page.tsx |
| 10.4      | Rate limit boss/attempt         | ⬜     | app/api/campaign/boss/attempt/route.ts |
| 10.5      | Vercel deployment config        | ⬜     | vercel.json |
| 10.6      | Pre-deploy checklist            | ⬜     | — |
| 10.7      | ASSESSMENT_02.md                | ⬜     | roadmap/ASSESSMENT_02.md (new) |

---

## CURRENT STATE (verified by code reads)

### next.config.js (verified)
```js
const nextConfig = {
  distDir: '.next',
  eslint: {
    ignoreDuringBuilds: true,   // ← HIDES all ESLint errors in CI/CD
  },
  typescript: {
    ignoreBuildErrors: true,    // ← HIDES all TypeScript errors in CI/CD
  },
  images: { unoptimized: true },
};
```
Both ignore flags were set to let the dev build succeed despite known type issues.
In production these flags allow broken code to deploy silently.

### .env.example (verified)
The file still shows `DATABASE_URL` and `JWT_SECRET` — legacy fields from an
earlier architecture. The app no longer uses these. The actual required env vars are:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (safe to expose client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only service role key (never expose client-side)

### vercel.json (verified)
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```
Minimal and correct for a Next.js project. No regions, no environment variables,
no cron jobs. Sufficient for initial deployment.

### Campaign paywall (verified)
Current state of `app/campaign/page.tsx` WORLDS array:
- Module 1: `free: true` — always accessible
- Module 2: `free: false` — Pro-locked
- Module 3: `free: false` — Pro-locked

Phase 7 task temporarily sets Modules 2 and 3 to `free: true` for testing/development.
Phase 10 **reinstates** `free: false` for production readiness.

The upsell notice at line ~446 already reads:
> "Modules 2–8 and all their boss battles unlock with Pro."
This is correct and does not need updating.

### Rate limiting (verified)
No rate limiting exists on any API route. The most sensitive endpoint is
`/api/campaign/boss/attempt` — it writes XP, coins, gems to the User table.
A bad actor could spam this endpoint to farm infinite rewards.

---

## GUARDRAILS

1. **Do not remove `ignoreBuildErrors` without fixing all TypeScript errors first.**
   The correct sequence is: run `npx tsc --noEmit`, fix all errors reported,
   THEN remove the flag. Removing the flag without fixing errors will break the build.
2. **Do not set `images: { unoptimized: false }` without verifying image paths.**
   Vercel Image Optimization requires images to be in `public/` and served as
   `next/image`. Most current images may not use `<Image>` component. Leave `unoptimized: true`
   for now unless specifically auditing images.
3. **SUPABASE_SERVICE_ROLE_KEY must never appear in client-side code.**
   Any env var without `NEXT_PUBLIC_` prefix is server-only in Next.js.
   Do not add `NEXT_PUBLIC_` to the service role key.
4. **Rate limiting must fail open, not closed.** If the rate limit check fails
   (e.g., memory pressure), the request should proceed rather than blocking
   legitimate users.
5. **Do not add ASSESSMENT_02.md until all other sub-phases are complete.**
   The assessment must reflect actual completed state, not planned state.
6. **Modules 2 & 3 paywall reinstatement (Task 10.3) must happen AFTER Phase 7
   content is verified working.** The sequence is: verify Module 2 and 3 gameplay
   works end-to-end with `free: true` (Phase 7), then set back to `free: false`
   in Phase 10.

---

## SUB-PHASE 10.1 — Fix next.config.js Build Flags

**Goal**: Production builds surface TypeScript and ESLint errors instead of
silently deploying broken code.

### Task 10.1.1 — Run TypeScript check first

Before touching `next.config.js`, run the TypeScript compiler in check-only mode:

```bash
npx tsc --noEmit 2>&1 | head -60
```

Count the errors. If there are more than 20 errors, **do not remove the flag yet**.
Instead, note the count in this tracker and proceed to fix errors type-by-type.

Common error categories to expect:
- `Property does not exist` — from Phase 6 rank system consolidation (removing
  `badge`, `element`, `minXP` fields that profile page may still reference)
- `Argument of type 'string' is not assignable` — from Phase 9 sound fix
  (playSound call sites using string literals instead of the union type)
- `Property 'X' is optional but type 'Y' requires it` — from Phase 7 boss data
  additions (`mole-master`, `reaction-king` missing fields)

### Task 10.1.2 — Fix TypeScript errors

Work through the errors systematically. For each file with errors:
1. Read the file
2. Fix the type error with minimal change (cast, add optional chaining, correct type)
3. Do NOT refactor or restructure — just fix the type

### Task 10.1.3 — Remove ignoreBuildErrors flag

Once `npx tsc --noEmit` exits with 0 errors, update `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  eslint: {
    ignoreDuringBuilds: false,  // changed
  },
  typescript: {
    ignoreBuildErrors: false,   // changed
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
```

Then run `npm run build` locally to verify the build succeeds cleanly.

**If the build fails after removing the flags**: ESLint errors will also surface.
Fix each ESLint error (typically `no-unused-vars`, `react-hooks/exhaustive-deps`).
Do not use `// eslint-disable` comments unless the rule is a false positive.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| 50+ TypeScript errors accumulated across 10 phases | Fix by file, not by type. Start with `app/` files (user-facing), then `lib/`. API routes last (server-side TS errors don't affect client) |
| ESLint `react-hooks/exhaustive-deps` fires on `useCallback` in Phase 9 restart handler | Add the missing dep or restructure. Don't disable the rule — it catches real bugs |
| Build passes locally but fails on Vercel due to Node version | Check Vercel project settings: Node 18 or 20. Add `"engines": { "node": ">=18" }` to package.json if needed |

---

## SUB-PHASE 10.2 — Update .env.example

**Goal**: Any developer cloning the repo knows exactly which environment variables
are required and what they do.

### Task 10.2.1 — Rewrite .env.example

Replace the entire contents of `.env.example`:

```bash
# ChemQuest Environment Variables
# ─────────────────────────────────────────────────────────────
# Copy this file to .env.local and fill in your values.
# NEVER commit .env.local to git — it is in .gitignore.
# ─────────────────────────────────────────────────────────────

# ── Supabase (required) ──────────────────────────────────────
# Find these in your Supabase project → Settings → API

# Public URL — safe to expose to the browser
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"

# Anonymous key — safe to expose (row-level security enforces access)
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Service role key — SERVER ONLY. Never use in client-side code.
# Has full database access, bypasses RLS.
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Note**: `DATABASE_URL` and `JWT_SECRET` that appear in the old `.env.example`
are NOT used by the current application. Do not include them.

### Task 10.2.2 — Verify .gitignore covers .env.local

Check `.gitignore` contains:
```
.env.local
.env
```

If `.env` (without `.local`) is not in `.gitignore`, add it. The `.env.example`
file IS committed (it's documentation), but all files with actual secrets must not be.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| Developer creates `.env` instead of `.env.local` and it gets committed | `.env` must be in `.gitignore`. Verify this. |
| Vercel deployment uses different variable names | Vercel reads `NEXT_PUBLIC_` vars automatically. Service role key must be added manually in Vercel dashboard under Environment Variables. |

---

## SUB-PHASE 10.3 — Reinstate Pro Paywall

**Goal**: Modules 2 and 3 require a Pro subscription. Free users see the lock UI.

### Pre-read checklist
Before editing, re-read:
- `app/campaign/page.tsx` lines 44–86 (the WORLDS array)
- Verify Phase 7 has been completed — Module 2 chambers and bosses must be
  verified working before locking them

### Task 10.3.1 — Revert Modules 2 & 3 to free: false

Phase 7 Task 7.5.1 explicitly changed Modules 2 and 3 to `free: true` for testing,
with a `// TODO Phase 10: restore Pro lock` comment. This task reverses that change.

In `app/campaign/page.tsx`, find the WORLDS array and **change** the following:

```ts
// Module 2: change free: true back to free: false, remove TODO comment
{
  id: 'module-2',
  ...
  chambers: [
    { id: 'm2-c1', name: 'The Mole', free: false },       // was true in Phase 7
    { id: 'm2-c2', name: 'Stoichiometry', free: false },   // was true in Phase 7
    { id: 'm2-c3', name: 'Concentration', free: false },   // was true in Phase 7
    { id: 'm2-c4', name: 'Gas Laws', free: false },        // was true in Phase 7
  ],
  free: false,  // was true in Phase 7 — now reinstating Pro lock
}

// Module 3: same revert
{
  id: 'module-3',
  ...
  free: false,  // was true in Phase 7 — now reinstating Pro lock
}
```

Also verify the chamber-level `free` flags:
- Module 2 chambers: all `free: false` (verified in code: lines 65–68)
- Module 3 chambers: all `free: false` (verified in code: lines 79–81)
These were not changed by Phase 7 so they may already be correct.

### Task 10.3.2 — Verify lock UI renders correctly

With a free-tier test user, manually verify:
- Module 2 shows the lock icon and the "Pro" badge
- Clicking Module 2's boss or chambers does NOT navigate (or redirects to upsell)
- The upsell notice appears: "Modules 2–8 and all their boss battles unlock with Pro."

The lock UI is already implemented in `app/campaign/page.tsx` via `isLocked` flag
at line 214: `const isLocked = !world.free && userTier === 'free';`

### Task 10.3.3 — Verify Pro tier bypass works

With a Pro-tier test user (set `subscriptionTier = 'pro'` directly in Supabase):
- Module 2 and 3 are accessible
- Lock icon does NOT appear
- Chambers and boss are clickable

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| No test account with Pro tier exists | Update the user record directly in Supabase table editor: `UPDATE "User" SET "subscriptionTier" = 'pro' WHERE email = 'test@example.com'` |
| The `/api/auth/me` endpoint doesn't return `subscriptionTier` | Check `app/api/auth/me/route.ts` — ensure `subscriptionTier` is selected from the User table |

---

## SUB-PHASE 10.4 — Rate Limit Boss/Attempt Endpoint

**Goal**: Prevent XP/coin farming by limiting how frequently a user can submit
boss attempt results.

### Design decision

Use an **in-memory Map** as a simple rate limiter. This is stateless across
Vercel serverless function instances (different instances don't share memory)
but is sufficient for MVP:
- Prevents rapid-fire submissions from a single user within one function instance
- Easy to understand, zero dependencies
- Upgrade path: replace Map with Redis/Upstash when needed

The limit: **1 submission per 10 seconds per userId** (aggressive but realistic —
a real boss fight takes 2–5 minutes minimum).

### Task 10.4.1 — Add rate limiter to boss attempt route

In `app/api/campaign/boss/attempt/route.ts`, add after the imports:

```ts
// Simple in-memory rate limiter (per-instance, MVP-grade)
// Limits to 1 boss attempt submission per 10 seconds per user
const attemptRateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 10_000; // 10 seconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastAttempt = attemptRateLimit.get(userId) ?? 0;
  if (now - lastAttempt < RATE_LIMIT_MS) {
    return false; // rate limited
  }
  attemptRateLimit.set(userId, now);
  return true; // allowed
}
```

Then in the POST handler, after `userId` is confirmed (not null), add:

```ts
// Rate limit check (after userId confirmed, before DB write)
if (!checkRateLimit(userId)) {
  return json({ error: "Too many requests" }, 429);
}
```

Place this check BEFORE the `calculateRewards` call and before any DB writes.

### Task 10.4.2 — Prevent Map from growing indefinitely

The `attemptRateLimit` Map will accumulate entries in long-running instances.
Add a simple cleanup: evict entries older than 1 minute periodically.

```ts
// Prune stale entries to prevent memory leak in long-lived instances
if (attemptRateLimit.size > 1000) {
  const cutoff = Date.now() - 60_000;
  for (const [uid, ts] of attemptRateLimit) {
    if (ts < cutoff) attemptRateLimit.delete(uid);
  }
}
```

Add this before `attemptRateLimit.set(userId, now)` inside `checkRateLimit`.

### Task 10.4.3 — Guest requests bypass rate limit

Guest requests (where `userId === null`) return early with
`{ rewards: null, rankUp: null }` before the rate limit check. This is correct —
guests can't farm rewards since they get `null`. No change needed.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| Vercel serverless: multiple instances don't share the Map — rate limit only applies within one instance | This is acceptable for MVP. A real fix uses Redis (Upstash has a free tier). Document this as a known limitation. |
| Legitimate users retry immediately after a network error and hit the rate limit | 10 seconds is generous — a real boss fight is 2+ minutes. Legitimate retries after a network error within 10 seconds are rare. If this becomes an issue, reduce to 5 seconds and expose a Retry-After header. |
| 429 response breaks frontend unexpectedly | The frontend `submitBossAttempt` currently doesn't check response status. Add status check in Phase 6 task 6.2: if `!res.ok`, show an error toast instead of crashing |

---

## SUB-PHASE 10.5 — Vercel Deployment Config

**Goal**: `vercel.json` is production-ready and correctly configured.

### Task 10.5.1 — Review vercel.json

Current `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

This is correct. No changes required for basic deployment.

**Optional additions** (only add if the need arises):

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["syd1"]
}
```

`"regions": ["syd1"]` routes serverless functions to Sydney — appropriate for
an Australian HSC app. Add if the Vercel project is not already in Sydney.

### Task 10.5.2 — Verify environment variables in Vercel dashboard

Before deploying, ensure all three env vars are set in the Vercel project:

| Variable | Environment | Notes |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | The Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Never expose in Development (use anon key locally) |

The two `NEXT_PUBLIC_` vars must also be added to the "Development" environment
so local `vercel dev` works.

### Task 10.5.3 — Verify Supabase allows Vercel domain

In Supabase → Authentication → URL Configuration:
- Add the production Vercel URL to **Site URL**: `https://your-app.vercel.app`
- Add `https://your-app.vercel.app/**` to **Redirect URLs**
- Add preview URL pattern: `https://*-your-team.vercel.app/**`

Without this, Supabase OAuth (if used) and auth redirects will fail on the
deployed version.

### Task 10.5.4 — Verify Supabase RLS is active

In Supabase → Table Editor, verify Row Level Security is enabled on:
- `User` table — policies should restrict each user to their own row
- `BossAttempt` table — users should only read/write their own attempts
- `CampaignProgress` table — users should only read/write their own progress

If RLS is disabled on any of these tables, any authenticated user can read
another user's data. This is a security requirement, not optional.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` accidentally set as `NEXT_PUBLIC_` | This would expose the key client-side. Double-check Vercel dashboard: the service role key must NOT have `NEXT_PUBLIC_` prefix |
| Supabase project is paused (free tier auto-pauses after 7 days inactivity) | Upgrade Supabase to Pro tier, or ensure the project is active before deployment |
| CORS errors from Vercel to Supabase | Supabase allows all origins by default for its REST API. Only custom Edge Functions need explicit CORS headers — verify the `auth-me` Edge Function handles CORS for the Vercel domain |

---

## SUB-PHASE 10.6 — Pre-Deploy Checklist

### Build verification

```bash
# 1. TypeScript check (must exit 0)
npx tsc --noEmit

# 2. Local build (must succeed with no errors)
npm run build

# 3. Check bundle size — verify no unexpectedly large chunks
# Look for "First Load JS" column in build output
# Target: < 300kB for campaign route
```

### Security checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT in `NEXT_PUBLIC_` env vars
- [ ] `.env.local` and `.env` are in `.gitignore` and not committed
- [ ] `auth-me` Edge Function validates JWT before returning user data
- [ ] Boss attempt rate limit is active (Task 10.4)
- [ ] RLS is enabled on User, BossAttempt, CampaignProgress tables
- [ ] No `console.log` statements with sensitive data (check API routes)

### Functional smoke test (production URL)

After deploying to Vercel, verify each critical path:

**Authentication:**
- [ ] Register a new account → redirected to /hub
- [ ] Log in → redirected to /hub, username visible
- [ ] Log out → session cleared, hub shows guest state

**Campaign (free tier):**
- [ ] Module 1 chambers are accessible
- [ ] Module 2 is locked (shows Pro badge, lock icon)
- [ ] Module 3 is locked
- [ ] Upsell notice visible: "Modules 2–8 and all their boss battles unlock with Pro."

**Boss battle (Module 1):**
- [ ] Boss battle loads, Phaser scene renders
- [ ] Answer correct → damage dealt, sound plays (if not muted)
- [ ] Answer wrong → miss animation, streak resets
- [ ] Complete the boss fight (win or lose) → rewards modal appears
- [ ] Rewards are saved (check Supabase User table: XP/coins incremented)
- [ ] Rank-up works if XP crossed a threshold
- [ ] "Try Again" resets without page reload (Phase 9)

**Tutorial:**
- [ ] New user sees BattleTutorialModal (Phase 9)
- [ ] After dismissal, refreshing does not show it again

**Hub:**
- [ ] Disabled nav cards (Battle/Training/Shop) show "Soon" badge
- [ ] "Play Campaign" CTA links to /campaign

**Leaderboard:**
- [ ] Loads and shows real users (Phase 5)
- [ ] Skeleton shows during load

### Performance check

Run Lighthouse against the production URL (Chrome DevTools → Lighthouse):

Target scores for **mobile**:
- Performance: 60+ (Phaser 3 is heavy — 60 is realistic, 80 is ideal)
- Accessibility: 80+
- Best Practices: 90+
- SEO: 80+

If Performance is below 50, investigate:
1. `next/dynamic` the Phaser battle scene (if not already lazy-loaded — it is)
2. Check if `framer-motion` bundle is being split correctly
3. Verify `images: { unoptimized: true }` is not loading huge uncompressed images

---

## SUB-PHASE 10.7 — ASSESSMENT_02.md

**Goal**: A formal review of Phases 6–10, mirroring the ASSESSMENT_01.md format.
Written AFTER all other Phase 10 tasks are complete and verified.

Create `roadmap/ASSESSMENT_02.md` covering:

1. **Phase 6 (Rewards & Progression)**: Did the rank consolidation work cleanly?
   Were the 3 rank systems successfully merged? Did submitBossAttempt get the
   auth header? Were defeat rewards shown?

2. **Phase 7 (Modules 2 & 3)**: Are mole-master and reaction-king in bosses.json?
   Do the chambers link to the correct question sets? Does the boss fight use
   the `boss-battle` chamberId?

3. **Phase 8 (Mobile)**: Does the Phaser canvas fit on a 375px screen?
   Were all hardcoded pixel widths replaced with responsive values?

4. **Phase 9 (Polish)**: Does the mute button work? Does the tutorial show once?
   Does "Try Again" avoid a page reload? Is the error boundary in place?

5. **Phase 10 (Production)**: Is `ignoreBuildErrors` removed? Is RLS active?
   Is the rate limiter working? Did the Vercel deployment succeed?

For each phase, assign a score (1–10), list what was completed correctly,
note any deviations from the plan, and flag any remaining risks.

End with a "Ship Confidence" rating and a list of any post-launch monitoring
recommendations.

---

## PHASE 10 COMPLETION CRITERIA

Phase 10 is complete when:
1. `npx tsc --noEmit` exits with 0 errors
2. `npm run build` succeeds with `ignoreBuildErrors: false`
3. `.env.example` documents all three Supabase env vars correctly
4. Module 2 and Module 3 are `free: false` in the WORLDS array
5. Boss attempt endpoint returns 429 if same user submits within 10 seconds
6. All pre-deploy security checklist items are checked off
7. Production smoke test passes on the live Vercel URL
8. `ASSESSMENT_02.md` is written reflecting actual completed state

---

## SESSION-END INSTRUCTIONS

If you must stop before Phase 10 is fully complete:

1. Update the PROGRESS TRACKER table — mark completed sub-phases ✅
2. Add a "STOPPED AT" note specifying the exact task
3. The most critical blocker is always Task 10.1 (TypeScript errors) — if the
   build doesn't pass cleanly, nothing else matters for deployment
4. Do NOT deploy to Vercel with `ignoreBuildErrors: true` — fix the errors first

---

## END OF ROADMAP (Phases 1–10)

After Phase 10 is complete and `ASSESSMENT_02.md` is written, the roadmap is done.
Post-launch work (new subjects, multiplayer, teacher dashboard, monetisation)
should be planned in a new roadmap document: `roadmap/PHASE_11.md` or
`roadmap/ROADMAP_V2.md`.
