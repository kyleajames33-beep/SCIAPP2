# Phase 3 — Module 1 Complete & Full Campaign Loop
## Goal: Shippable MVP

> When Phase 3 is complete, a student can open the app, walk through all
> 4 chambers of Module 1, answer practice questions in each chamber,
> watch the boss gate unlock, fight the boss using the energy system,
> see their rewards, and return to the map with progress saved.
> This is the first end-to-end playable experience. This is the MVP.

---

## ⚠️ GUARDRAILS

1. **Module 1 only.** Modules 2 and 3 stay locked. Do not touch their data,
   their chamber links, or their question sets.

2. **No new game mechanics.** If you find yourself adding anything to the
   battle system, stop. Phase 1 is done. Phase 3 is about content and flow.

3. **Guest play must work.** A user with no account must be able to play
   through Module 1 completely. Progress will not persist (no auth) — that
   is acceptable for the MVP. Authenticated users get progress saving.

4. **One sub-phase at a time.** Each checkpoint is a hard gate.

5. **Do not modify `data/bosses.json` or `BATTLE_SPEC.md`** unless a task
   explicitly names them.

6. **The questions JSON format does not match the DB schema.** This is a
   known issue (documented in Predicted Problem P1). Do not try to fix the
   JSON file — fix the seed/import process.

---

## ⚠️ CONTEXT WINDOW SURVIVAL PROTOCOL

### Mandatory reading order for any new session:
1. Read `roadmap/PHASE_03.md` — this file, full read
2. Read `app/campaign/page.tsx` — campaign map
3. Read `app/api/campaign/progress/route.ts` — progress GET (check if POST exists)
4. Read `app/api/questions/route.ts` — questions API
5. Read `data/chemistry_questions.json` — first 30 lines only (understand schema)
6. Check PROGRESS TRACKER — find last passed checkpoint
7. Resume from next incomplete task

### PROGRESS TRACKER
```
Last completed checkpoint: [ NONE — update this ]
Last files modified:       [ list them ]
Questions in DB:           [ YES / NO / UNKNOWN — verify in Sub-phase 3.1 ]
Session notes:             [ anything unexpected ]
```

---

## ACCURATE CURRENT STATE AT START OF PHASE 3

*Verified by reading the actual files. Do not assume anything beyond this.*

### What exists and works:
| Item | State |
|------|-------|
| Campaign map | Renders 3 modules, Module 1 free, Modules 2-3 locked |
| Module 1 chambers | 4 chambers defined: m1-c1 (Atomic Structure), m1-c2 (Periodic Table), m1-c3 (Chemical Bonding), m1-c4 (IMF) |
| Chamber node links | ALL chamber nodes link to boss battle URL — no individual chamber pages |
| Boss gate | Only unlocks when `allDone` (all 4 chambers complete) — logic correct |
| Progress API (GET) | `/api/campaign/progress` GET exists, returns `CampaignProgress` rows |
| Progress API (POST) | **DOES NOT EXIST** — no way to save chamber completion yet |
| Boss battle | `/api/campaign/boss/attempt` POST exists, saves attempt + rewards |
| Questions API | `/api/questions` GET exists, filters by `questionSetId` |
| Chemistry questions | `data/chemistry_questions.json` — 339 questions, **local JSON file** |
| Questions in DB | **UNKNOWN** — must verify in Sub-phase 3.1 |

### Critical mismatches found during planning:

**Mismatch 1 — Question format: JSON file vs DB schema**
`chemistry_questions.json` stores options as an array:
```json
"options": ["choice A", "choice B", "choice C", "choice D"]
```
The DB and questions API use separate fields:
```
optionA, optionB, optionC, optionD
```
The seed process must convert the format when inserting to DB.

**Mismatch 2 — Chamber ID naming: map vs questions JSON**
Campaign map uses: `m1-c1`, `m1-c2`, `m1-c3`, `m1-c4`
`chemistry_questions.json` uses: `properties-of-matter`, `atomic-structure-and-periodicity`, `bonding`, `intermolecular-forces`

