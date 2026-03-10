# ChemQuest – Game Design & Build Plan

**Last updated by:** Claude Sonnet 4.6 (claude-sonnet-4-6)
**Supabase project:** mykhdrewxbwkkrzercvp
**Vercel project:** sciapp-4
**Live URL:** https://sciapp-4.vercel.app
**Repo:** https://github.com/kyleajames33-beep/SCIAPP2

---

## 1. VISION

**Pokemon-style chemistry RPG quiz game.**

- Student has a player character that appears in battles
- Boss enemies have sprites, HP bars, and phase transitions
- Correct answers = attack the boss, deal damage
- Wrong answers = boss enrages or attacks back
- Campaign map with modules (worlds) → chambers (practice) → boss battle
- Progression: earn XP, level up, unlock abilities
- Economy: earn coins, buy battle items in shop
- Single player v1

**Reference games:** Pokemon (battle UI, sprite-based characters, turn-based), Gimkit (economy loop, fast pacing, energy)

---

## 2. CURRENT STATE (VERIFIED – DO NOT ASSUME)

### What is WORKING
| Feature | URL | Status |
|---------|-----|--------|
| Campaign map | `/campaign` | ✅ Working. Dark themed, shows 3 modules, chambers, boss cards |
| Boss battle page | `/campaign/boss/[bossId]` | ✅ Working. HP bar, phases, questions load |
| Questions API | `/api/questions` | ✅ Working. Returns from Supabase, supports ?questionSetId= |
| Question sets API | `/api/questions/sets` | ✅ Working. Returns all 10 sets with correct counts |
| Auth (guest) | `/api/auth/me` → edge fn | ✅ Returns `{isGuest:true}` for unauthenticated users |
| Root redirect | `/` | ✅ Redirects to `/campaign` |
| DB: questions linked | Supabase | ✅ All 339 questions have correct questionSetId |

### What is BROKEN / DISABLED (returns 503)
| Route | Why broken |
|-------|-----------|
| `/api/campaign/boss/attempt` | Disabled during Prisma→Supabase migration |
| `/api/campaign/progress` | Disabled during Prisma→Supabase migration |
| `/api/game/answer` | Disabled during migration |
| `/api/game/finish` | Disabled during migration |
| `/api/profile` | Disabled during migration |

**These need to be rewritten to use Supabase directly (no Prisma).**

### What was DELETED (intentionally, do not recreate)
- `app/training/` — old purple gradient quiz game (the "one hour game")
- `app/game/` — duplicate of training game

### What exists but is NOT USED YET
- `public/sprites/boss_chemistry.png` — boss sprite (needs to be displayed in battle)
- `public/sprites/boss_biology.png`
- `public/sprites/boss_maths.png`
- `public/sprites/boss_physics.png`
- `public/sprites/player_strong_idle.png` — player sprite
- `public/sprites/player_strong_attack.png`
- `public/sprites/player_strong_hurt.png`
- `public/sounds/correct.mp3`, `wrong.mp3`, `coin.mp3`, `level_up.mp3`, `powerup.mp3`, `boss_hit.mp3`
- `data/bosses.json` — full boss config with sprites, theme colors, special moves, phase data
- `lib/boss-battle-types.ts` — full type system for boss battles (Boss, BossPhase, SpecialMove, StatusEffect, BossIntent, etc.)
- `app/campaign/boss/_components/RankUpCelebration.tsx` — working rank-up animation component

---

## 3. DATABASE SCHEMA (VERIFIED IN SUPABASE)

**Project ID:** mykhdrewxbwkkrzercvp
**All tables in `public` schema. All names PascalCase in quotes.**
**RLS: disabled on all tables. Use service role key server-side.**

### Confirmed existing tables
```sql
"Question"       -- id, question, optionA-D, correctAnswer, explanation, topic, difficulty, subject, questionSetId
"QuestionSet"    -- id, name, description, subject, module, isPublic, creatorId
"User"           -- id, username, displayName, email, totalCoins, totalScore, gamesPlayed, bestStreak, rank, campaignXp
"GameSession"    -- id, gameCode, gameMode, isMultiplayer, questionSetId, totalQuestions, questionIds, gameStatus, isCompleted, bossHp, bossMaxHp
```

