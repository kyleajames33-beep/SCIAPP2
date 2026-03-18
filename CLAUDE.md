# CLAUDE.md — ChemQuest Project Rules
> Read this file at the start of every session. These rules encode hard-won facts
> from code reads and prior work. Violating them causes bugs that are difficult to trace.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router (`app/` directory) |
| Database | Supabase (Postgres + Auth + Edge Functions) |
| ORM | Supabase JS client v2 — NOT Prisma, NOT raw SQL |
| Game engine | Phaser 3 (lazy-loaded: `await import("phaser")`) |
| Animation | Framer Motion 11 |
| Styling | Tailwind CSS (no CSS modules, no styled-components) |
| Language | TypeScript — strict mode intended (currently bypassed, see below) |

---

## Critical Architecture Rules

### 1. Rank System — lib/ranks.ts is the ONLY source of truth

**Do not use `lib/rank-system.ts`.** It is a duplicate with different ranks and will
be deleted in Phase 6. Every file must import from `lib/ranks.ts`.

```typescript
// CORRECT
import { getRank, getRankProgress, getNextRank, getRankInfo, formatXP } from '@/lib/ranks';

// WRONG — do not use
import { ... } from '@/lib/rank-system';
```

`lib/ranks.ts` exports: `RANKS`, `Rank`, `RankInfo`, `getRank`, `getNextRank`,
`getRankProgress`, `getRankInfo`, `formatXP`, `checkRankUp`

The boss attempt API (`/api/campaign/boss/attempt/route.ts`) uses `lib/ranks.ts`.
The profile page must also use `lib/ranks.ts`. The hub page must also use `lib/ranks.ts`.

**Do not add `badge` or `element` fields to `lib/ranks.ts`** — the profile page adapts
to the rank system, not the other way around. Use `symbol` where `badge` was used.

### 2. Chamber IDs — two different ID systems, never mix them

The app has **two distinct chamber ID namespaces**:

| Namespace | Example | Used for |
|-----------|---------|---------|
| Campaign map IDs | `m1-c1`, `m2-c4`, `m3-c2` | Progress tracking, URL params, `CampaignProgress` table |
| Question chamberIds | `atomic-structure-and-periodicity`, `the-mole-concept` | Fetching questions from DB |

**The `CampaignProgress` table ALWAYS uses campaign map IDs** (`m1-c1` etc.).
**The `Question` table ALWAYS uses question chamberIds** (`the-mole-concept` etc.).

The mapping between them lives in `CHAMBER_CONFIG` inside `app/api/questions/route.ts`.
Never save a question chamberId to `CampaignProgress`. Never fetch questions by `m1-c1`.

### 3. Boss Battle Questions — always use `chamberId=boss-battle`

Boss battles do NOT use per-module question sets. They always fetch:
```typescript
fetch('/api/questions?chamberId=boss-battle')
```
There are 20 universal boss-battle questions in the DB. This applies to ALL bosses
(acid-baron, mole-master, reaction-king, etc.). Never use `questionSetId` for boss battles.

### 4. submitBossAttempt — must fire exactly once per battle

`submitBossAttempt` writes XP, coins, and gems to the User table. Two code paths can
call it: the "boss HP = 0" victory path AND the "questions exhausted" defeat path.
After Phase 1's refactor to `handleBattleWin()` and `handleBattleLoss()`, there must be
**exactly two call sites**: one for victory, one for defeat.

Before adding any new call to `submitBossAttempt`, grep the file first:
```bash
grep -n "submitBossAttempt" app/campaign/boss/[bossId]/page.tsx
```
If the result is more than 2 lines, there is a double-fire bug.

### 5. Auth — always use authFetch for authenticated API calls

`lib/auth-fetch.ts` wraps fetch with the `Authorization: Bearer <token>` header.
**Never call authenticated API routes with bare `fetch`.**

```typescript
// CORRECT
import { authFetch } from '@/lib/auth-fetch';
const res = await authFetch('/api/campaign/boss/attempt', session, { method: 'POST', ... });

// WRONG — API treats caller as guest, returns null rewards
const res = await fetch('/api/campaign/boss/attempt', { method: 'POST', ... });
```

