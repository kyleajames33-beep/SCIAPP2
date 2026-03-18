# PHASE 06 — PROGRESSION LOOP: REWARDS WORKING END-TO-END

**Phase Goal:** Complete the full progression loop so a player can fight → earn real XP and coins → see their rank → appear on the leaderboard. Almost everything is built — this phase wires the last missing connections.

**Depends On:**
- Phase 1 complete (energy battle system — `submitBossAttempt` must send correct stats)
- Phase 3 complete (chamber pages exist, progress POST endpoint exists)
- Phase 4 complete (`authFetch` helper exists, User table rows being created, session wired to API calls)
- Phase 5 complete (leaderboard and profile read real data)

**Honest Assessment of Starting State:** The rewards system is deceptively close to working. The boss attempt API (`/api/campaign/boss/attempt`) fully calculates XP, coins, gems, writes them to the User table, and returns rank-up data. The `RankUpCelebration` component is fully built. The victory screen renders rewards. BUT — `submitBossAttempt` sends no Authorization header, so the API always treats the player as a guest and returns `{ rewards: null, rankUp: null }`. The rewards panel silently shows nothing. One header change unlocks all of it.

---

## CONTEXT WINDOW SURVIVAL PROTOCOL

**If you start a new session for Phase 6, READ THESE FILES FIRST — in this order:**

1. `roadmap/PHASE_06.md` (this file — read PROGRESS TRACKER first)
2. `app/campaign/boss/[bossId]/page.tsx` — find `submitBossAttempt` function (~line 375)
3. `app/api/campaign/boss/attempt/route.ts` — rewards API (fully implemented)
4. `app/campaign/boss/_components/RankUpCelebration.tsx` — rank-up modal (fully built)
5. `lib/ranks.ts` — the AUTHORITATIVE rank system (used by the boss attempt API)
6. `lib/rank-system.ts` — DUPLICATE rank system (used by profile page — must be reconciled)
7. `lib/auth-fetch.ts` — authFetch helper (created in Phase 4)
8. `app/campaign/chamber/[chamberId]/page.tsx` — chamber completion handler (created in Phase 3)
9. Check PROGRESS TRACKER below

**DO NOT start coding until all 8 files are read and confirmed.**

---

## PROGRESS TRACKER

```
[ ] 6.1 — Consolidate rank systems (lib/ranks.ts wins)
[ ] 6.2 — Wire auth header to submitBossAttempt
[ ] 6.3 — Clean up dead timeRemaining field
[ ] 6.4 — Show partial rewards on defeat screen
[ ] 6.5 — Add chamber completion XP endpoint
[ ] 6.6 — Wire chamber completion XP call
[ ] 6.7 — CHECKPOINT: full loop verified end-to-end
```

Update this section at the end of every session. Never start Phase 6 work without reading this tracker first.

---

## ACCURATE CURRENT STATE (verified by reading files)

### Boss attempt rewards (`/api/campaign/boss/attempt/route.ts`) — BUILT, NOT WIRED
- Calculates rewards: `{ xp: 100 + streak*10, coins: floor(dmg*0.3) + correct*10 + streak*5, gems: floor(streak/3)+1 }` on victory
- Calculates partial defeat rewards: `{ xp: 20, coins: floor(dmg*0.1), gems: 0 }`
- Writes to User table: `totalScore`, `campaignXp`, `totalCoins`, `gems`, `gamesPlayed`, `gamesWon`, `totalCorrect`, `totalIncorrect`, `bestStreak`
- Checks for rank-up using `checkRankUp` from `lib/ranks.ts`
- Returns `{ rewards, rankUp: null | { previous, new } }`
- **BLOCKER:** Reads `Authorization` header to identify user. `submitBossAttempt` sends no auth header → API treats player as guest → returns `{ rewards: null, rankUp: null }` → victory screen shows blank rewards panel

### `submitBossAttempt` in boss battle page (~line 375-399)
- Calls `/api/campaign/boss/attempt` with `Content-Type: application/json` only — **no Authorization header**
- Sends body: `{ bossId, damageDealt, questionsAnswered, correctAnswers, streak, timeRemaining, victory }`
- `timeRemaining` field: **dead after Phase 1 removes the per-question timer** — will be `undefined` after Phase 1, harmless but messy
- Correctly sets `rewards` state and `rankUpData` state from response
- `stats.damageDealt` stale closure risk: see Phase 1 assessment action item (add `damageDealtRef`)

