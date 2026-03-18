# PHASE 07 — MODULES 2 & 3: CONTENT EXPANSION

**Phase Goal:** Modules 2 and 3 are fully playable. A player can walk through all their chambers, answer the right questions for each topic, fight the module boss, and earn progression. This doubles the playable content from 1 module to 3.

**Depends On:**
- Phase 3 complete (chamber pages exist, progress POST exists, chamber links updated)
- Phase 4 complete (auth wiring, session passed to APIs)
- Phase 6 complete (rewards working, so the expanded content actually gives progression)

**Honest Assessment of Starting State:** The campaign map already defines Modules 2 and 3 with correct chamber names and a vision of the right content. The questions already exist in `data/chemistry_questions.json` for every Module 2 and 3 topic — 10 questions per chamber. The ONLY missing pieces are: (1) the module bosses don't exist in `bosses.json`, (2) the chamber ID mappings don't exist for Modules 2 and 3, (3) the boss battle currently uses a `questionSetId` query param that maps to nothing for these modules, (4) the modules are Pro-locked. Phase 7 fixes all four.

---

## CONTEXT WINDOW SURVIVAL PROTOCOL

**If you start a new session for Phase 7, READ THESE FILES FIRST — in this order:**

1. `roadmap/PHASE_07.md` (this file — read PROGRESS TRACKER first)
2. `app/campaign/page.tsx` — WORLDS array, module definitions, boss IDs, chamber IDs
3. `data/bosses.json` — verify mole-master and reaction-king are NOT there (starting state)
4. `app/api/questions/route.ts` — how questions are fetched (chamberId filter from Phase 3)
5. `app/campaign/boss/[bossId]/page.tsx` — find `questionSetId` usage (how boss gets questions)
6. Check PROGRESS TRACKER below

**DO NOT start coding until all 5 files are read.**

---

## PROGRESS TRACKER

```
[ ] 7.1 — Add Module 2 and 3 bosses to bosses.json
[ ] 7.2 — Update campaign map WORLDS chamber ID mappings
[ ] 7.3 — Add CHAMBER_CONFIG for Modules 2 and 3 (questions API)
[ ] 7.4 — Fix boss battle question loading for all modules
[ ] 7.5 — Temporarily unlock Modules 2 and 3
[ ] 7.6 — CHECKPOINT: Module 2 and 3 fully playable end-to-end
```

---

## ACCURATE CURRENT STATE (verified by reading files)

### Campaign map `WORLDS` array — Module 2
```
id: 'module-2'
boss: { id: 'mole-master', name: 'Mole Master' }   ← NOT in bosses.json
chambers:
  m2-c1  "The Mole"       free: false
  m2-c2  "Stoichiometry"  free: false
  m2-c3  "Concentration"  free: false
  m2-c4  "Gas Laws"       free: false
free: false (Pro-locked)
```

### Campaign map `WORLDS` array — Module 3
```
id: 'module-3'
boss: { id: 'reaction-king', name: 'Reaction King' }  ← NOT in bosses.json
chambers:
  m3-c1  "Reaction Types"  free: false
  m3-c2  "Reaction Rates"  free: false
  m3-c3  "Energy Changes"  free: false
free: false (Pro-locked)
```

### `data/bosses.json` — 8 bosses, neither new boss present
All 8 existing bosses: acid-baron, redox-reaper, organic-overlord, thermo-titan, equilibrium-emperor, kinetic-king, atomic-archmage, solution-sovereign. `mole-master` and `reaction-king` are ABSENT.

### `data/chemistry_questions.json` — Questions already exist
Module 2 chamber questions (10 per chamber):
| Chamber name      | chamberId in JSON               | Campaign map chamber ID |
|-------------------|---------------------------------|-------------------------|
| The Mole          | `the-mole-concept`              | m2-c1                   |
| Stoichiometry     | `chemical-reactions-stoichiometry` | m2-c2               |
| Concentration     | `concentration-molarity`        | m2-c3                   |
| Gas Laws          | `gas-laws`                      | m2-c4                   |