The session object comes from `useSupabaseAuth()`. Mirror it to a ref to avoid stale closures:
```typescript
const sessionRef = useRef(session);
useEffect(() => { sessionRef.current = session; }, [session]);
// Then use sessionRef.current inside async callbacks
```

### 6. Auth diagnosis — if rewards return null, check auth-me first

The boss attempt API identifies users via the `auth-me` Supabase Edge Function.
If `/api/campaign/boss/attempt` returns `{ rewards: null, rankUp: null }` despite
the user being logged in, the root cause is almost always one of:
1. `submitBossAttempt` not sending the Authorization header
2. The `auth-me` Edge Function not deployed / returning an error
3. The session being null at time of submit (stale closure)

Check Supabase → Edge Functions → `auth-me` logs before debugging anything else.

### 7. CampaignProgress — SELECT before upsert for first-completion detection

A Supabase `upsert` does NOT tell you whether the row was newly created or already existed.
To award XP only on first chamber completion, you MUST SELECT first:

```typescript
// ALWAYS do this — never assume upsert returns new/existing info
const { data: existingProgress } = await db
  .from('CampaignProgress')
  .select('id')
  .eq('userId', userId)
  .eq('chamberId', chamberId)
  .maybeSingle();

await db.from('CampaignProgress').upsert({ ... }, { onConflict: 'userId,chamberId' });

const isFirstCompletion = !existingProgress; // safe only because we checked first
```

### 8. Phaser canvas — do not remove mixBlendMode: "screen"

The `style={{ mixBlendMode: "screen" }}` on the Phaser container div suppresses
checkerboard rendering artifacts on the canvas background. Do not remove it.

---

## Known Technical Debt (do not fix unless in the assigned phase)

| Issue | Location | Assigned fix |
|-------|----------|-------------|
| `ignoreBuildErrors: true` | next.config.js | Phase 10 — fix TS errors first, then remove flag |
| `ignoreDuringBuilds: true` | next.config.js | Phase 10 — same |
| `lib/rank-system.ts` exists | lib/ | Phase 6 — delete after migrating profile page |
| `window.location.reload()` on Try Again | boss battle page | Phase 9 — replace with handleRestartBattle |
| Hub page inline RANKS array | app/hub/page.tsx | Phase 6 — remove after lib/ranks.ts migration |
| `timeRemaining` dead field in submitBossAttempt | boss battle page | Phase 6.3 — remove after Phase 1 timer removal |

**Do not "clean up" these issues opportunistically.** Each has a phase assigned for a reason.
Touching them out of order creates merge conflicts and test surface changes.

---

## Data Files — Sources of Truth

| File | Owns | Do not duplicate |
|------|------|-----------------|
| `data/bosses.json` | All boss definitions (id, name, baseHp, chargeTime, themeColor, phases, images, arenaBackground) | Boss data never lives in page.tsx |
| `data/chemistry_questions.json` | All questions (text, options, correct, chamberId, difficulty) | Never hardcode questions in components |
| `app/campaign/page.tsx` WORLDS array | Campaign structure (modules, chambers, boss links, free/Pro flags) | Source for module/chamber hierarchy |
| `lib/ranks.ts` RANKS array | All rank definitions (name, symbol, minXp, gradient, color) | Single rank system |
| `roadmap/CHARACTER_SPEC.md` | All player character definitions (Electron/Proton/Neutron), evolution milestones, passive multipliers, active powers | Character data never lives in page.tsx |

When adding bosses (e.g., Phase 7), add to `data/bosses.json` AND the profile page BOSSES array.
When adding modules, add to WORLDS array AND `CHAMBER_CONFIG` in `app/api/questions/route.ts`.
When reading character choice, always read from `User.characterChoice` — never hardcode a character.

---

## Reward Formulas — do not change these

These are balanced values. Do not adjust them without explicit user instruction.

**Boss victory:** `xp = 100 + streak * 10`, `coins = floor(dmg * 0.3) + correct * 10 + streak * 5`, `gems = floor(streak / 3) + 1`

