# PHASES 1–5 ASSESSMENT
**Date:** 2026-03-11
**Purpose:** Verify accuracy, completeness, quality, and sequencing of Phases 1–5 before implementation begins.

---

## ASSESSMENT METHOD

Each phase was assessed against:
- **Accuracy** — does the described current state match the actual code?
- **Completeness** — are all necessary tasks present?
- **Realism** — are tasks achievable and sequenced correctly?
- **Dependencies** — does each phase gate correctly on its predecessors?
- **Guardrails** — is the context window survival protocol sufficient?

Every phase was designed from actual code reads — not memory. This assessment cross-references findings across phases to identify gaps and conflicts.

---

## PHASE 1 ASSESSMENT — Energy Battle System

**Score: 9/10 — APPROVED WITH ONE ACTION ITEM**

### ✅ Accuracy
- Current state of `page.tsx` is accurately described: turn-based system, shield phases, per-question timer, player shield power-up, non-functional player HP bar
- `bosses.json` missing `chargeTime` correctly identified with NaN mitigation documented
- FRAME_W/FRAME_H values verified correct (300, 298)
- `bossSheetUrl` hardcoded issue correctly identified
- `baseHp` vs `maxHp` distinction correctly documented

### ✅ Completeness
- All 9 sub-phases correctly sequenced: data prep → remove deprecated → state → timer → UI → energy → hit → block → validate → art decision
- 9 predicted problems with mitigations is thorough
- Stale closure problem (P2) is explicitly called out — this is the most likely failure and it has a concrete fix

### ✅ Realism
- Tasks are small and atomic — no "implement energy system" mega-tasks
- Checkpoints require specific observable values (energy = 67 after 3 correct) — not "check it works"
- Three mechanics are removed before adding new ones — correct sequencing

### ✅ Dependencies
- Phase 1 is self-contained — requires no other phase
- Correctly identifies what Phase 2 receives at handoff

### ⚠️ ACTION ITEM — Stale closure in submitBossAttempt
**Gap:** The `submitBossAttempt` call at the end of `handleBattleWin()` and `handleBattleLoss()` reads `stats.damageDealt`. With the energy system, damage is now tracked via `handleHit()` which does `setStats(prev => ({ ...prev, damageDealt: prev.damageDealt + damage }))`. Both win and loss handlers are wrapped in `setTimeout` callbacks. There is a risk that `stats` is stale at the time `submitBossAttempt` is called.

**Mitigation to add to Phase 1:** Add `const damageDealtRef = useRef(0)` alongside the other ref mirrors. In `handleHit`, update it: `damageDealtRef.current += damage`. Pass `damageDealtRef.current` to `submitBossAttempt` instead of `stats.damageDealt`.

---

## PHASE 2 ASSESSMENT — Art Sprint

**Score: 7/10 — APPROVED WITH CAVEAT**