### Victory screen (~line 792-834)
- Renders rewards panel when `rewards !== null` — XP, coins, gems shown
- If `rewards` is null (guest / no auth): panel silently hidden — no "login to save" message
- Has `RankUpCelebration` overlay triggered by `showRankUp` state — fully wired

### Defeat screen (~line 838-864)
- Shows `stats.damageDealt` and `boss.currentHp` remaining
- **Does NOT show partial defeat rewards** — even if the API returns them
- No "Try Again" restart logic exists currently — clicking Try Again does `window.location.reload()` which resets everything including HP/questions

### `RankUpCelebration.tsx` — FULLY BUILT
- 4-phase animation: intro ("RANK UP!") → transition (old rank fades) → reveal (new rank glows) → complete (Continue button)
- Total duration ~5 seconds then calls `onComplete()`
- Accepts `previousRank` and `newRank` with `{ name, symbol, gradient }`
- The `gradient` field must match Tailwind class strings in `lib/ranks.ts`

### Three rank systems — INCONSISTENCY BUG
| File | Ranks | XP range | Used by |
|------|-------|----------|---------|
| `lib/ranks.ts` | 8 ranks (H, He, Li, Be, B, C, N, O) | 0–8000 | boss attempt API, checkRankUp |
| `lib/rank-system.ts` | 10 ranks (H, C, N, O, Na, Fe, Cu, Ag, Au, Pt) | 0–5500 | profile page |
| `app/hub/page.tsx` inline | 10 ranks (H, He, Li, C, N, O, Na, Fe, Au, Pt) | 0–10000 | hub page only |

**Impact:** A player with 600 XP:
- `lib/ranks.ts` says: Lithium rank (minXp 500)
- `lib/rank-system.ts` says: Nitrogen rank (minXp 300)... wait actually Oxygen (minXp 600)
- Hub page says: Lithium rank (minXp 300)

Different pages show completely different ranks for the same player. **`lib/ranks.ts` is the authoritative system** because it's what the boss attempt API uses for checkRankUp, and because it has actual `symbol` fields needed by RankUpCelebration.

### Chamber completion XP — MISSING
- Phase 3's `/api/campaign/progress` POST endpoint saves chamber completion to `CampaignProgress` table
- It does NOT award any XP or coins to the User table
- Players who complete 8-question chamber sessions earn nothing
- Only boss defeats award progression

---

## GUARDRAILS — READ BEFORE EVERY TASK

1. **`lib/ranks.ts` is the one true rank system.** Do not touch the XP thresholds or rank names — changing them mid-game would break progression for existing players.
2. **Do not modify `lib/rank-system.ts` to change values** — update it to re-export from `lib/ranks.ts`. Do not delete it immediately because imports need updating.
3. **The rewards formula in the boss attempt API is not yours to change.** It's balanced (streak-incentivised, damage-rewarded). Do not tweak numbers.
4. **`submitBossAttempt` must not be called twice.** It is currently called in two places: when boss HP hits 0 (`victory: true`) and in `nextQuestion` when questions run out (`victory: false`). After Phase 1, the defeat path changes to `handleBattleLoss()` which calls `submitBossAttempt(false)`. The questions-run-out path in `nextQuestion` may still exist. Verify there's no double-call scenario.
5. **The defeat screen's `window.location.reload()` for "Try Again"** — leave it for now. A proper restart function (reset all state without reload) is Phase 9 polish work.
6. **Chamber XP must be low** — completing a chamber (8 practice questions) should give less XP than defeating a boss (100+ XP). Proposed chamber completion XP: 25 flat. Do not over-reward practice.
7. **No new rank system values.** The fix for three rank systems is to consolidate, not invent a fourth.

---

## SUB-PHASE 6.1 — CONSOLIDATE RANK SYSTEMS

**Purpose:** Fix the three-rank-system bug. Every part of the app must show the same rank for the same XP. The boss attempt API uses `lib/ranks.ts` — this wins.