The correct mapping (defined here, used in all tasks):
| Map ID | Question chamberId | Chamber name |
|--------|-------------------|-------------|
| m1-c1 | `atomic-structure-and-periodicity` | Atomic Structure |
| m1-c2 | `properties-of-matter` | Properties of Matter |
| m1-c3 | `bonding` | Chemical Bonding |
| m1-c4 | `intermolecular-forces` | IMF |

**Mismatch 3 — Questions API has no chamberId filter**
The questions API only supports `questionSetId` filtering, not `chamberId`.
A `chamberId` filter must be added in Sub-phase 3.2.

**Mismatch 4 — Admin seed route exists but format is unknown**
`/api/admin/seed` route exists. Its behaviour (what it seeds, what format it expects)
must be read before deciding how to get questions into the DB.

---

## PREDICTED PROBLEMS & MITIGATIONS

### P1 — Questions may not be in the database at all
**Problem:** `data/chemistry_questions.json` is a local file. The questions API
queries the Supabase `Question` table. If questions were never seeded, every
battle and quiz will load with 0 questions — the app appears to work but
shows blank quiz screens.

**Mitigation:**
First task of Phase 3 is to verify questions are in the DB (Sub-phase 3.1).
If not: run the seed route or write a seed script before any other task.
Do not proceed to Sub-phase 3.2 until questions are confirmed in DB.

### P2 — Seed script inserts with wrong field names
**Problem:** The JSON uses `options[]` but the DB expects `optionA/B/C/D`.
A naive seed script will insert null values for all answer options — questions
load but all 4 answers appear blank. Difficult to spot quickly.

**Mitigation:**
In the seed script, explicitly map the fields:
```typescript
optionA: q.options[0],
optionB: q.options[1],
optionC: q.options[2],
optionD: q.options[3],
```
After seeding, verify by calling `/api/questions?count=3` and checking that
`optionA/B/C/D` are non-null in the response.

### P3 — Chamber quiz page shares state with boss battle
**Problem:** If the chamber quiz page is built as a copy-paste of the boss
battle page (tempting shortcut), it will carry over all the energy system
state, timers, and Phaser setup. This bloats the chamber page, causes
confusion about what is and isn't in scope, and creates maintenance debt.

**Mitigation:**
The chamber quiz page is a NEW, SEPARATE, SIMPLER page. It does NOT use:
- Phaser
- Energy bars
- Hit/Block buttons
- Boss charge timer
It DOES use: question display, answer buttons, progress tracking, XP award on completion.
Build it from scratch, not from the boss battle page.

### P4 — Progress save fails silently for guests
**Problem:** The progress POST endpoint requires auth. Guests get no progress
saving. If the frontend shows a "saved!" toast regardless, the user thinks
their progress was saved when it wasn't. On refresh, all chamber nodes reset.

**Mitigation:**
In the chamber quiz page, after completing a chamber:
- If authenticated: POST to progress endpoint, show "Progress saved!"
- If guest: store completion in `sessionStorage` (not localStorage — session only),
  show "Sign in to save progress across sessions"
The campaign map must read from `sessionStorage` as a fallback when no auth session.

**Note:** Full localStorage persistence is Phase 4 (auth system). Phase 3
gets the loop working — saving is functional for authenticated users only.

### P5 — Boss gate doesn't update after chamber completion without page refresh
**Problem:** The campaign map loads progress once on mount. After completing
a chamber and navigating back, the map shows stale progress (chamber still
shows as incomplete) unless the page re-fetches data.

**Mitigation:**
After the chamber quiz completes and the user is redirected back to `/campaign`,
pass a query param: `/campaign?refresh=1`. The campaign map checks for this
param on mount and re-fetches progress data before rendering.
Remove the param from the URL after fetching (use `router.replace`).

### P6 — Questions API returns questions from wrong module
**Problem:** The questions API with `questionSetId=qs-m1` assumes all Module 1
questions have that `questionSetId`. But the chemistry questions JSON has
`chamberId` values, not `questionSetId`. If seeded without a `questionSetId` field,
the API returns all questions (no filter), mixing Module 1 and Module 2 content.

**Mitigation:**
When seeding Module 1 questions, set `questionSetId = 'qs-m1'` on all of them.
When seeding Module 2 questions, set `questionSetId = 'qs-m2'`, etc.
The seed script must assign this field — it does not exist in the JSON source.