### Tables referenced in code but NOT verified to exist
The following are in commented-out code. **Verify existence in Supabase before writing code that uses them:**
- `"CampaignProgress"` — chamber/boss completion per user
- `"BossAttempt"` — boss battle history
- `"LeaderboardEntry"` — rankings
- `"UserProgress"` — mode-specific progress

**Before using any of these, run:** `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`

### QuestionSet IDs (verified, all have questions)
| ID | Name | Questions |
|----|------|-----------|
| qs-m1 | Module 1 – Properties and Structure of Matter | 31 |
| qs-m2 | Module 2 – Introduction to Quantitative Chemistry | 41 |
| qs-m3 | Module 3 – Reactive Chemistry | 41 |
| qs-m4 | Module 4 – Drivers of Reactions | 41 |
| qs-m5 | Module 5 – Equilibrium and Acid Reactions | 41 |
| qs-m6 | Module 6 – Acid/Base Reactions | 41 |
| qs-m7 | Module 7 – Organic Chemistry | 41 |
| qs-m8 | Module 8 – Applying Chemical Ideas | 42 |
| qs-m9 | Module 9 – Advanced Topics | 10 |
| qs-boss | Boss Battle Questions | 10 |

### Boss → Module mapping (verified in lib/boss-mapping.ts)
| Campaign Boss ID | Real Boss ID | Module |
|-----------------|-------------|--------|
| acid-baron | acid-baron | Module 1 |
| mole-master | solution-sovereign | Module 2 |
| reaction-king | redox-reaper | Module 3 |

---

## 4. FILE STRUCTURE (KEY FILES ONLY)

```
app/
  page.tsx                          — redirects to /campaign
  campaign/
    page.tsx                        — campaign map (WORKING)
    boss/
      [bossId]/page.tsx             — boss battle page (WORKING, needs visual upgrade)
      _components/
        RankUpCelebration.tsx       — rank-up overlay (WORKING, unused)
  api/
    questions/route.ts              — GET /api/questions?count=N&questionSetId=X
    questions/sets/route.ts         — GET /api/questions/sets
    campaign/
      boss/attempt/route.ts         — POST (DISABLED - needs rewrite)
      progress/route.ts             — GET (DISABLED - needs rewrite)
    auth/me/route.ts                — proxies to Supabase edge fn auth-me
    game/start/route.ts             — proxies to Supabase edge fn game-start

data/
  bosses.json                       — 8 bosses with sprites, themes, special moves
  chemistry_questions.json          — 339 source questions (DO NOT seed again)

lib/
  boss-battle-types.ts              — Boss, BossPhase, SpecialMove, StatusEffect types
  boss-mapping.ts                   — campaign boss IDs → real boss IDs
  game-types.ts                     — Question, GameMode, Player, GameConfig types
  game-config.ts                    — mode configs, streak multipliers, power-up costs

public/
  sprites/
    boss_chemistry.png              — USE THIS for chemistry bosses
    boss_biology.png
    boss_maths.png
    boss_physics.png
    player_strong_idle.png          — USE THIS for player character
    player_strong_attack.png        — player attacking animation
    player_strong_hurt.png          — player hurt animation
  sounds/
    correct.mp3, wrong.mp3, coin.mp3, level_up.mp3, powerup.mp3, boss_hit.mp3

scripts/
  seed-supabase.ts                  — DO NOT RUN (resets questionSetId to null)
```

---

## 5. SUPABASE EDGE FUNCTIONS (live in Supabase, not in repo)

| Function | Purpose |
|----------|---------|
| `auth-me` | Returns user profile or `{isGuest:true}`. No JWT required. Always HTTP 200. |
| `game-start` | Creates GameSession, returns 10 shuffled questions. Accepts `{gameMode, questionSetId, subject}`. |

---

## 6. BUILD PLAN – PHASE BY PHASE

### PHASE 1: Pokemon Battle Screen (Visual overhaul of boss battle page)
**Goal:** Make the battle look like a Pokemon fight.
**File to edit:** `app/campaign/boss/[bossId]/page.tsx`

#### 1a. Battle Arena Layout
Replace the current card-based layout with a split-screen:
- **Top half:** Background art + Boss sprite (right side) + Player sprite (left side)
- **Bottom half:** Question + answer buttons + HP bars