### Task 6.1.1 — Audit what `lib/rank-system.ts` exports and where it's imported
Run:
```bash
grep -r "rank-system" app/ lib/ --include="*.ts" --include="*.tsx"
```
Document every file that imports from `lib/rank-system.ts`. Expected: `app/profile/page.tsx` at minimum.

### Task 6.1.2 — Audit `lib/ranks.ts` exports
Verify these exports exist in `lib/ranks.ts`:
- `RANKS` array — ✅ confirmed
- `getRank(xp)` — ✅ confirmed
- `getNextRank(xp)` — ✅ confirmed
- `getRankProgress(xp)` — ✅ confirmed
- `checkRankUp(previousXp, newXp)` — ✅ confirmed
- `Rank` interface — ✅ confirmed

Check what `lib/rank-system.ts` exports that `lib/ranks.ts` does NOT:
- `getRankInfo(totalXP): RankInfo` — full info object used by profile page
- `formatXP(xp): string` — formatting helper
- `RankInfo` interface

These two helpers must be added to (or re-exported from) `lib/ranks.ts` before `lib/rank-system.ts` can be replaced.

### Task 6.1.3 — Add `getRankInfo` to `lib/ranks.ts`
The profile page calls `getRankInfo(user.totalScore)` to get `{ currentRank, nextRank, currentXP, xpToNextRank, xpProgress, isMaxRank }`.

Add this function to `lib/ranks.ts`:
```typescript
export interface RankInfo {
  currentRank: Rank;
  nextRank: Rank | null;
  currentXP: number;
  xpToNextRank: number;
  xpProgress: number;
  isMaxRank: boolean;
}

export function getRankInfo(xp: number): RankInfo {
  const currentRank = getRank(xp);
  const nextRank = getNextRank(xp);
  const isMaxRank = nextRank === null;
  const xpInRank = xp - currentRank.minXp;
  const xpRange = isMaxRank ? 1 : nextRank!.minXp - currentRank.minXp;
  const xpToNextRank = isMaxRank ? 0 : nextRank!.minXp - xp;
  const xpProgress = isMaxRank ? 100 : Math.min(100, (xpInRank / xpRange) * 100);
  return { currentRank, nextRank, currentXP: xp, xpToNextRank, xpProgress, isMaxRank };
}
```

### Task 6.1.4 — Add `formatXP` to `lib/ranks.ts`
Copy the `formatXP` function from `lib/rank-system.ts` into `lib/ranks.ts`:
```typescript
export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}
```

### Task 6.1.5 — Update profile page to import from `lib/ranks.ts`
In `app/profile/page.tsx`:
```typescript
// Change:
import { getRankInfo, formatXP, RankInfo } from '@/lib/rank-system';
// To:
import { getRankInfo, formatXP, RankInfo } from '@/lib/ranks';
```

The `Rank` interface shape differences must be checked:
- `lib/rank-system.ts`: has `id`, `name`, `element`, `symbol`, `minXP`, `maxXP`, `color`, `gradient`, `badge`
- `lib/ranks.ts`: has `name`, `symbol`, `minXp` (lowercase p), `gradient`, `color`

The profile page accesses: `rankInfo.currentRank.gradient`, `.name`, `.color`, `.symbol`, `.badge`, `.element`
- `.badge` does NOT exist in `lib/ranks.ts` — profile page will crash
- `.element` does NOT exist in `lib/ranks.ts` — profile page will crash (shows "Element: [element]")
- `minXP` vs `minXp` — case difference

**Fixes needed in profile page JSX:**
- Replace `rankInfo.currentRank.badge` with `rankInfo.currentRank.symbol` (use the element symbol as the badge)
- Replace `rankInfo.currentRank.element` with `''` or remove that text display
- Replace all `rank.minXP` references with `rank.minXp`

**Do NOT add `badge` and `element` fields to `lib/ranks.ts`** — the profile page must adapt to the authoritative system, not the other way around.

### Task 6.1.6 — Update hub page to use `lib/ranks.ts`
In `app/hub/page.tsx`, replace the inline RANKS array and `getRank` function:
```typescript
// Remove the inline RANKS constant and getRank function entirely
// Add import:
import { getRank } from '@/lib/ranks';
```
The hub page uses `rank.color` and `rank.bg` — `lib/ranks.ts` has `color` (hex) but not `bg` (Tailwind class).
The hub page renders rank as: `<span className={rank.color}>{rank.name}</span>` — update to use the hex color inline or derive a Tailwind class from the rank name.