### P7 — Chamber quiz has no question count limit causing long sessions
**Problem:** Module 1 has many questions per chamber. Presenting all of them
in one sitting makes the chamber feel endless. Players quit before completing.

**Mitigation:**
Each chamber quiz shows exactly 8 questions (randomised from the chamber pool).
Completing all 8 marks the chamber as done — even if more questions exist.
8 questions takes roughly 5–7 minutes. This is the right session length for
a practice node.

### P8 — Back navigation from chamber quiz loses progress
**Problem:** Student answers 6/8 questions, hits browser back button.
They return to the map with 0/8 completed. Frustrating.

**Mitigation:**
Add a confirmation dialog before navigation away mid-quiz:
"You're 6/8 through this chamber. Leave anyway? Your progress won't be saved."
Use `window.onbeforeunload` and Next.js router events.
This is imperfect (browser limitations) but better than silent loss.

---

## TASKS

---

### SUB-PHASE 3.1 — Verify and seed questions into database

**Purpose:** Confirm questions exist in the DB before building anything that
depends on them. Nothing else in Phase 3 works without this.

#### Task 3.1.1 — Read the admin seed route
File: `app/api/admin/seed/route.ts`

Read this file completely before doing anything else.
Understand: what does it seed? What format does it expect? Does it handle
the `options[]` → `optionA/B/C/D` conversion?

If the seed route already handles Module 1 questions correctly: run it (Task 3.1.3).
If it doesn't: Task 3.1.2 must be completed first.

#### Task 3.1.2 — Fix or create seed script for Module 1 questions
*Only needed if Task 3.1.1 reveals the existing seed route is incomplete.*

The seed script must:
1. Read `data/chemistry_questions.json`
2. Filter to Module 1 questions only (`worldId === 1`)
3. For each question, map:
   ```typescript
   {
     id:             q.id,
     question:       q.question,
     optionA:        q.options[0],
     optionB:        q.options[1],
     optionC:        q.options[2],
     optionD:        q.options[3],
     correctAnswer:  q.correctAnswer,
     explanation:    q.explanation,
     topic:          q.topic,
     difficulty:     q.difficulty,
     chamberId:      q.chamberId,
     questionSetId:  'qs-m1',    // all Module 1 questions get this
     worldId:        1,
   }
   ```
4. Upsert (not insert — re-running should not duplicate) into `Question` table
5. Return count of questions seeded

The seed route should be protected: only callable with a secret header or in
development. Do not expose it publicly.

#### Task 3.1.3 — Run the seed and verify
Run the seed route (via browser fetch, curl, or the admin UI if one exists):
```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "x-admin-secret: [value from .env]"
```

After running:
1. Call `/api/questions?count=5` in the browser
2. Verify the response has 5 questions with non-null `optionA`, `optionB`,
   `optionC`, `optionD` fields
3. Verify `explanation` is present

If questions are blank or null: the seed has a format mismatch — fix Task 3.1.2
and re-run.

#### Task 3.1.4 — Verify question count per chamber
Call the Supabase dashboard (or a temporary admin query) to verify:

```sql
SELECT "chamberId", COUNT(*) as count
FROM "Question"
WHERE "questionSetId" = 'qs-m1'
GROUP BY "chamberId";
```

Expected minimum result:
| chamberId | count |
|-----------|-------|
| atomic-structure-and-periodicity | ≥ 10 |
| properties-of-matter | ≥ 10 |
| bonding | ≥ 10 |
| intermolecular-forces | ≥ 10 |

If any chamber has fewer than 8 questions: the chamber quiz cannot work for that
chamber. Add more questions to `chemistry_questions.json` before proceeding.

#### ✅ CHECKPOINT 3.1
**Pass criteria (ALL must be true):**
- [ ] `/api/questions?count=5` returns 5 questions with non-null optionA/B/C/D
- [ ] All 4 Module 1 chambers have ≥ 8 questions in the DB with correct chamberId
- [ ] Questions have `questionSetId = 'qs-m1'`
- [ ] No duplicate question IDs in the DB

---

### SUB-PHASE 3.2 — Add chamberId filter to questions API

**Purpose:** The questions API must be able to return questions for a specific
chamber. Currently it only filters by `questionSetId`.