### ✅ Accuracy
- Correctly describes what Phase 1 delivers (energy system working, placeholder sprites, hardcoded bossSheetUrl)
- Dependency on `ART_PIPELINE.md` correctly gated
- Dynamic sprite task explicitly required regardless of art path (Guardrail #7)

### ✅ Completeness
- PATH A (Rive) and PATH B (sprite sheets) are both documented
- SSR problem for Rive is predicted (dynamic import wrapper)
- Sprite dimension mismatch risk (FRAME_W/FRAME_H) is predicted

### ⚠️ CAVEAT — Phase 2 is the highest-uncertainty phase
- The Rive state machine complexity prediction is accurate: designing state machines for idle/attack/hurt/death in a new tool during a sprint is genuinely risky
- If Ludo.ai sprite output quality is poor (low quality AI art), Phase 2 could stall while waiting for acceptable art
- **Recommendation:** Phase 2 should have a fallback sub-phase: "2.0 — Verify art source quality before committing to path" — specifically, do a test generation before any code changes, so that if the art looks terrible, the decision can be reconsidered before code is written

### ⚠️ CAVEAT — Phase 2 has the loosest checkpoints
- The final Phase 2 checkpoint criteria are the most subjective of all 5 phases (art quality is inherently subjective)
- The phrasing "looks like a game" is vague
- **Recommendation:** Add measurable art criteria: "Each character has at minimum 3 animation states playing correctly in the browser" — this is observable without requiring subjectivity

---

## PHASE 3 ASSESSMENT — Module 1 MVP

**Score: 8/10 — APPROVED WITH ONE VERIFICATION GAP**

### ✅ Accuracy
- ALL chamber links going to boss battle (no individual chamber pages) — correctly identified
- Chamber ID mismatch (`m1-c1` vs `atomic-structure-and-periodicity`) — correctly documented with mapping table
- Question format mismatch (`options[]` array vs `optionA/B/C/D` fields) — correctly identified
- POST `/api/campaign/progress` does not exist — correctly identified
- Questions API missing chamberId filter — correctly identified
- `/api/questions` currently filters only by `questionSetId` — correctly identified

### ✅ Completeness
- New chamber page creation documented (`/app/campaign/chamber/[chamberId]`)
- Seed script considerations documented
- Guest progress via sessionStorage documented
- Pro paywall hiding task included (Task 3.6.1)

### ✅ Realism
- Correctly positions Phase 3 as the first true MVP — not Phase 1 or 2
- Guest-first approach is pragmatic

### ⚠️ VERIFICATION GAP — Does the seed script actually exist?
**Gap:** Phase 3 references a seed script for questions but we never read the seed script to verify it exists, its structure, and whether it handles the options[] → optionA/B/C/D transformation.

**Action required at Phase 3 start:** Add to the mandatory reading list: "4b. Check for seed script: `scripts/seed.ts` or `prisma/seed.ts` or any `*.seed.*` file." If it doesn't exist, creating it is an unlisted task that could consume significant time.

**Likely location:** Look in `scripts/`, `prisma/`, or `supabase/` directories.

### ⚠️ MINOR GAP — `questionSetId` field may not match `chamberId`
The questions API currently filters by `questionSetId`. Phase 3 adds a `chamberId` filter. But the questions table in the DB — if it has questions seeded at all — might have a `questionSetId` that doesn't match the chamber IDs. The CHAMBER_CONFIG mapping in Phase 3 maps `m1-c1` to `atomic-structure-and-periodicity`. This needs to be the value used for both `questionSetId` and `chamberId` in the DB. Phase 3 documents this but the seed verification step (Task 3.1) must explicitly confirm which field is used and with which values.

---

## PHASE 4 ASSESSMENT — Auth & Persistent Progress

**Score: 9/10 — APPROVED WITH ONE CRITICAL UNKNOWN**

### ✅ Accuracy
- The architectural disconnect (cookies vs Authorization header) is the central correct insight
- Login route correctly described: sets cookies, redirects to /hub (wrong)
- Register route correctly described: creates Supabase Auth user but NOT User table row
- SupabaseAuthProvider correctly described: provides session with access_token
- Campaign map calling `/api/auth/me` without auth header — correctly identified

### ✅ Completeness
- `lib/auth-fetch.ts` helper pattern documented with exact implementation
- All three places requiring authFetch updates are identified (campaign map, chamber page, boss battle)
- Register fix (Task 4.1.3) — User table row creation — correctly identified as a required task
- Guest-to-account migration pattern documented

### ✅ Realism
- authFetch is a minimal change — not a rebuild
- Phase 4 does not attempt to redesign auth — it wires the existing system

### ⚠️ CRITICAL UNKNOWN — `auth-me` Edge Function existence
**Gap:** `/api/auth/me/route.ts` proxies to `${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-me`. We never verified whether this Edge Function actually exists in the Supabase project.

**Risk:** If this function doesn't exist, every call to `/api/auth/me` will return a 404/500 regardless of what auth token is sent. This means:
- Profile page always redirects to login
- Campaign map never identifies the user
- Phase 4 and Phase 5 both depend on this working

**Action required at Phase 4 start:** Add as Task 4.0 — "Verify Supabase Edge Function `auth-me` exists." Run via Supabase MCP: `list_edge_functions`. If it doesn't exist, Phase 4 must either create it or replace `/api/auth/me` with a direct Supabase client call in the Next.js API route.

**Fallback implementation for `/api/auth/me` if Edge Function missing:**
```typescript
import { createClient } from '@supabase/supabase-js';
export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });

  // Get User table row
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data } = await adminClient.from('User').select('*').eq('id', user.id).single();
  return new Response(JSON.stringify({ user: data }), { status: 200 });
}
```

This fallback must be in Phase 4 as a contingency task.

### ⚠️ MINOR — Register page existence is "assumed"
Phase 4 says "Register page: `app/auth/register/page.tsx` — exists (assumed built, verify)". This is the only assumption in any phase file where the code was not actually read.

**Action:** Add `app/auth/register/page.tsx` to the Phase 4 mandatory reading list (position 2b). If it doesn't exist, creating it is unlisted work.

---

## PHASE 5 ASSESSMENT — Leaderboard & Profile

**Score: 8/10 — APPROVED WITH DEPENDENCY CAVEAT**

### ✅ Accuracy
- `/api/leaderboard/route.ts` completely disabled — correctly identified
- `/api/profile/route.ts` returning 503 — correctly identified
- Profile page calling `/api/auth/me` without auth header — correctly identified
- GameSession table doesn't exist in Supabase — correctly identified
- `recentGames` will be permanently empty until a game session tracking system is built — honest assessment
- `prestigeLevel` and `lifetimeEarnings` referenced in leaderboard page but missing from DB — correctly identified

### ✅ Completeness
- Supabase schema verification step (5.1) correctly placed as first task
- Leaderboard API rewrite (5.2) correctly designed
- Profile API minimal fix (5.4 — return empty recentGames) correctly scoped
- All auth header fixes documented
- Scope boundaries clearly listed ("What Phase 5 Does Not Include")

### ✅ Realism
- Returning empty recentGames is honest — not pretending to build something that requires a missing DB table
- Dependency chain is explicitly documented (Phase 4 → User table → Phase 5 leaderboard has data)

### ⚠️ DEPENDENCY CAVEAT — Phase 5 leaderboard will be empty without Phase 4
If Phase 4 Task 4.1.3 (register creates User row) is not complete:
- `SELECT COUNT(*) FROM "User"` returns 0
- Leaderboard page loads but shows 0 users
- This is documented in Predicted Problem 1 but should be a pre-Phase-5 gate

**Add to Phase 5 mandatory reading:** "0. Confirm Phase 4 Task 4.1.3 is complete. Run Supabase query: `SELECT COUNT(*) FROM "User"`. If 0, stop and complete Phase 4 before continuing."

### ⚠️ INHERITED UNKNOWN — auth-me Edge Function
Phase 5 inherits the same risk as Phase 4: if the `auth-me` Edge Function doesn't exist, the profile page will always redirect to login regardless of authFetch fixes. This is resolved when Phase 4's Task 4.0 (Edge Function verification) is completed.

---

## CROSS-PHASE GAP ANALYSIS

### Gap 1 — XP and coins are never awarded (Phases 1–5)
**Finding:** All 5 phases are complete but no phase awards XP or coins to the User table.
- Phase 1 completes the boss battle system
- Phase 3 saves chamber completion to DB
- Neither awards `totalScore` or `totalCoins` updates to the User table
- Result: Phase 5 leaderboard will rank all users at 0 XP, profile shows 0 coins, rank system stays at minimum rank forever

**This is not a blocker for MVP** — the game is technically complete and functional. But it means the progression loop (fight → earn XP → rank up → leaderboard position) doesn't work yet.

**Recommendation:** Either Phase 3 or Phase 4 should include a task to award XP when a boss is defeated. The `submitBossAttempt` endpoint already exists — it likely returns rewards but does not write them to the User table. This should be one of the first items in Phase 6.

### Gap 2 — No phase verifies the seed script exists
Three phases (3, 4, 5) depend on questions being in the database. Phase 3 has Task 3.1 to verify this. But no phase verifies the seed script itself exists before attempting to run it.

**Action:** Phase 3 Task 3.1 must check for seed script existence before attempting to seed. Document the likely path locations.

### Gap 3 — `SupabaseAuthProvider` in layout.tsx is assumed but never verified
Phase 4 Task 4.1.1 says "verify SupabaseAuthProvider in layout.tsx". This is the right call — but if it's not there, all authFetch fixes in Phase 4 and Phase 5 will silently fail (the `useSupabaseAuth()` hook will throw or return null session).

**Action:** This must be the FIRST task in Phase 4 — not just a checkpoint item.

### Gap 4 — `app/layout.tsx` needs Toaster and other providers checked
Multiple pages use `toast` from Sonner. If `<Toaster />` isn't in layout.tsx, toasts are silent. Not a blocker but worth noting.

### Gap 5 — Phase 3 chamber page and campaign map link update
Phase 3 creates `/campaign/chamber/[chamberId]` and updates all chamber links on the campaign map. But the boss battle page currently loads questions for the boss's specific chamber. After Phase 3, the flow is:
1. Campaign map → chamber page (8 practice questions)
2. Chamber complete → return to map with progress saved
3. All 4 chambers complete → boss gate unlocks → boss battle

This flow is documented but the wiring between "chamber complete" and "boss gate unlock" depends on the POST `/api/campaign/progress` endpoint (Phase 3 Task 3.3). If this endpoint isn't created before the chamber page goes live, completing chambers won't unlock the boss.

**This is correctly sequenced in Phase 3** — Task 3.3 (create POST endpoint) comes before Task 3.4 (create chamber page). Good.

---

## SEQUENCING ASSESSMENT

```
Phase 1: Energy system ─────────────────────────────────────────── INDEPENDENT
Phase 2: Art sprint ─────────────────────────── REQUIRES Phase 1 complete
Phase 3: Module 1 MVP ───────────────────────── REQUIRES Phase 1 (energy system works)
                                                 SOFT dependency on Phase 2 (art)
Phase 4: Auth wiring ────────────────────────── REQUIRES Phase 3 (chamber page + progress POST)
Phase 5: Leaderboard/Profile ────────────────── REQUIRES Phase 4 (authFetch, User rows)
```

**Note on Phase 2 and 3 ordering:**
- Phase 2 (art) and Phase 3 (content/MVP) have no hard dependency on each other
- Phase 2 is placed before Phase 3 because "the game must look like a game before we call it MVP"
- If art is taking too long, Phase 3 can be started in parallel — art is visual only, Phase 3 is backend/content
- This parallelism risk should be noted in both phase files

---

## SUMMARY TABLE

| Phase | Score | Status | Key Action Items |
|-------|-------|--------|-----------------|
| Phase 1 | 9/10 | ✅ APPROVED | Add `damageDealtRef` for submitBossAttempt stale closure |
| Phase 2 | 7/10 | ✅ APPROVED | Add art quality pre-check sub-phase; tighten checkpoint criteria |
| Phase 3 | 8/10 | ✅ APPROVED | Verify seed script exists before Phase 3 start |
| Phase 4 | 9/10 | ✅ APPROVED | Add Task 4.0: verify auth-me Edge Function; read register page |
| Phase 5 | 8/10 | ✅ APPROVED | Gate on Phase 4 User table creation; inherits Edge Function risk |

---

## OVERALL VERDICT

**The 5 phases are approved to proceed in sequence.**

The phases are:
- Based on actual file reads, not assumptions
- Sequenced correctly with proper dependency gates
- Honest about what is disabled, missing, or broken
- Equipped with predicted problems and concrete mitigations
- Protected against context window loss

**Critical items to address before implementation begins:**
1. Add `damageDealtRef` to Phase 1 (stale closure in submitBossAttempt)
2. Add Task 4.0 to Phase 4 (verify auth-me Edge Function exists — without this, Phase 4 and 5 both fail silently)
3. Add seed script existence check to Phase 3 pre-conditions

**The single highest-risk unknown across all 5 phases is the `auth-me` Edge Function.** If it doesn't exist, auth-dependent features in Phases 4 and 5 will appear to work from a code perspective but will fail in production with 404 errors. Verify this before writing a single line of Phase 4 code.

---

*Assessment complete. Proceed to Phase 6–10 planning after confirming action items are added.*