Simplest fix for hub page rank display:
```typescript
// Replace rank.color (Tailwind class) and rank.bg (Tailwind bg) with:
style={{ color: rank.color }}
// For background: use bg-white/10 as a neutral fallback
```

### Task 6.1.7 — Verify `lib/rank-system.ts` is no longer imported anywhere
```bash
grep -r "rank-system" app/ lib/ --include="*.ts" --include="*.tsx"
```
If no results: delete `lib/rank-system.ts`.
If still imported: fix remaining imports before deleting.

### Task 6.1.8 — Verify no TypeScript errors
Run `npx tsc --noEmit`. Fix any errors caused by the rank system consolidation before proceeding.

#### ✅ CHECKPOINT 6.1
- [ ] `grep -r "rank-system"` returns zero results
- [ ] `lib/rank-system.ts` deleted
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Profile page renders without crash (check browser: `/profile`)
- [ ] Hub page renders without crash (check browser: `/hub`)

---

## SUB-PHASE 6.2 — WIRE AUTH HEADER TO submitBossAttempt

**Purpose:** The single change that makes the entire rewards system work.

### Task 6.2.1 — Add `useSupabaseAuth` to boss battle page
In `app/campaign/boss/[bossId]/page.tsx`:
```typescript
import { useSupabaseAuth } from '@/app/auth/supabase-provider';
import { authFetch } from '@/lib/auth-fetch';
```

Add inside the component:
```typescript
const { session } = useSupabaseAuth();
```

### Task 6.2.2 — Update `submitBossAttempt` to use authFetch

**Current code (~line 378):**
```typescript
const response = await fetch("/api/campaign/boss/attempt", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... }),
});
```

**New code:**
```typescript
const response = await authFetch("/api/campaign/boss/attempt", session, {
  method: "POST",
  body: JSON.stringify({ ... }),
});
```

Note: `authFetch` handles the `Content-Type: application/json` header automatically (verify this in `lib/auth-fetch.ts` — if not, add it).

### Task 6.2.3 — Handle the `session` stale closure risk
`submitBossAttempt` is called from inside `handleAnswer` (which is inside a closure). The `session` from `useSupabaseAuth()` is React state. If `submitBossAttempt` is called inside a `setBoss` callback or a `setTimeout`, the `session` may be stale.

**Safe pattern:** Mirror session to a ref:
```typescript
const sessionRef = useRef(session);
useEffect(() => { sessionRef.current = session; }, [session]);
```

In `submitBossAttempt`, use `sessionRef.current` instead of `session` directly.

### Task 6.2.4 — Add "Login to save progress" message for guests
Currently when rewards are null (guest), the victory screen shows nothing in the rewards panel area — it's silently empty. Add a guest message:
```tsx
{rewards ? (
  <div className="flex gap-6 mb-4">
    {/* existing XP/coins/gems display */}
  </div>
) : (
  <p className="text-sm text-gray-400 mb-4">
    <Link href="/auth/login" className="text-purple-400 hover:underline">
      Sign in
    </Link>{' '}to save your progress and earn rewards
  </p>
)}
```

#### ✅ CHECKPOINT 6.2
Test with a logged-in user:
- [ ] Win a boss battle → victory screen shows non-zero XP and coins
- [ ] Win with a streak → XP reflects `100 + streak * 10` formula
- [ ] Rank-up: navigate to `/profile`, confirm `totalScore` increased by the correct XP amount
- [ ] If XP crossed a rank threshold: `RankUpCelebration` modal appears
- [ ] Guest user: victory screen shows "Sign in to save" message, no rewards numbers

---

## SUB-PHASE 6.3 — CLEAN UP DEAD `timeRemaining` FIELD

**Purpose:** After Phase 1 removes the per-question timer, `submitBossAttempt` sends `timeRemaining: undefined`. The API ignores it but it's dead code.

### Task 6.3.1 — Remove `timeRemaining` from `submitBossAttempt` body
**Prerequisite:** Phase 1 Sub-phase 1.3 must be complete (timeRemaining state removed).

In `submitBossAttempt`, remove the `timeRemaining` line from the request body:
```typescript
// Remove this line:
timeRemaining,
```