#### Task 3.2.1 — Add `chamberId` query param to questions route
File: `app/api/questions/route.ts`

Add support for `?chamberId=` query param:
```typescript
const chamberId = searchParams.get('chamberId');

// After the existing questionSetId filter, add:
if (chamberId) {
  query = query.eq('chamberId', chamberId);
}
```

The query chain becomes:
1. Filter by `questionSetId` if provided
2. Filter by `chamberId` if provided
3. Both can be combined

#### Task 3.2.2 — Verify the new filter works
In browser, test:
```
GET /api/questions?chamberId=bonding&count=5
```
Verify: returns 5 questions with topic related to bonding.

```
GET /api/questions?chamberId=atomic-structure-and-periodicity&count=5
```
Verify: returns 5 questions about atomic structure.

#### ✅ CHECKPOINT 3.2
**Pass criteria:**
- [ ] `?chamberId=bonding&count=5` returns bonding questions only
- [ ] `?chamberId=intermolecular-forces&count=5` returns IMF questions only
- [ ] Zero TypeScript errors in the route file
- [ ] Non-existent chamberId returns empty array (not an error)

---

### SUB-PHASE 3.3 — Create campaign progress POST endpoint

**Purpose:** There is currently no way to save chamber completion.
This endpoint will be called when a chamber quiz is finished.

#### Task 3.3.1 — Add POST handler to the existing progress route
File: `app/api/campaign/progress/route.ts`