Module 3 chamber questions (10 per chamber):
| Chamber name    | chamberId in JSON   | Campaign map chamber ID |
|-----------------|---------------------|-------------------------|
| Reaction Types  | `chemical-reactions` | m3-c1                  |
| Reaction Rates  | `rates-of-reaction` | m3-c2                   |
| Energy Changes  | `energy-changes`    | m3-c3                   |

**Boss battle questions: 20 questions with `chamberId: "boss-battle"`** — purpose-built, universal, work for any boss. This is the solution for boss battle question loading across all modules.

### Campaign map `bossHref` construction
```typescript
const bossHref = `/campaign/boss/${world.boss.id}?questionSetId=${setId}`;
// setId values: 'qs-m1', 'qs-m2', 'qs-m3'
```
`questionSetId=qs-m2` passes to the boss battle, which then passes it to `/api/questions?questionSetId=qs-m2`. No questions in the JSON file have `questionSetId: 'qs-m2'`. Result: boss battle loads 0 questions and immediately ends.

**Fix:** Boss battle should load questions with `chamberId=boss-battle` — the 20 universal boss battle questions. Remove the `questionSetId` approach from boss battles entirely.

### Pro lock mechanism
`app/campaign/page.tsx` line 214: `const isLocked = !world.free && userTier === 'free';`
To unlock for testing: change `free: false` to `free: true` in the WORLDS array for modules 2 and 3.

### Campaign map CTA button still points to bossHref
Lines 412-437: "Start Module", "Continue Module", "Challenge the Boss" buttons ALL link to `bossHref`. After Phase 3, chamber nodes link to `/campaign/chamber/[chamberId]`. But the CTA button at the bottom of each module card still goes to the boss. This needs to be fixed in Phase 7 to route "Start Module" to the first chamber, "Continue Module" to the next incomplete chamber.

---

## GUARDRAILS

1. **Do not invent questions.** The questions already exist in the JSON file. The job is mapping, not creating.
2. **Do not change existing boss IDs.** `acid-baron`, `redox-reaper`, etc. are in the DB via BossAttempt records. Renaming them would break existing data.
3. **`boss-battle` chamberId questions are the universal solution for boss battles.** Do not try to build per-module boss question sets. The 20 existing questions work for any chemistry boss.
4. **Phase 7 unlocks modules 2 and 3 as FREE temporarily.** This is intentional for MVP testing. The Pro paywall comes back in Phase 10. Do NOT implement Stripe/payments in Phase 7.
5. **Module 3 has 3 chambers, Module 2 has 4.** The boss gate logic (`allDone = completedCount === world.chambers.length`) works generically — no change needed to that logic.
6. **chargeTime must be added to new bosses.** The Phase 1 fix added chargeTime to the 8 existing bosses. The 2 new bosses need it too. Use reasonable values for their difficulty level.

---

## SUB-PHASE 7.1 — ADD MODULE 2 AND 3 BOSSES TO bosses.json

**File:** `data/bosses.json`

The campaign map references `mole-master` (Module 2) and `reaction-king` (Module 3). These must exist in bosses.json or the boss battle page will fail to load boss data.

### Task 7.1.1 — Understand how the boss battle page loads boss data
Read `app/campaign/boss/[bossId]/page.tsx` — find where it reads `bosses.json` and loads by `bossId`. Confirm the boss lookup is by `id` field. If the `id` is not found, document what the page currently renders (error? empty? crash?).

Expected: the page does `bossData = bosses.bosses.find(b => b.id === bossId)`. If not found, `bossData` is undefined and initialisation crashes. Confirm or correct this expectation before adding bosses.

### Task 7.1.2 — Add `mole-master` boss to bosses.json
Add the following boss object to the `"bosses"` array in `data/bosses.json`. Add it after `acid-baron` (the Module 1 boss) and before the later-module bosses:

```json
{
  "id": "mole-master",
  "name": "The Mole Master",
  "elementalType": "Quantitative Chemistry",
  "description": "Ruler of moles, stoichiometry, and the language of chemistry",
  "baseHp": 1100,
  "sprite": "/sprites/boss_chemistry.png",
  "themeColor": "#3b82f6",
  "chargeTime": 18,
  "particleColors": ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
  "specialMoves": [],
  "enrageThreshold": 0.3,
  "phases": [
    { "hpThreshold": 1.0, "speedMultiplier": 1.0 },
    { "hpThreshold": 0.6, "speedMultiplier": 1.3 },
    { "hpThreshold": 0.25, "speedMultiplier": 1.6 }
  ]
}
```

**chargeTime: 18** — Module 2 is harder than Module 1 (acid-baron = 20s), less time to think.

### Task 7.1.3 — Add `reaction-king` boss to bosses.json
Add the following boss object after `mole-master`:

```json
{
  "id": "reaction-king",
  "name": "The Reaction King",
  "elementalType": "Reactive Chemistry",
  "description": "Master of reaction types, rates, and energy transformations",
  "baseHp": 1200,
  "sprite": "/sprites/boss_chemistry.png",
  "themeColor": "#ef4444",
  "chargeTime": 15,
  "particleColors": ["#ef4444", "#f87171", "#fca5a5", "#fee2e2"],
  "specialMoves": [],
  "enrageThreshold": 0.3,
  "phases": [
    { "hpThreshold": 1.0, "speedMultiplier": 1.0 },
    { "hpThreshold": 0.55, "speedMultiplier": 1.35 },
    { "hpThreshold": 0.25, "speedMultiplier": 1.65 }
  ]
}
```

**chargeTime: 15** — Module 3 is harder still (Module 1 = 20, Module 2 = 18, Module 3 = 15).

Note: `specialMoves: []` is intentional. The special moves system is not implemented yet (Phase 1 removes the boss shield system). Empty array is safe — the battle system doesn't use `specialMoves` currently.

### Task 7.1.4 — Verify boss battle page handles new boss IDs correctly
Navigate to `/campaign/boss/mole-master` in the browser. Confirm:
- Boss name shows "The Mole Master"
- Boss HP shows 1100
- No crash or undefined errors

**PASS:** Boss intro phase renders with correct data
**FAIL:** Page crashes, shows undefined boss name, or HP shows NaN

---

## SUB-PHASE 7.2 — UPDATE CHAMBER ID MAPPINGS

**Purpose:** The chamber pages (Phase 3) use chamberId values from the campaign map (`m2-c1`, `m2-c2`, etc.) to save progress. The questions API (Phase 3) uses a CHAMBER_CONFIG to map these IDs to the actual question `chamberId` values in the JSON. Phase 3 created this mapping for Module 1. Phase 7 extends it for Modules 2 and 3.

### Task 7.2.1 — Find the CHAMBER_CONFIG in the questions API
Read `app/api/questions/route.ts`. Find the CHAMBER_CONFIG mapping object (created in Phase 3). Confirm it currently contains:
```typescript
const CHAMBER_CONFIG: Record<string, string> = {
  'm1-c1': 'atomic-structure-and-periodicity',
  'm1-c2': 'properties-of-matter',
  'm1-c3': 'bonding',
  'm1-c4': 'intermolecular-forces',
};
```
If the Phase 3 mapping uses different names, use those exact names and extend from there.