This is a 1-line deletion. Do not do this until Phase 1 Sub-phase 1.3 is confirmed complete or the reference to `timeRemaining` will cause a compile error.

---

## SUB-PHASE 6.4 — SHOW PARTIAL REWARDS ON DEFEAT SCREEN

**Purpose:** The API calculates defeat rewards (20 XP + partial coins) and returns them. The defeat screen ignores them. Players should know they earned something even when they lose.

### Task 6.4.1 — Update defeat screen to display rewards
Find the defeat screen JSX (~line 838). Add rewards display below the "Boss HP remaining" line:

```tsx
{rewards && (
  <div className="flex gap-4 mb-4 justify-center">
    <div className="text-center opacity-70">
      <Star className="w-4 h-4 text-purple-400 mx-auto" />
      <div className="text-lg font-bold text-white">{rewards.xp}</div>
      <div className="text-xs text-gray-400">XP</div>
    </div>
    <div className="text-center opacity-70">
      <Sparkles className="w-4 h-4 text-yellow-400 mx-auto" />
      <div className="text-lg font-bold text-white">{rewards.coins}</div>
      <div className="text-xs text-gray-400">Coins</div>
    </div>
  </div>
)}
```

The muted `opacity-70` signals these are consolation rewards, not full victory rewards.

Note: `rewards` state is set from the `submitBossAttempt` response, which now also fires on defeat. Verify the response sets `rewards` state on defeat path too (check: `if (data.rewards) setRewards(data.rewards)` — yes, the defeat path returns `{ xp: 20, ... }` so `data.rewards` will be truthy).

#### ✅ CHECKPOINT 6.4
- [ ] Lose a boss battle → defeat screen shows 20 XP earned
- [ ] `/profile` confirms `totalScore` increased by 20 after defeat

---

## SUB-PHASE 6.5 — CHAMBER COMPLETION XP

**Purpose:** Players who complete a chamber's 8-question practice session should earn a small XP reward. Currently they earn nothing — only boss battles award progression.

### Task 6.5.1 — Create chamber completion reward logic
Create or update `app/api/campaign/progress/route.ts` POST handler (created in Phase 3).

Add XP award to the POST handler. After saving `CampaignProgress`, award XP:

```typescript
// After confirming userId is not null...

// Award chamber completion XP (25 XP flat, only on first completion)
// MUST SELECT first — upsert alone does not tell you if the row is new or existing
const { data: existingProgress } = await db
  .from('CampaignProgress')
  .select('id')
  .eq('userId', userId)
  .eq('chamberId', chamberId)  // use the campaign map ID (e.g. 'm1-c1'), not the question chamberId
  .maybeSingle();

// Now upsert the completion record
await db.from('CampaignProgress').upsert({
  userId,
  chamberId,
  completed: true,
  completedAt: new Date().toISOString(),
}, { onConflict: 'userId,chamberId' });

// isFirstCompletion is true only when the row did NOT exist before
const isFirstCompletion = !existingProgress;

if (isFirstCompletion) {
  const { data: user } = await db
    .from('User')
    .select('totalScore, campaignXp')
    .eq('id', userId)
    .single();

  if (user) {
    const CHAMBER_XP = 25;
    await db.from('User').update({
      totalScore:  (user.totalScore  ?? 0) + CHAMBER_XP,
      campaignXp:  (user.campaignXp  ?? 0) + CHAMBER_XP,
    }).eq('id', userId);
  }

  return json({ success: true, xpAwarded: CHAMBER_XP });
}

return json({ success: true, xpAwarded: 0 });
```

**Critical:** Only award on FIRST completion. If the player replays a chamber, no XP. The upsert already handles idempotency for the CampaignProgress row. Use the pre-upsert check to determine if it's a first completion.

### Task 6.5.2 — Verify the POST handler has access to userId
The chamber progress POST endpoint (Phase 3) must also use auth. Check `app/api/campaign/progress/route.ts` POST handler — does it read the Authorization header?

If not: add the same `auth-me` auth check pattern used in the boss attempt API (read Authorization header, call auth-me edge function, get userId, return guest if null).

**If userId is null (guest):** Save progress to sessionStorage on the client side (Phase 3 implementation). Do not award XP for guests — they have no User row to update.