The existing file only has a GET handler. Add a POST handler:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { chamberId, worldId, xpEarned = 0 } = body;

  if (!chamberId || !worldId) {
    return json({ error: "Missing chamberId or worldId" }, 400);
  }

  // Auth check — same pattern as the GET handler
  const authHeader = request.headers.get("authorization") || "";
  let userId: string | null = null;

  try {
    const authRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-me`,
      { headers: { "Content-Type": "application/json", Authorization: authHeader } }
    );
    const authData = await authRes.json();
    if (!authData.isGuest && authData.id) userId = authData.id as string;
  } catch { /* treat as guest */ }

  // Guest: return success without saving (guest progress is sessionStorage only)
  if (!userId) {
    return json({ saved: false, guest: true });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Upsert so re-completing a chamber doesn't create duplicates
  await db.from("CampaignProgress").upsert({
    userId,
    chamberId,
    worldId,
    completed: true,
    xpEarned,
    bestScore: 100, // Phase 3: no scoring system, just completion
    updatedAt: new Date().toISOString(),
  }, { onConflict: "userId,chamberId" });

  // Award XP to user
  if (xpEarned > 0) {
    const { data: user } = await db
      .from("User")
      .select("campaignXp, totalScore")
      .eq("id", userId)
      .single();

    if (user) {
      await db.from("User").update({
        campaignXp: (user.campaignXp ?? 0) + xpEarned,
        totalScore: (user.totalScore ?? 0) + xpEarned,
      }).eq("id", userId);
    }
  }

  return json({ saved: true, guest: false });
}
```

**Note on the upsert conflict target:** Supabase upsert requires either a
primary key or a unique constraint on `userId + chamberId`. Verify this
constraint exists on the `CampaignProgress` table. If not: the upsert will
fail silently (it will insert duplicates). Check the DB schema first.

#### Task 3.3.2 — Verify the CampaignProgress table schema
In Supabase dashboard, check that `CampaignProgress` has:
- `userId` column (UUID)
- `chamberId` column (text)
- `worldId` column (text or integer)
- `completed` column (boolean)
- `xpEarned` column (integer)
- `bestScore` column (integer)
- A unique constraint on `(userId, chamberId)` for upsert to work

If any columns are missing: add them via Supabase table editor before
running the POST handler. Do not use raw migrations in Phase 3 — use the
Supabase dashboard for schema changes.

#### ✅ CHECKPOINT 3.3
**Pass criteria:**
- [ ] POST to `/api/campaign/progress` with `{ chamberId: "bonding", worldId: "module-1", xpEarned: 50 }` returns `{ saved: true }` when called with a valid auth token
- [ ] Calling GET `/api/campaign/progress` after the POST shows the newly saved chamber
- [ ] POSTing the same chamber twice does not create duplicate rows
- [ ] Guest POST returns `{ saved: false, guest: true }` without error

---

### SUB-PHASE 3.4 — Create chamber quiz page

**Purpose:** A dedicated page for answering chamber practice questions.
Simpler than the boss battle — no energy system, no timers, no Phaser.
Just questions, answers, XP, and completion.

#### Task 3.4.1 — Create the chamber quiz page
Create new file: `app/campaign/chamber/[chamberId]/page.tsx`

This page needs:
- Read `chamberId` from URL params
- Look up chamber metadata from the campaign map `WORLDS` constant
  (or a new `CHAMBERS` lookup — see Task 3.4.2)
- Fetch 8 questions for this chamber from `/api/questions?chamberId=[id]&count=8`
- Display questions one at a time with A/B/C/D answer buttons
- Correct answer: green flash, show explanation for 1.5s, move to next question
- Wrong answer: red flash, show correct answer highlighted, show explanation 1.5s,
  move to next question (no penalty — this is practice)
- Progress indicator: "Question 3 of 8"
- On completing all 8 questions: show a completion screen with XP earned,
  POST to `/api/campaign/progress`, then navigate back to `/campaign?refresh=1`

**UI spec (keep it simple):**
```
[Chamber name header]
[Progress: 3/8 ●●●○○○○○]
[Question text]
[A. option]
[B. option]
[C. option]
[D. option]
[Explanation shown after answer — 1.5s then auto-advance]
```

No Hit button. No energy bar. No timer. No Phaser.
Dark background `#0d1117` to match campaign map style.

#### Task 3.4.2 — Create chamber metadata lookup
At the top of the chamber quiz page, define a lookup that maps
the `chamberId` URL param to a display name, associated world, and
the question chamberId:

```typescript
// Maps URL param (which matches campaign map chamber IDs) to question data
const CHAMBER_CONFIG: Record<string, {
  displayName: string;
  worldId: string;
  questionChamberId: string; // the chamberId used in the Question table
  themeColor: string;
  xpReward: number;
}> = {
  "m1-c1": {
    displayName: "Atomic Structure",
    worldId: "module-1",
    questionChamberId: "atomic-structure-and-periodicity",
    themeColor: "#10b981",
    xpReward: 50,
  },
  "m1-c2": {
    displayName: "Properties of Matter",
    worldId: "module-1",
    questionChamberId: "properties-of-matter",
    themeColor: "#10b981",
    xpReward: 50,
  },
  "m1-c3": {
    displayName: "Chemical Bonding",
    worldId: "module-1",
    questionChamberId: "bonding",
    themeColor: "#10b981",
    xpReward: 50,
  },
  "m1-c4": {
    displayName: "Intermolecular Forces",
    worldId: "module-1",
    questionChamberId: "intermolecular-forces",
    themeColor: "#10b981",
    xpReward: 50,
  },
};
```

#### Task 3.4.3 — Handle guest progress in sessionStorage
In the chamber completion handler, after POSTing to the progress API:

```typescript
const result = await fetch('/api/campaign/progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chamberId, worldId, xpEarned }),
});
const data = await result.json();

// Always update sessionStorage as fallback for guests
// and as immediate UI update for authenticated users
const key = 'chemquest_session_progress';
const existing = JSON.parse(sessionStorage.getItem(key) ?? '[]');
if (!existing.includes(chamberId)) {
  sessionStorage.setItem(key, JSON.stringify([...existing, chamberId]));
}

if (data.guest) {
  toast.info("Progress saved for this session. Sign in to keep it!");
} else {
  toast.success("Chamber complete! +50 XP");
}
```

#### Task 3.4.4 — Add before-unload warning
Add this effect to the chamber quiz page to warn before navigating away mid-quiz:

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (currentQuestionIndex > 0 && !completed) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [currentQuestionIndex, completed]);
```

#### ✅ CHECKPOINT 3.4
**Pass criteria (test manually in browser):**
- [ ] Navigate to `/campaign/chamber/m1-c1` — page loads, shows "Atomic Structure" header
- [ ] 8 questions load (verify in network tab: questions API call made)
- [ ] Answering correctly: green flash, explanation shown, auto-advance after 1.5s
- [ ] Answering incorrectly: red flash, correct answer highlighted, explanation shown, auto-advance
- [ ] Progress indicator counts up correctly (1/8 → 2/8 → ... → 8/8)
- [ ] Completing all 8 questions: completion screen appears with XP
- [ ] Completion screen: progress POST made (check network tab)
- [ ] Clicking "Back to Map" navigates to `/campaign?refresh=1`
- [ ] No console errors throughout

---

### SUB-PHASE 3.5 — Wire up campaign map

**Purpose:** Chamber nodes now link to the chamber quiz page instead of the
boss battle. The campaign map reads sessionStorage for guest progress and
DB for authenticated users. The boss gate responds correctly.

#### Task 3.5.1 — Update chamber links in campaign map
File: `app/campaign/page.tsx`

Find where chamber nodes are wrapped in `<Link>`:
```tsx
// Current (wrong):
<Link key={chamber.id} href={bossHref} className="flex items-center">