Layout structure:
```
┌─────────────────────────────────────────┐
│  BOSS HP BAR          PLAYER HP BAR     │
│                                         │
│  [boss sprite]      [player sprite]     │  ← battle-arena div, ~50vh
│                                         │
├─────────────────────────────────────────┤
│  [question text]                        │
│  [A] [B] [C] [D]                        │  ← question panel, ~50vh
│  Streak: X   Damage: X   Timer: Xs      │
└─────────────────────────────────────────┘
```

#### 1b. Sprites
- Boss sprite: use `boss_chemistry.png` from `/public/sprites/`
- Player sprite: use `player_strong_idle.png`, swap to `player_strong_attack.png` on correct answer
- Load boss sprite from `data/bosses.json` → boss.sprite field
- Boss sprite should be flipped horizontally (CSS `scale-x: -1`)

#### 1c. Attack Animations (CSS only, no library needed)
- Correct answer: player sprite briefly swaps to attack frame, boss shakes (translateX animation)
- Wrong answer: player sprite swaps to hurt frame, player card shakes
- Use `setTimeout` to revert sprite after 600ms

#### 1d. Damage Numbers
- Show floating "+50 DMG" text over boss on correct answer
- CSS: `position: absolute`, `animation: floatUp 1s ease-out forwards`
- `@keyframes floatUp { 0%{ opacity:1; transform:translateY(0) } 100%{ opacity:0; transform:translateY(-60px) } }`

#### 1e. Use bosses.json data
Currently `BOSS_DATA` is hardcoded in the page. Replace with import from `data/bosses.json` and use:
- `boss.themeColor` for the HP bar color
- `boss.sprite` for the sprite filename
- `boss.particleColors` for background gradient

### PHASE 2: Fix Boss Attempt API
**Goal:** Save boss battle results so progress is tracked.
**File to rewrite:** `app/api/campaign/boss/attempt/route.ts`

Remove the 503. Rewrite to use Supabase directly:
```typescript
// POST /api/campaign/boss/attempt
// Body: { bossId, damageDealt, questionsAnswered, correctAnswers, streak, victory }
// 1. Get user from auth header (call auth-me edge fn or parse JWT)
// 2. If guest, return { rewards: null } — no save
// 3. If logged in, upsert to "BossAttempt" table (verify table exists first!)
// 4. Calculate XP: victory ? 100 + (streak * 10) : 20
// 5. Update User.totalScore, User.campaignXp
// 6. Check for rank up (compare old campaignXp to new)
// 7. Return { rewards: { xp, coins, gems }, rankUp: null | { previous, new } }
```

**IMPORTANT:** Verify "BossAttempt" table exists before writing this. If it doesn't, create it:
```sql
CREATE TABLE "BossAttempt" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "bossId" text NOT NULL,
  "damageDealt" integer DEFAULT 0,
  "questionsAnswered" integer DEFAULT 0,
  "correctAnswers" integer DEFAULT 0,
  "maxStreak" integer DEFAULT 0,
  victory boolean DEFAULT false,
  "createdAt" timestamp DEFAULT now()
);
```

### PHASE 3: Fix Campaign Progress API
**Goal:** Show chamber completion on the campaign map.
**File to rewrite:** `app/api/campaign/progress/route.ts`

Remove 503. For now, return empty progress for guests (so map still renders):
```typescript
// GET /api/campaign/progress
// 1. Try to get user from auth header
// 2. If guest, return { progress: [] }
// 3. If logged in, query "CampaignProgress" table (verify exists first)
// 4. Return { progress: [{ chamberId, completed, bestScore, xpEarned }] }
```

### PHASE 4: Sound Effects
**Goal:** Wire up the existing sound files.
**Files:** `public/sounds/*.mp3` already exist.

In the boss battle page:
```typescript
const playSound = (name: 'correct' | 'wrong' | 'boss_hit' | 'level_up') => {
  const audio = new Audio(`/sounds/${name}.mp3`)
  audio.volume = 0.4
  audio.play().catch(() => {}) // ignore autoplay blocks
}
```
- Correct answer → `correct.mp3` + `boss_hit.mp3`
- Wrong answer → `wrong.mp3`
- Victory → `level_up.mp3`

### PHASE 5: Campaign Map Visual Polish
**Goal:** Make the map feel like a world map, not a card list.

- Add a visual background that feels like a map (gradient, or a world map SVG)
- Module cards: add element/chemistry themed icons per module
- Chamber cards: show small sprites relevant to the chamber topic
- Animate the connection between chambers (a path/line showing progression)
- Locked modules: blur/desaturate effect