**Boss defeat:** `xp = 20`, `coins = floor(dmg * 0.1)`, `gems = 0`

**Chamber completion:** `xp = 25` flat, **first completion only**

---

## Environment Variables

The app uses exactly three env vars. No others are required.

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL (safe for client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key (safe for client, RLS enforces access)
SUPABASE_SERVICE_ROLE_KEY=       # Server-only. NEVER prefix with NEXT_PUBLIC_. Full DB access.
```

`DATABASE_URL` and `JWT_SECRET` in `.env.example` are **legacy artifacts** — the app
does not use them. They will be removed in Phase 10.

---

## Supabase Patterns

```typescript
// Use maybeSingle() when 0 or 1 rows expected — won't throw on empty
const { data } = await db.from('User').select('*').eq('id', userId).maybeSingle();

// Use single() only when exactly 1 row is guaranteed — throws if 0 rows
const { data } = await db.from('User').select('*').eq('id', userId).single();

// upsert with conflict target — always specify onConflict
await db.from('CampaignProgress').upsert({ ... }, { onConflict: 'userId,chamberId' });

// Service role client — server-side only, bypasses RLS
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

---

## Roadmap

Phases live in `roadmap/PHASE_XX.md`. Each phase has a PROGRESS TRACKER table.

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Boss Battle Core (energy system) | ⬜ |
| 2 | Art Sprint + Character Selection | ⬜ |
| 3 | Campaign Map & Chambers | ⬜ |
| 4 | Auth & API Wiring | ⬜ |
| 5 | Leaderboard & Profile | ⬜ |
| 6 | Rewards & Progression Loop | ⬜ |
| 7 | Modules 2 & 3 Content + Character Evolution | ⬜ |
| 8 | Mobile Responsiveness | ⬜ |
| 9 | Polish & Onboarding | ⬜ |
| 9.5 | Character Powers (active abilities per module) | ⬜ |
| 10 | Production Launch | ⬜ |

**Starting a phase:** Read the phase file first. Check PROGRESS TRACKER. Read the listed
pre-read files. Do not write code until all pre-read files are confirmed read.

**Completing a sub-phase:** Run `npx tsc --noEmit`. Run the browser smoke test. Update
the PROGRESS TRACKER. Ask: "Would a staff engineer approve this?" before marking ✅.

**Context lost mid-phase:** Read the phase file → check PROGRESS TRACKER → read only the
files listed for remaining sub-phases. Do not re-read completed ones.

---

## Session Workflow

### Before writing any code
1. Read the phase doc and check PROGRESS TRACKER
2. Read every file listed in the pre-read checklist
3. Confirm current state matches what the phase doc says — if it doesn't, investigate before proceeding

### Before marking a sub-phase complete
1. `npx tsc --noEmit` — zero errors
2. Browser smoke test matching the checkpoint's pass criteria
3. "Would a staff engineer approve this?" — if not, use the elegant pivot:
   *"Knowing everything you know now, scrap this and implement the elegant solution."*

### At session end
1. Update PROGRESS TRACKER in the phase doc (✅ done, 🔄 in-progress, ⬜ not started)
2. Add a "STOPPED AT: Task X.Y.Z" note if mid-sub-phase
3. Run `npx tsc --noEmit` — do not leave TypeScript errors

### When something goes sideways
STOP. Do not push through. Re-read the phase doc. Re-read the relevant files.
Identify whether the issue is a wrong assumption in the phase doc (fix the doc) or
a wrong implementation (fix the code). Never brute-force past a failing checkpoint.

---

## What NOT to do

- **Do not create new rank system files.** Three already exist — the goal is one.
- **Do not add `NEXT_PUBLIC_` prefix to `SUPABASE_SERVICE_ROLE_KEY`.** It would expose full DB access to clients.
- **Do not use `window.location.reload()` for new features.** It's a known issue in the boss battle page being fixed in Phase 9.
- **Do not modify reward formulas** without explicit instruction — they are calibrated.
- **Do not fix technical debt outside its assigned phase** — it creates untracked surface area.
- **Do not skip the pre-read checklist** — phase docs are written against verified file state. Reading files confirms that state is still true before touching them.