// Replace with (correct):
<Link key={chamber.id} href={`/campaign/chamber/${chamber.id}`} className="flex items-center">
```

#### Task 3.5.2 — Read sessionStorage progress for guest users
File: `app/campaign/page.tsx`

In the `load()` function inside the `useEffect`, after attempting to load
DB progress, merge with sessionStorage:

```typescript
// Merge sessionStorage progress (guest fallback)
const sessionKey = 'chemquest_session_progress';
const sessionCompleted: string[] = JSON.parse(
  sessionStorage.getItem(sessionKey) ?? '[]'
);

// Build merged progress: DB progress + session-only completions
const dbProgress: ProgressEntry[] = progData.progress || [];
const sessionOnlyEntries: ProgressEntry[] = sessionCompleted
  .filter(id => !dbProgress.find(p => p.chamberId === id))
  .map(id => ({ chamberId: id, completed: true, bestScore: 100, xpEarned: 50 }));

setProgress([...dbProgress, ...sessionOnlyEntries]);
```

#### Task 3.5.3 — Handle the `?refresh=1` param
File: `app/campaign/page.tsx`

At the start of the `load()` function, add:
```typescript
// Re-fetch was requested (came back from a chamber)
const url = new URL(window.location.href);
if (url.searchParams.get('refresh')) {
  router.replace('/campaign'); // remove the param cleanly
}
```

The `load()` function already runs on mount so no changes needed to trigger
a re-fetch — removing the param is just cosmetic.

#### Task 3.5.4 — Verify boss gate unlock logic
File: `app/campaign/page.tsx`

The existing boss gate check is:
```typescript
const allDone = completedCount === world.chambers.length;
```

And the boss node renders as locked if `!allDone`. This logic is correct.
Verify that with 4 chambers in Module 1 and `allDone = true`, the boss node
renders as a glowing, clickable skull (not a greyed-out locked one).

No code change needed if the existing logic works. Test it by manually
completing all 4 chambers and verifying the boss gate unlocks.

#### ✅ CHECKPOINT 3.5
**Pass criteria:**
- [ ] Clicking a chamber node navigates to `/campaign/chamber/[chamberId]`
- [ ] Completing a chamber and returning to map: that chamber shows as complete (checkmark)
- [ ] All 4 Module 1 chambers complete: boss node glows and is clickable
- [ ] Boss node not clickable when 1 or more chambers are incomplete
- [ ] Page refresh after completing a chamber: progress is NOT lost (DB for auth users, sessionStorage for guests)

---

### SUB-PHASE 3.6 — Full loop integration test

**Purpose:** Walk through the entire MVP experience from landing to map to
chambers to boss fight to victory screen. Catch any integration issues
that didn't appear in isolated sub-phase testing.

#### Task 3.6.1 — Remove the "Pro" paywall notice for MVP
File: `app/campaign/page.tsx`

The bottom of the campaign map shows:
```tsx
{userTier === 'free' && (
  <motion.div ...>
    <Crown ... />
    <h3>5 More Modules Locked</h3>
    <p>Modules 2–8 and all their boss battles unlock with Pro.</p>
    ...
  </motion.div>
)}
```

For the MVP, this notice creates a confusing and off-putting first impression
for new users who haven't even finished Module 1. Hide it for now:
```tsx
{/* TODO Phase 4: re-enable when subscription system is in place */}
{false && userTier === 'free' && (
  ...
)}
```

This does not remove the lock on Modules 2-3 — they remain locked via
`isLocked = !world.free && userTier === 'free'`. Only the notice is hidden.

#### Task 3.6.2 — Verify battle result navigates back correctly
File: `app/campaign/boss/[bossId]/page.tsx`

When the boss is defeated, the victory screen has a "Continue Campaign" button:
```tsx
<Button onClick={() => router.push('/campaign')}>
  Continue Campaign