### PHASE 6: Economy Loop
**Goal:** Give players something to spend coins on between battles.

- Show coin balance on campaign map header
- Add a `/shop` page (basic): power-ups like "Extra time", "Hint", "Shield"
- Power-ups available during battle: extra 10s, reveal wrong answer, absorb one wrong answer
- Coins earned per correct answer, bonus for streaks

### PHASE 7: Player Progression
**Goal:** Student character levels up and feels growth.

- XP bar visible on campaign map
- Rank names: Hydrogen → Helium → Lithium → ... (elements)
- Each rank unlocks something: new player sprite, new ability, new map area
- RankUpCelebration component already exists and works — wire it into the boss attempt flow

---

## 7. GROUND RULES (READ BEFORE EVERY SESSION)

### Never do these:
1. **DO NOT run `scripts/seed-supabase.ts`** — it resets `questionSetId` to null for all 339 questions
2. **DO NOT recreate `/app/training/` or `/app/game/`** — these were deleted intentionally
3. **DO NOT use Prisma** — the app uses Supabase JS client directly everywhere
4. **DO NOT add `async` to server components in Next.js 14 without checking** — causes hydration issues
5. **DO NOT write code that uses a database table without first verifying it exists** — several tables in comments are not confirmed to exist

### Always do these:
1. **Read a file before editing it** — never edit from memory
2. **One targeted fix per commit** — don't batch unrelated changes
3. **Test at sciapp-4.vercel.app** — not localhost
4. **Use service role key for all Supabase queries in API routes** — not the anon key
5. **If questionSetId gets reset to null**, re-run this SQL directly in Supabase MCP:
   ```sql
   UPDATE "Question" SET "questionSetId" = 'qs-m1' WHERE id LIKE 'cq-m1-%';
   UPDATE "Question" SET "questionSetId" = 'qs-m2' WHERE id LIKE 'cq-m2-%';
   UPDATE "Question" SET "questionSetId" = 'qs-m3' WHERE id LIKE 'cq-m3-%';
   UPDATE "Question" SET "questionSetId" = 'qs-m4' WHERE id LIKE 'cq-m4-%';
   UPDATE "Question" SET "questionSetId" = 'qs-m5' WHERE id LIKE 'cq-m5-%';
   UPDATE "Question" SET "questionSetId" = 'qs-m6' WHERE id LIKE 'cq-m6-%';
   UPDATE "Question" SET "questionSetId" = 'qs-m7' WHERE id LIKE 'cq-m7-%';
   UPDATE "Question" SET "questionSetId" = 'qs-m8' WHERE id LIKE 'cq-m8-%';
   UPDATE "Question" SET "questionSetId" = 'qs-m9' WHERE id LIKE 'cq-m9-%';
   UPDATE "Question" SET "questionSetId" = 'qs-boss' WHERE id LIKE 'cq-boss-%';
   ```

### Env vars (never hardcode, always use process.env):
```
NEXT_PUBLIC_SUPABASE_URL         — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    — Anon key (safe for client)
SUPABASE_SERVICE_ROLE_KEY        — Service role (server only, bypasses RLS)
```

---

## 8. WHAT A NEW AI SESSION SHOULD DO FIRST

Before writing any code, a new AI session should:

1. Read this file (GAMEPLAN.md) fully
2. Read the current state of `app/campaign/boss/[bossId]/page.tsx`
3. Read `data/bosses.json` (first 20 lines to see boss structure)
4. Check Supabase for current questionSetId state: `SELECT "questionSetId", COUNT(*) FROM "Question" GROUP BY "questionSetId"`
5. Confirm which phase of the build plan we're on (user will tell you)
6. Do one phase at a time. Do not jump ahead.

---

## 9. PROGRESS TRACKER

- [x] ~~Old quiz game deleted~~ (training/, game/ removed)
- [x] ~~Campaign map working~~
- [x] ~~Boss battle page working~~
- [x] ~~Questions API working~~
- [x] ~~All 339 questions linked to QuestionSets~~
- [ ] **NEXT: Phase 1 — Pokemon battle screen visual overhaul**
- [ ] Phase 2 — Fix boss attempt API
- [ ] Phase 3 — Fix campaign progress API
- [ ] Phase 4 — Sound effects
- [ ] Phase 5 — Campaign map visual polish
- [ ] Phase 6 — Economy loop
- [ ] Phase 7 — Player progression