### Task 7.2.2 — Add Module 2 mappings to CHAMBER_CONFIG
Extend the mapping:
```typescript
const CHAMBER_CONFIG: Record<string, string> = {
  // Module 1 (from Phase 3)
  'm1-c1': 'atomic-structure-and-periodicity',
  'm1-c2': 'properties-of-matter',
  'm1-c3': 'bonding',
  'm1-c4': 'intermolecular-forces',
  // Module 2 (added in Phase 7)
  'm2-c1': 'the-mole-concept',
  'm2-c2': 'chemical-reactions-stoichiometry',
  'm2-c3': 'concentration-molarity',
  'm2-c4': 'gas-laws',
  // Module 3 (added in Phase 7)
  'm3-c1': 'chemical-reactions',
  'm3-c2': 'rates-of-reaction',
  'm3-c3': 'energy-changes',
};
```

### Task 7.2.3 — Verify question counts for each new chamber
Run the following SQL via Supabase MCP to verify questions are actually in the DB for each new chamberId (this assumes Phase 3's seed task has been run):

```sql
SELECT "chamberId", COUNT(*)
FROM "Question"
WHERE "chamberId" IN (
  'the-mole-concept',
  'chemical-reactions-stoichiometry',
  'concentration-molarity',
  'gas-laws',
  'chemical-reactions',
  'rates-of-reaction',
  'energy-changes',
  'boss-battle'
)
GROUP BY "chamberId";
```

Expected: at least 8 questions per chamber (the chamber page needs 8). If any chamber has 0 questions, the seed script must be re-run or the questions seeded manually from the JSON.

**STOP if any module 2 or 3 chamber returns 0 questions.** Re-seed before continuing.

---

## SUB-PHASE 7.3 — FIX BOSS BATTLE QUESTION LOADING

**Purpose:** The boss battle currently requests questions via `?questionSetId=qs-m2` which matches nothing. Switch to loading `boss-battle` chamberId questions for all boss battles — the 20 dedicated questions already in the JSON.

### Task 7.3.1 — Understand current boss question loading
Read `app/campaign/boss/[bossId]/page.tsx`. Find where questions are fetched. Look for:
```typescript
const questionSetId = searchParams.get('questionSetId');
// or
const url = `/api/questions?questionSetId=${questionSetId}`;
```
Document the exact fetch call and what happens when 0 questions are returned.

### Task 7.3.2 — Update boss battle to use `boss-battle` chamberId
Change the questions fetch in the boss battle page from `questionSetId` to `chamberId=boss-battle`:

```typescript
// Change from whatever currently exists:
const res = await fetch(`/api/questions?questionSetId=${questionSetId}`);

// To:
const res = await fetch('/api/questions?chamberId=boss-battle');
```

**Why this is correct:** The `boss-battle` chamberId questions are designed to be module-agnostic challenging questions suitable for any boss fight. They test cross-module chemistry knowledge. Using them universally simplifies the system without sacrificing quality.

**Note:** The `questionSetId` query param in the `bossHref` URL (e.g., `?questionSetId=qs-m2`) can be left in the URL — it will now simply be ignored by the boss battle page. No need to remove it from the campaign map at this stage.

### Task 7.3.3 — Verify `boss-battle` questions are seeded in DB
From Task 7.2.3 SQL results, confirm `boss-battle` chamberId returns ≥ 15 questions. The boss battle typically uses 10-15 questions. The JSON has 20 `boss-battle` questions.

If `boss-battle` chamberId returns 0 questions from the DB query: add to the seed script and re-seed before continuing.

### Task 7.3.4 — Shuffle boss-battle questions
The boss battle currently receives questions in a fixed order. With only 20 `boss-battle` questions shared across all boss fights, players will see the same sequence repeatedly.

Add shuffle to the questions API when `chamberId=boss-battle`:
```typescript
// In /api/questions route.ts, after fetching questions:
const shuffled = questions
  .sort(() => Math.random() - 0.5)
  .slice(0, 15); // take 15 of the 20
```

Or shuffle client-side in the boss battle page after receiving questions. Either location is fine — document which one you implement.

#### ✅ CHECKPOINT 7.3
- [ ] Navigate to `/campaign/boss/acid-baron` (without questionSetId param)
- [ ] Questions load (not 0, not undefined)
- [ ] Questions are chemistry questions (not empty / error)
- [ ] Same test for `/campaign/boss/mole-master`

---

## SUB-PHASE 7.4 — FIX CAMPAIGN MAP CTA BUTTON ROUTING

**Purpose:** After Phase 3, chamber nodes link to `/campaign/chamber/[chamberId]`. But the "Start Module" / "Continue Module" CTA button at the bottom of each module card still links to `bossHref` (the boss battle). This is wrong — it should route to the NEXT incomplete chamber, not the boss.

### Task 7.4.1 — Find the CTA button in campaign page
In `app/campaign/page.tsx` (~lines 411-438), find the `<Link href={bossHref}>` wrapping the CTA button. This is where "Start Module", "Continue Module", and "Challenge the Boss" all use the same `bossHref`.

### Task 7.4.2 — Compute nextChamberHref
Add a helper to find the next incomplete chamber for a module.

**Important:** `bossHref` is computed inside the `.map()` callback and is NOT in
scope at module/component level. The helper must accept it as a parameter to avoid
a `ReferenceError` when all chambers are complete.

```typescript
const getNextChamberHref = (
  world: typeof WORLDS[number],
  bossHref: string          // ← must be passed in; do not rely on closure
): string => {
  // Find first incomplete chamber
  for (const chamber of world.chambers) {
    if (!getChamberProgress(chamber.id)?.completed) {
      return `/campaign/chamber/${chamber.id}`;
    }
  }
  // All chambers complete — go to boss
  return bossHref;
};
```

### Task 7.4.3 — Update CTA button href
In the CTA button section (inside the `.map()` callback where `bossHref` is in scope):
```tsx
// Change:
<Link href={bossHref}>
  <button>
    {allDone ? "Challenge the Boss" : completedCount > 0 ? "Continue Module" : "Start Module"}
  </button>
</Link>

// To:
<Link href={allDone ? bossHref : getNextChamberHref(world, bossHref)}>
  <button>
    {allDone ? "Challenge the Boss" : completedCount > 0 ? "Continue Module" : "Start Module"}
  </button>
</Link>
```

When `allDone` is true: link goes to boss battle (correct).
When not all done: link goes to the next incomplete chamber (correct).

---

## SUB-PHASE 7.5 — TEMPORARILY UNLOCK MODULES 2 AND 3

**Purpose:** Modules 2 and 3 are Pro-locked (`free: false`). For MVP testing and gameplay, unlock them temporarily. The Pro paywall is reinstated in Phase 10 when monetization is implemented.

### Task 7.5.1 — Set Modules 2 and 3 to free in WORLDS array
In `app/campaign/page.tsx`, WORLDS array:
```typescript
// Module 2: change free: false to free: true
{
  id: 'module-2',
  ...
  chambers: [
    { id: 'm2-c1', name: 'The Mole', free: true },      // was false
    { id: 'm2-c2', name: 'Stoichiometry', free: true },  // was false
    { id: 'm2-c3', name: 'Concentration', free: true },  // was false
    { id: 'm2-c4', name: 'Gas Laws', free: true },       // was false
  ],
  free: true,  // was false
},
// Module 3: same
{
  id: 'module-3',
  ...
  free: true,  // was false
},
```

### Task 7.5.2 — Add a TODO comment marking these for Phase 10
```typescript
// TODO Phase 10: restore Pro lock (free: false) and implement subscription check
free: true,
```

### Task 7.5.3 — Update the locked modules notice copy
The current notice at the bottom of the campaign page says "5 More Modules Locked" when `userTier === 'free'`. Since modules 2 and 3 are now unlocked, this notice is now inaccurate.

For MVP: change the notice to display only when there are actually locked modules, or hide it entirely until Phase 10 adds real subscription logic.

Simplest fix: add `{false && ( ... )}` wrapper around the notice to hide it for now. Mark with `// TODO Phase 10`.

---

## SUB-PHASE 7.6 — CHECKPOINT: MODULES 2 AND 3 FULLY PLAYABLE

### Module 2 full playthrough:
1. Navigate to `/campaign`
2. Module 2 visible and unlocked (no Pro badge, no lock icon)
3. Click on Chamber 1 (The Mole) → goes to `/campaign/chamber/m2-c1`
4. Confirm: questions load about mole concept (10 available)
5. Complete 8 questions → progress saved → return to map
6. Chamber 1 shows checkmark on campaign map
7. Repeat for chambers 2, 3, 4 (Stoichiometry, Concentration, Gas Laws)
8. After all 4 chambers: boss gate unlocks (Mole Master pulsing)
9. Enter boss battle → Mole Master loads (name, 1100 HP)
10. Complete boss battle → rewards shown

**PASS criteria:**
- [ ] All 4 Module 2 chambers complete correctly with right questions
- [ ] Mole Master boss exists and loads correctly
- [ ] Boss battle uses boss-battle questions (10-15 chemistry questions)
- [ ] Victory rewards awarded and written to User table

### Module 3 full playthrough:
1. Same flow: 3 chambers → boss gate → Reaction King
2. Module 3 boss loads with 1200 HP
3. Chamber questions: reaction types, rates, energy changes — verify they match topics

**PASS criteria:**
- [ ] All 3 Module 3 chambers complete with correct questions
- [ ] Reaction King loads correctly
- [ ] No console errors

### Combined map state:
- [ ] Campaign map shows modules 1, 2, 3 all unlocked
- [ ] Progress persists correctly per module (Module 1 progress not affected by Phase 7 changes)
- [ ] Locked modules notice hidden (or absent)
- [ ] CTA button routes: "Start Module" → first chamber, "Continue Module" → next incomplete chamber, "Challenge the Boss" → boss battle

---

## PREDICTED PROBLEMS AND MITIGATIONS

### Problem 1: Boss battle page crashes on new bossId
**Symptom:** Navigating to `/campaign/boss/mole-master` crashes or shows blank
**Root cause:** The boss lookup in `page.tsx` does `.find(b => b.id === bossId)` and if the result is undefined, downstream access to `bossData.baseHp` throws.
**Mitigation:** Task 7.1.1 explicitly checks this first. If the page has a null guard, fine. If not, add: `if (!bossData) return <div>Boss not found</div>` after the lookup.

### Problem 2: Module 2/3 questions not in Supabase DB
**Symptom:** Chamber page loads with 0 questions, immediately marks complete, or throws error
**Root cause:** Phase 3 seed only seeded Module 1 questions. Module 2 and 3 questions are in the JSON file but not necessarily in the DB.
**Mitigation:** Task 7.2.3 explicitly checks this with a SQL query BEFORE any code changes. If 0 rows: re-seed with the full JSON file. The seed script should handle all 339+ questions.

### Problem 3: `boss-battle` chamberId questions not in Supabase DB
**Symptom:** Boss battle loads 0 questions even after fixing the query
**Root cause:** Same as Problem 2 — seed may have missed `boss-battle` chamberId.
**Mitigation:** Task 7.2.3 checks `boss-battle` explicitly. If 0 rows: add to seed and re-seed.

### Problem 4: `chemical-reactions` chamberId conflicts with a different topic
**Symptom:** Module 3 Chamber 1 (Reaction Types) loads wrong questions
**Root cause:** `chemical-reactions` is a broad topic ID that might contain multiple question types. 10 questions tagged `chemical-reactions` may cover more than just "Reaction Types".
**Mitigation:** Verify the first few questions from `chemical-reactions` are appropriate for Module 3. If they're too advanced, consider using `predicting-reactions-metals` as the alternative (10 questions exist for that chamberId too). Document the final choice.

### Problem 5: `getNextChamberHref` returns wrong chamber for partially completed modules
**Symptom:** "Continue Module" button goes to Chamber 3 when Chamber 2 was last completed, skipping it
**Root cause:** Progress state may be loaded before the fetch completes, causing `getChamberProgress` to return undefined for all chambers on first render.
**Mitigation:** The `getNextChamberHref` function iterates chambers in order and returns the first one without `completed: true`. If all return undefined (not yet loaded), it returns Chamber 1. This is acceptable — the user can navigate from inside the chamber page to the next.

### Problem 6: Modules 2 and 3 boss gate never unlocks
**Symptom:** After completing all chambers, boss node stays locked/dimmed
**Root cause:** `allDone = completedCount === world.chambers.length`. If any chamber progress is saved with wrong chamberId (e.g., using the question chamberId `the-mole-concept` instead of the campaign chamber ID `m2-c1`), `getChamberProgress('m2-c1')` returns undefined.
**Mitigation:** The progress POST endpoint (Phase 3) must save progress using the campaign map's chamber ID (`m2-c1`), NOT the question chamberId (`the-mole-concept`). The chamber page URL is `/campaign/chamber/m2-c1` — the page uses `m2-c1` as the progress key. This is correct as long as Phase 3's chamber page passes `chamberId` (the URL param) to the progress API, not `questionChamberId`.

### Problem 7: Boss battle sends wrong bossId for new bosses
**Symptom:** Boss attempt saved to DB with bossId `mole-master` but profile page doesn't show trophy
**Root cause:** Profile page's `BOSSES` array is hardcoded with only the 8 original bosses. `mole-master` and `reaction-king` are not in that array.
**Mitigation:** After adding new bosses to bosses.json, also add them to the hardcoded `BOSSES` array in `app/profile/page.tsx`. This should be an explicit task (Task 7.1.5 below).

**Task 7.1.5 — Add new bosses to profile page BOSSES array:**
In `app/profile/page.tsx`, find the `BOSSES` constant (line ~34). Add:
```typescript
{ id: "mole-master",    name: "Mole Master",    element: "Quantitative" },
{ id: "reaction-king",  name: "Reaction King",  element: "Reactive Chem" },
```
This expands the trophy grid from 8 to 10 bosses.

---

## SESSION-END INSTRUCTIONS

At the end of every session working on Phase 7:
1. Update PROGRESS TRACKER — check off completed sub-phases
2. Document which chamberId mappings are confirmed to have questions in the DB
3. Note if any boss was added to bosses.json (so next session doesn't re-add)
4. If Checkpoint 7.6 passes, write "PHASE 7 COMPLETE" in PROGRESS TRACKER

---

## WHAT PHASE 7 DOES NOT INCLUDE

- ❌ Pro subscription / Stripe payments (Modules 2 and 3 are free for now)
- ❌ Per-module boss-specific question sets (all bosses use `boss-battle` questions)
- ❌ Modules 4–8 content (out of scope — future phases)
- ❌ New art for Mole Master or Reaction King (both use placeholder sprite, Phase 2 handles art)
- ❌ `specialMoves` implementation for new bosses (Phase 1 established this is not in scope)
- ❌ Module 2 / 3 boss chargeTime tuning (set to reasonable values, tuning is Phase 9 polish)

---

## WHAT PHASE 8 RECEIVES

When Phase 7 is complete:
- 3 fully playable modules with correct questions per chamber
- 10 bosses total (8 original + Mole Master + Reaction King)
- Campaign map correctly routes chamber nodes and CTA buttons
- Pro paywall removed for MVP testing (TODO Phase 10 marker in place)
- Full playthrough from registration → Module 1 → Module 2 → Module 3 is possible

Phase 8 makes this playable on mobile devices.

---

*Previous phase: PHASE_06.md — Progression Loop*
*Next phase: PHASE_08.md — Mobile & Performance*