</Button>
```

Verify this navigates back to `/campaign` (not `/campaign?refresh=1`).
The boss defeat is saved via `submitBossAttempt` which updates the DB — the
campaign map does not currently track boss completion as a separate state.
For Phase 3, this is acceptable. The module shows 4/4 chambers complete
and the boss gate still shows as unlocked.

**Note for future phases:** Module "completed" state (all chambers + boss
defeated) will be tracked in Phase 4 with a proper auth flow.

#### Task 3.6.3 — Verify questions load correctly for the boss battle
The boss battle fetches questions with `?questionSetId=qs-m1`.
After seeding Module 1 questions in Sub-phase 3.1, verify:
- Boss battle loads 15 questions
- Questions are from Module 1 topics (not from other modules)

If questions are empty: check that the seed set `questionSetId = 'qs-m1'` on all
Module 1 questions (see P6 in predicted problems).

#### ✅ CHECKPOINT 3.6
**Pass criteria:**
- [ ] Paywall notice no longer appears at bottom of campaign map
- [ ] After boss victory, "Continue Campaign" returns to map
- [ ] Boss battle loads with 15 questions (not 0)
- [ ] Questions in boss battle are Module 1 topics (sanity check a few)

---

## PHASE 3 FINAL CHECKPOINT — THE MVP TEST

**This is the full end-to-end test. Must be done manually in a browser.**
**Do this test twice: once as a guest, once as an authenticated user.**

### Test script (guest first, then authenticated):

1. Open the app at the root URL
2. Navigate to the campaign map
3. Confirm: Module 1 visible and unlocked, Modules 2-3 visible and locked
4. Click chamber 1 (Atomic Structure) — confirm: quiz page loads with correct title
5. Answer all 8 questions — confirm: progress indicator counts up, explanation shows each time
6. Complete the quiz — confirm: completion screen shows with XP
7. Click "Back to Map" — confirm: chamber 1 now shows as complete (checkmark) on map
8. Repeat for chambers 2, 3, and 4
9. After all 4 complete — confirm: boss gate glows and is clickable
10. Click boss gate — confirm: boss battle loads with the energy system
11. Fight the boss using Hit/Block/energy — confirm: full battle works
12. Win the battle — confirm: victory screen shows XP and coins
13. Click "Continue Campaign" — confirm: back on map, chambers still show as complete

### Pass criteria (ALL must be true for both guest and authenticated runs):
- [ ] Full loop completed with zero console errors
- [ ] Chamber quiz shows 8 questions with working answer buttons
- [ ] Chamber completion saves correctly (DB for auth, sessionStorage for guest)
- [ ] Boss gate unlocks after all 4 chambers complete
- [ ] Boss battle energy system fully functional (Phase 1 mechanics intact)
- [ ] Victory screen shows rewards
- [ ] Navigation back to map works
- [ ] Page refresh mid-campaign does not lose progress (auth users only)
- [ ] PROGRESS TRACKER updated

---

## WHAT PHASE 4 RECEIVES

When Phase 3 is complete and the final checkpoint passes, Phase 4 starts with:
- Fully playable Module 1 end-to-end (the MVP is shippable)
- Chamber quiz pages working
- Boss battle energy system working
- Progress saving for authenticated users
- Guest play working with sessionStorage
- Phase 4 focuses on: auth (login/signup), persistent progress across sessions,
  and the guest-to-account upgrade flow

---

*Previous phase: PHASE_02.md*
*Next phase: PHASE_04.md — Auth & Persistent Progress*
*Vision reference: VISION.md*