### Task 6.5.3 — Update chamber page to handle XP response
In `app/campaign/chamber/[chamberId]/page.tsx`, after calling the progress POST endpoint:
```typescript
const data = await response.json();
if (data.xpAwarded > 0) {
  toast.success(`Chamber complete! +${data.xpAwarded} XP`);
}
```

Simple toast notification — no modal, no celebration. Chamber XP is a minor reward. Save the big celebration for boss rank-ups.

#### ✅ CHECKPOINT 6.5
- [ ] Complete a chamber (8 questions) → toast shows "+25 XP"
- [ ] Complete the same chamber again → no XP toast (already earned)
- [ ] `/profile` confirms totalScore increased by 25 after first chamber completion
- [ ] Guest completes chamber → no XP, no error

---

## SUB-PHASE 6.6 — CHECKPOINT: FULL LOOP VERIFIED

This is the Phase 6 pass/fail gate.

### Full loop test script (run manually in browser):
1. Register a new account
2. Navigate to `/campaign`
3. Enter Chamber 1 of Module 1
4. Complete all 8 questions
5. Confirm: toast shows "+25 XP"
6. Return to campaign map
7. Complete all 4 chambers
8. Confirm: boss gate unlocked
9. Enter boss battle (Acid Baron, chargeTime 20s)
10. Fight and WIN the boss using energy system
11. Confirm: victory screen shows non-zero XP, coins, gems
12. If XP crossed 200 (Helium rank threshold): confirm RankUpCelebration fires
13. Navigate to `/profile`
14. Confirm: totalScore = sum of chamber XP (4 × 25 = 100) + boss XP (100 + streak*10)
15. Confirm: boss trophy for acid-baron unlocked (not grayed out)
16. Navigate to `/leaderboard`
17. Confirm: your username appears in the list with your totalScore

### Pass criteria (ALL must be true):
- [ ] XP and coins awarded correctly on boss victory
- [ ] XP awarded correctly on chamber completion (25 per chamber, once)
- [ ] Profile shows correct totalScore (sum of all earned XP)
- [ ] Leaderboard shows the player with their real score
- [ ] RankUpCelebration fires when XP crosses a rank threshold
- [ ] Guest: can play, no XP awarded, "Sign in" prompt shown on victory screen
- [ ] No console errors throughout the loop

---

## PREDICTED PROBLEMS AND MITIGATIONS

### Problem 1: `session` is null when `submitBossAttempt` fires
**Symptom:** Rewards still null even after adding authFetch
**Root cause:** `useSupabaseAuth()` starts with `isLoading: true`, session is null until Supabase resolves it. If the battle ends extremely fast (unlikely but testable), session may still be resolving.
**Mitigation:** The session ref mirror in Task 6.2.3. If `sessionRef.current` is null at time of submit, the API treats it as guest — that's acceptable. The player will have been playing long enough for auth to resolve in practice.

### Problem 2: `submitBossAttempt` called twice on boss defeat
**Symptom:** User gains double XP on victory
**Root cause:** Two code paths exist for submitting: boss HP = 0 path (victory) AND questions-run-out path (nextQuestion → defeat). After Phase 1 refactor, the defeat path moves to `handleBattleLoss()`. But the old `nextQuestion` path may still call `submitBossAttempt(false)`.
**Mitigation:** After Phase 1, search for ALL calls to `submitBossAttempt` in `page.tsx`. There must be exactly two: one in `handleBattleWin()` (victory: true) and one in `handleBattleLoss()` (victory: false). If a third exists, remove it.

### Problem 3: Rank field name crashes (`badge`, `element`, `minXP`)
**Symptom:** Profile page TypeScript error or runtime crash after Task 6.1.5
**Root cause:** `lib/rank-system.ts` has `badge`, `element`, `minXP` (uppercase P). `lib/ranks.ts` has `symbol`, no `element`, `minXp` (lowercase p).
**Mitigation:** Task 6.1.5 explicitly documents each field difference. Fix each reference in profile page JSX. Run `npx tsc --noEmit` as part of Checkpoint 6.1 to catch all type errors before they become runtime crashes.

### Problem 4: `getRankInfo` XP progress bar broken after consolidation
**Symptom:** Profile page rank progress bar always shows 0% or 100%
**Root cause:** `lib/rank-system.ts` used `minXP` (uppercase). After migration to `lib/ranks.ts`, the `getRankInfo` function uses `minXp` (lowercase). If any calculation still uses `minXP`, it reads `undefined` and produces NaN → progress shows 0.
**Mitigation:** In `getRankInfo` added in Task 6.1.3, use `rank.minXp` consistently. After adding the function, test the profile page manually with a user that has between 0 and 200 XP (should show partial progress toward Helium rank).

### Problem 5: Chamber completion XP awarded even for guests (no User row)
**Symptom:** Supabase error when trying to update User table for a guest
**Root cause:** If the POST progress endpoint doesn't guard on `userId !== null`, it will try to update a non-existent User row.
**Mitigation:** Task 6.5.2 explicitly checks — only award XP when `userId` is not null. Supabase update with `.eq('id', null)` would match zero rows anyway, but explicit guard is cleaner.

### Problem 6: Chamber XP awarded multiple times (idempotency failure)
**Symptom:** User earns 25 XP every time they re-enter a completed chamber
**Root cause:** The "first completion" check in Task 6.5.1 checks if a CampaignProgress row existed before the upsert. If the upsert logic doesn't correctly return pre-existing row state, this check fails.
**Mitigation:** Before the upsert: run a `SELECT` to check if the row already exists. Store result as `isNew`. After upsert: only award XP if `isNew` was true (row didn't exist before).

### Problem 7: Hub page rank display crashes after removing inline RANKS
**Symptom:** Hub page TypeError on `rank.color` or `rank.bg`
**Root cause:** Hub page uses `rank.color` as Tailwind class string ("text-gray-400") but `lib/ranks.ts` stores `color` as hex ("#9ca3af"). After Task 6.1.6, assigning hex as Tailwind class produces nothing (not a crash, just no styling).
**Mitigation:** Task 6.1.6 explicitly notes this and uses `style={{ color: rank.color }}` inline styling instead. Remove all Tailwind class-based color styling for rank in the hub page.

### Problem 8: `auth-me` edge function still may not exist (Phase 4 blocker)
**Symptom:** `submitBossAttempt` returns `{ rewards: null }` even with auth header
**Root cause:** The boss attempt API calls `auth-me` edge function to identify the user. If this edge function doesn't exist (Phase 4 Task 4.0), userId is always null.
**Mitigation:** Phase 4 Task 4.0 must be complete before Phase 6. If still blocked, check Supabase Edge Function logs via Supabase MCP `get_logs` for the `auth-me` function.

---

## SESSION-END INSTRUCTIONS

At the end of every session working on Phase 6:
1. Update PROGRESS TRACKER — check off completed sub-phases
2. Note any blocked items and their blockers
3. If Checkpoint 6.6 passes, write "PHASE 6 COMPLETE" in the PROGRESS TRACKER
4. Run `npx tsc --noEmit` before ending — do not leave TypeScript errors

---

## WHAT PHASE 6 DOES NOT INCLUDE

- ❌ Gems spending / shop system (gems are earned but not spendable yet)
- ❌ Streak-based bonus rewards display (streak shown in stats, rewards calculated correctly, no extra UI needed)
- ❌ Achievement / trophy system beyond boss trophies
- ❌ Daily challenge rewards
- ❌ Friends XP comparison
- ❌ Proper "Try Again" restart (still uses window.location.reload — Phase 9 polish)
- ❌ Chamber XP rank-up trigger (chamber XP can cause rank-ups but Phase 6 does not add the rank-up modal to the chamber page — only boss battles show it for now)

---

## WHAT PHASE 7 RECEIVES

When Phase 6 is complete:
- Full progression loop working: fight → earn XP/coins → rank up → see in profile → appear on leaderboard
- Rank system consolidated to `lib/ranks.ts`
- Chamber completion gives 25 XP on first completion
- Boss victory gives 100+ XP, scaled by streak
- Boss defeat gives 20 XP consolation
- All four Module 1 chambers + Acid Baron boss are the playable content
- Phase 7 expands content to Modules 2 and 3 (more chambers, more bosses)

---

*Previous phase: PHASE_05.md — Leaderboard & Profile*
*Next phase: PHASE_07.md — Modules 2 & 3 Content*
