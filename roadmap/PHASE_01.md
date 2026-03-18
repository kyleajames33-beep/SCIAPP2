# Phase 1 — Energy Battle System & Art Pipeline Decision
## Goal: First Playable Loop

> When Phase 1 is complete, a student can open the app, reach a boss gate,
> fight the boss using the full energy system (Hit, Block, charge timer,
> player HP), win or lose, and see a result screen.
> Art uses existing placeholder sprites. Art pipeline decision is locked
> and documented for Phase 2 to execute.

---

## ⚠️ GUARDRAILS — READ BEFORE TOUCHING ANY CODE

1. **BATTLE_SPEC.md is the single source of truth for all energy mechanics.**
   Every value, every formula, every mechanic must match it exactly.
   If this file and BATTLE_SPEC.md conflict, BATTLE_SPEC.md wins.
   Do not invent mechanics not in BATTLE_SPEC.md.

2. **One sub-phase at a time.** Do not start 1.3 while 1.2 checkpoint is failing.
   Each checkpoint is a hard gate. A failing checkpoint means stop and fix, not skip.

3. **No refactoring unrelated code.** If you notice something unrelated that
   looks wrong, add a comment `// TODO Phase X: [description]` and move on.
   Do not fix it now.

4. **Do not install new packages** unless a task explicitly names one.

5. **Do not modify any file outside of:**
   - `app/campaign/boss/[bossId]/page.tsx`
   - `app/campaign/boss/_components/PhaserBattleScene.tsx`
   - `data/bosses.json`
   - `roadmap/ART_PIPELINE.md` (created in Sub-phase 1.9)
   ...unless a task explicitly names a different file.

6. **Do not modify `BATTLE_SPEC.md`.** It is read-only.

7. **Every new state variable must use the exact name from BATTLE_SPEC.md §6.**
   Do not rename them.

8. **Three mechanics are being deliberately removed in this phase** (see Sub-phase 1.1).
   Do not attempt to preserve or work around them. Remove them cleanly.

---

## ⚠️ CONTEXT WINDOW SURVIVAL PROTOCOL

Every session working on Phase 1 must start with this exact reading sequence.
Do not skip steps. Do not rely on memory from a previous session.

### Mandatory reading order for any new session:
1. Read `roadmap/PHASE_01.md` — this file, full read
2. Read `BATTLE_SPEC.md` — full read
3. Read `app/campaign/boss/[bossId]/page.tsx` — current state
4. Read `app/campaign/boss/_components/PhaserBattleScene.tsx` — current state
5. Read `data/bosses.json` — current state
6. Check the PROGRESS TRACKER below — find the last passed checkpoint
7. Start at the next incomplete task after that checkpoint

### PROGRESS TRACKER
*Update this at the end of every session by editing this file.*

```
Last completed checkpoint: [ PHASE 1 COMPLETE ✅ — all checkpoints passed ]
Last files modified:       [ app/campaign/boss/[bossId]/page.tsx, data/bosses.json, roadmap/ART_PIPELINE.md ]
Session notes:             [ All 1.1–1.9 complete. Browser test passed: energy values correct,
                             hit/block/win/loss all verified, timer cleanup works, victory screen shows rewards.
                             Art pipeline: FRAMER_MOTION_PNG (3 PNGs per character, no sprite sheets, no Rive).
                             CHARACTER_SPEC.md created. Phase 2 ready to begin. ]
```

### If a session ends mid-task:
Revert the partial change before ending. A half-implemented feature is worse
than no feature. Use `git stash` if needed.
Never leave the app in a broken/non-compiling state between sessions.

---

## ACCURATE CURRENT STATE
*Read this carefully. This was verified by reading the actual files.*
*Do not assume anything beyond what is listed here.*

### Files and their actual current state:

**`app/campaign/boss/[bossId]/page.tsx`**
- Turn-based battle: correct answer → direct boss HP damage (`50 + streak * 10`)
- Boss phases: `"intro" | "combat" | "shield" | "victory" | "defeat"`
- Boss shield mechanic: boss activates a shield at 75%, 50%, 25% HP
  (`SHIELD_PHASES = [0.75, 0.5, 0.25]`) — this mechanic IS NOT in BATTLE_SPEC.md
- Per-question 30-second timer (`timeRemaining` state, `timerRef` interval)
  — BATTLE_SPEC.md §7 explicitly says to remove this
- Player shield as a power-up (`useShield()`, `playerShield` state)
  — single use, absorbs wrong answers — this is DIFFERENT from the Block button
- Streak tracked in `stats.streak` — can be reused for energy formula
- Player HP bar UI exists but is non-functional: always shows 100%, never depletes
- Defeat condition: run out of questions — NOT player HP reaching 0
- Win condition: boss HP reaches 0 — this is correct, keep it
- Phaser integration working: `phaserRef`, `onReady` callback, all three triggers work
- `bossSheetUrl` is hardcoded as `"/sprites/boss_atom_sheet.png"` — NOT from bosses.json
- `bossJsonData` uses `data.baseHp` mapped to `boss.maxHp` — note: JSON field is `baseHp`

**`data/bosses.json`**
- Location: `data/bosses.json` (imported as `@/data/bosses.json`, NOT in `/public`)
- Has 8 bosses
- Field name is `baseHp` — NOT `maxHp`
- `chargeTime` field is MISSING from all bosses — must be added as a task
- `spriteSheet` field is MISSING — boss sprite is hardcoded in page.tsx
- Has unrelated fields (`specialMoves`, `phases`, `speedMultiplier`) that are
  NOT used by the energy system — leave them untouched

**`app/campaign/boss/_components/PhaserBattleScene.tsx`**
- `FRAME_W = 300`, `FRAME_H = 298` — correct, do not change
- `onReady` callback pattern — working
- Three methods exposed: `triggerPlayerAttack`, `triggerPlayerHurt`, `triggerBossHurt`
- `mix-blend-mode: screen` on container — known workaround for checkerboard sprites
- Boss idle float tween working
- Particle emitter working

**`public/sprites/`**
- `hero_sheet.png` — exists, placeholder, checkerboard baked in
- `boss_atom_sheet.png` — exists, placeholder, checkerboard baked in
- Other sprites referenced in bosses.json (`boss_chemistry.png` etc.) — DO NOT EXIST
  These are dead references. The hardcoded atom sheet is the only working sprite.

### What does NOT exist yet:
- Energy bar (UI and state)
- Boss charge timer
- Hit button
- Block button (the BATTLE_SPEC.md version — energy cost, absorbs boss timer attacks)
- Functional player HP (HP that actually decreases)
- Boss `chargeTime` in bosses.json

---

## DECISIONS MADE BEFORE PHASE 1 STARTS

These three decisions were made during planning. They are final for Phase 1.
Do not re-litigate them mid-implementation.

**Decision A: Remove the boss shield phase mechanic (`SHIELD_PHASES`)**
- Rationale: it conflicts with the energy system and adds complexity on top of
  complexity. Can return as a boss-specific special mechanic in Phase 4.
- Action: remove `SHIELD_PHASES`, `boss.shieldActive`, `boss.shieldHp`,
  `checkShieldPhase()`, `handleShieldBreak()`, and the `"shield"` phase UI.
- The `BossPhase` type becomes: `"intro" | "combat" | "victory" | "defeat"`

**Decision B: Remove the per-question 30-second timer**
- Rationale: BATTLE_SPEC.md §7 explicitly says to remove it. It conflicts with
  the player-controlled pacing of the energy system.
- Action: remove `timeRemaining` state, `timerRef`, the timer `useEffect`,
  `handleTimeout()`, the `useExtraTime` power-up and its UI button.
- The timer display in the player HP area is also removed.

**Decision C: Remove the player shield power-up, keep hint power-up**
- Rationale: the player shield power-up (absorbs wrong answers) is being
  replaced by the Block button (absorbs boss timer attacks). They are different
  things but having both will confuse players and the implementation.
- Action: remove `useShield()`, `playerShield` state, and the shield power-up
  button from the UI. Keep `useHint()` and the hint button. Keep `useExtraTime`
  button removal (already covered in Decision B).
- `powerUps` state becomes: `{ hint: 1 }` only.

---

## PREDICTED PROBLEMS & MITIGATIONS

Read this before starting. These are the most likely failure points.

### P1 — Timer memory leaks
**Problem:** `setInterval` for the boss charge timer keeps running after the
component unmounts or battle ends, causing React state-update-on-unmounted-component
warnings and corrupting the next battle.

**Mitigation:**
Store all intervals and timeouts in `useRef`. Clear them all in the useEffect
cleanup AND at the start of win/loss handlers.
```typescript
// Pattern for every interval/timeout in this file:
const bossChargeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
// Clear: if (bossChargeIntervalRef.current) clearInterval(bossChargeIntervalRef.current);
```

### P2 — Stale closure in timers (the most common React game bug)
**Problem:** Inside `setInterval`, reading a `useState` value always returns
the value from when the interval was created, not the current value.
Reading `playerEnergy` inside the boss charge timer will always return 0.

**Mitigation:**
Mirror every state value that timers need to READ into a `useRef`:
```typescript
const playerEnergyRef = useRef(0);
// When setting state, also update ref:
// setPlayerEnergy(v => { playerEnergyRef.current = v; return v; });
// In timers, read from ref: playerEnergyRef.current
```
This is the single most likely bug in Phase 1. Expect it if timers behave wrong.

### P3 — Phaser "animation already playing" error
**Problem:** Calling `boss.play("boss-hurt")` while it is already playing
throws a warning and can break animation state.

**Mitigation:**
Use the `ignoreIfPlaying` flag:
```typescript
this.boss.play({ key: "boss-hurt", ignoreIfPlaying: true });
```

### P4 — Boss charge fires simultaneously with player answer
**Problem:** Boss charge reaches 100% at the exact moment a player submits an
answer. Both state updates fire simultaneously — undefined behaviour.

**Mitigation:**
Add `bossAttackingRef = useRef(false)`. Set it true when boss attacks, false
after 800ms. In `handleAnswer`, early-return if `bossAttackingRef.current`.

### P5 — Shield absorbed but expiry timer also fires
**Problem:** Player blocks, boss attacks, shield absorbs — but the 8-second
expiry `setTimeout` also fires and tries to clear a shield that is already gone.

**Mitigation:**
When shield absorbs an attack: cancel the expiry timer immediately before
clearing shield state.
```typescript
if (shieldExpiryTimerRef.current) clearTimeout(shieldExpiryTimerRef.current);
```

### P6 — Win condition fires before Phaser death animation plays
**Problem:** Setting `boss.phase = "victory"` immediately when boss HP hits 0
transitions away from the arena before the hurt animation finishes.

**Mitigation:**
On boss HP ≤ 0: trigger `triggerBossHurt(finalDamage)` then
`setTimeout(() => handleBattleWin(), 1200)`.

### P7 — `chargeTime` missing from bosses.json causes NaN interval
**Problem:** `boss.chargeTime` is currently undefined on all bosses.
`undefined * 1000 = NaN`. `setInterval(fn, NaN)` fires immediately and
repeatedly, making the boss attack every render cycle.

**Mitigation:**
Always use: `const chargeMs = (bossJsonData.chargeTime ?? 15) * 1000;`
AND add `chargeTime` to all bosses in bosses.json as the first task in 1.1.

### P8 — `baseHp` vs `maxHp` confusion
**Problem:** `bosses.json` uses `baseHp`. The code maps it to `boss.maxHp`.
A future session might try to read `bossJsonData.maxHp` directly and get
`undefined`, breaking damage calculations silently.

**Mitigation:**
Always access HP via `boss.maxHp` (the mapped state value), never via
`bossJsonData.baseHp` directly, after the boss state is initialised.
In any new code: `boss.maxHp` is correct. `bossJsonData.baseHp` is the raw source.

### P9 — Removing three mechanics breaks the existing phase flow
**Problem:** `boss.phase` currently has 5 states. Removing the "shield" state
and the defeat-via-questions path means phase transitions need to be audited.
Leaving any reference to `boss.phase === "shield"` will cause silent incorrect
behaviour (the UI renders nothing for that phase, not an error).

**Mitigation:**
After removing the shield mechanic, search the entire `page.tsx` for every
reference to `"shield"` and `SHIELD_PHASES` and confirm all are removed.
Use find-in-file before moving to the next sub-phase.

---

## TASKS

Complete each sub-phase fully before starting the next.
Each sub-phase ends with a CHECKPOINT — specific tests to run.
A failing checkpoint stops progress until fixed.

---

### SUB-PHASE 1.1 — Data preparation and mechanic removal

**Purpose:** Fix the data issues and remove the three deprecated mechanics
before adding anything new. Starting the energy system on top of broken data
or conflicting mechanics will cause undiagnosable bugs.

#### Task 1.1.1 — Add `chargeTime` to all bosses in `data/bosses.json`
File: `data/bosses.json`

Add `"chargeTime"` field to each boss. Use these values (aligned with BATTLE_SPEC.md §3):

| Boss id | chargeTime |
|---------|-----------|
| acid-baron | 20 |
| redox-reaper | 17 |
| organic-overlord | 14 |
| thermo-titan | 12 |
| equilibrium-emperor | 10 |
| kinetic-king | 9 |
| atomic-archmage | 8 |
| solution-sovereign | 15 |

Add the field at the top level of each boss object, alongside `baseHp` and `themeColor`.

#### Task 1.1.2 — Remove Decision A: boss shield phase mechanic
File: `app/campaign/boss/[bossId]/page.tsx`

Remove the following completely:
- `const SHIELD_PHASES = [0.75, 0.5, 0.25];` (line ~69)
- `shieldTriggeredRef` useRef
- `boss.shieldActive` and `boss.shieldHp` from the `BossState` interface
- `boss.shieldActive: false` and `boss.shieldHp: 0` from the initial boss state
- `checkShieldPhase()` function
- `handleShieldBreak()` function
- The shield-triggering logic inside `handleAnswer` (the `if (checkShieldPhase(...))` block)
- The `"shield"` case in the `BossPhase` type — update to:
  `type BossPhase = "intro" | "combat" | "victory" | "defeat";`
- The `{boss.phase === "shield" && (...)}` JSX block
- The shield HP sub-bar inside the boss HP bar JSX

After removal: search the entire file for the string `"shield"` (case sensitive).
Every remaining match must be intentional (the new Block button references `shieldActive`
and `shieldCooldown` — those are the PLAYER's new shield states, not the boss shield).

#### Task 1.1.3 — Remove Decision B: per-question timer
File: `app/campaign/boss/[bossId]/page.tsx`

Remove the following completely:
- `const [timeRemaining, setTimeRemaining] = useState(30);`
- `timerRef` useRef
- The timer `useEffect` (the one that runs `setInterval` and calls `handleTimeout`)
- `handleTimeout()` function
- `useExtraTime()` function
- `powerUps.extraTime` from the `powerUps` state — update state to: `{ hint: 1, shield: 1 }`
  (shield stays for now, removed in Task 1.1.4)
- The `useExtraTime` button in the power-up bar JSX
- The timer display in the player HP area JSX (`⏱ {timeRemaining}s`)
- The `timeRemaining` field from the `submitBossAttempt` call body

#### Task 1.1.4 — Remove Decision C: player shield power-up
File: `app/campaign/boss/[bossId]/page.tsx`

Remove the following completely:
- `const [playerShield, setPlayerShield] = useState(false);`
- `powerUps.shield` — update `powerUps` state to: `{ hint: 1 }` only
- `useShield()` function
- The `playerShield` check inside `handleAnswer` (the block that says
  "Shield absorbed the wrong answer!")
- The shield power-up button in the power-up bar JSX

After removal: the power-up bar should show only the Hint button.

#### Task 1.1.5 — Verify the app still compiles and runs after removals
- Run the dev server
- Navigate to a boss battle
- Confirm: intro phase renders, "Begin Battle" works, questions load
- Confirm: no TypeScript errors, no console errors
- Confirm: answering a question still reduces boss HP (old direct-damage system
  is still in place — it will be replaced in Sub-phase 1.5)

#### ✅ CHECKPOINT 1.1
**Pass criteria (ALL must be true before proceeding):**
- [ ] `data/bosses.json` has `chargeTime` on all 8 bosses
- [ ] App compiles with zero TypeScript errors
- [ ] No references to `SHIELD_PHASES`, `checkShieldPhase`, `handleShieldBreak`,
      or `boss.phase === "shield"` remain in `page.tsx`
- [ ] No references to `timeRemaining`, `timerRef`, `handleTimeout`, `useExtraTime` remain
- [ ] No references to `playerShield`, `useShield`, `powerUps.shield` remain
- [ ] Boss battle loads in browser, questions work, no console errors

---

### SUB-PHASE 1.2 — Add energy system state variables

**Purpose:** Add all new state before building any UI.
No UI changes in this sub-phase. Just state and refs.

#### Task 1.2.1 — Add state variables
File: `app/campaign/boss/[bossId]/page.tsx`

Add the following immediately after the existing `useState` declarations.
Use EXACTLY these names (they match BATTLE_SPEC.md §6):

```typescript
const [playerEnergy, setPlayerEnergy]     = useState(0);
const [playerHp, setPlayerHp]             = useState(100);
const [bossCharge, setBossCharge]         = useState(0);
const [wrongStreak, setWrongStreak]       = useState(0);
const [currentStreak, setCurrentStreak]   = useState(0);
const [shieldActive, setShieldActive]     = useState(false);
const [shieldCooldown, setShieldCooldown] = useState(false);
```

Note: `currentStreak` replaces reading from `stats.streak` for energy purposes.
`stats.streak` stays for the stats display row — do not remove it.

#### Task 1.2.2 — Add timer refs
Add the following immediately after the existing `useRef` declarations:

```typescript
const bossChargeIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
const shieldExpiryTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
const bossAttackingRef       = useRef(false);
const battleActiveRef        = useRef(false);
```

#### Task 1.2.3 — Add ref mirrors for stale closure prevention (see Predicted Problem P2)
Add the following immediately after the refs above:

```typescript
// Ref mirrors — always keep in sync with state when timers need to read current values
const playerEnergyRef  = useRef(0);
const shieldActiveRef  = useRef(false);
```

#### Task 1.2.4 — Add ref-syncing helper functions
Add these two helper functions before the `handleTimeout` area (which is now removed,
so place them before `calculateDamage`):

```typescript
const updatePlayerEnergy = (value: number) => {
  const clamped = Math.max(0, Math.min(100, value));
  playerEnergyRef.current = clamped;
  setPlayerEnergy(clamped);
};

const updateShieldActive = (value: boolean) => {
  shieldActiveRef.current = value;
  setShieldActive(value);
};
```

#### ✅ CHECKPOINT 1.2
**Pass criteria:**
- [ ] App compiles with zero TypeScript errors
- [ ] App runs in browser, battle still works (turn-based still active — not broken)
- [ ] No console errors

---

### SUB-PHASE 1.3 — Boss charge timer

**Purpose:** The boss now charges on a timer and fires when full.
This is the core of the difficulty system. Get this right before anything else.

#### Task 1.3.1 — Add boss charge timer useEffect
File: `app/campaign/boss/[bossId]/page.tsx`

Add this `useEffect` after the existing data-loading useEffect:

```typescript
useEffect(() => {
  // Only run when battle is in combat phase
  if (!boss || boss.phase !== "combat" || !bossJsonData) return;

  battleActiveRef.current = true;

  const chargeMs  = ((bossJsonData as { chargeTime?: number }).chargeTime ?? 15) * 1000;
  const tickMs    = 100;
  const increment = (100 / chargeMs) * tickMs;

  bossChargeIntervalRef.current = setInterval(() => {
    if (!battleActiveRef.current) return;
    setBossCharge(prev => {
      const next = prev + increment;
      if (next >= 100) {
        handleBossAttack();
        return 0;
      }
      return next;
    });
  }, tickMs);

  return () => {
    battleActiveRef.current = false;
    if (bossChargeIntervalRef.current) clearInterval(bossChargeIntervalRef.current);
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [boss?.phase, bossJsonData]);
```

**Why the eslint disable:** `handleBossAttack` must not be in the deps array or
it causes infinite re-renders. This is intentional.

#### Task 1.3.2 — Add handleBossAttack function
Add this function before `startBattle`:

```typescript
const handleBossAttack = useCallback(() => {
  if (!boss || !battleActiveRef.current) return;
  if (bossAttackingRef.current) return; // already mid-attack, ignore

  bossAttackingRef.current = true;
  setTimeout(() => { bossAttackingRef.current = false; }, 800);

  // Shield absorbs the attack (see Sub-phase 1.7)
  if (shieldActiveRef.current) {
    updateShieldActive(false);
    if (shieldExpiryTimerRef.current) clearTimeout(shieldExpiryTimerRef.current);
    phaserRef.current?.triggerPlayerHurt(); // visual feedback only — no HP loss
    return;
  }

  // Damage = 8% of boss maxHp (per BATTLE_SPEC.md §3)
  const damage = Math.floor(boss.maxHp * 0.08);
  phaserRef.current?.triggerPlayerHurt();

  setPlayerHp(prev => {
    const next = Math.max(0, prev - damage);
    if (next <= 0) {
      setTimeout(() => handleBattleLoss(), 800);
    }
    return next;
  });
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [boss]);
```

#### Task 1.3.3 — Add handleBattleLoss function
Add before `startBattle`:

```typescript
const handleBattleLoss = () => {
  battleActiveRef.current = false;
  if (bossChargeIntervalRef.current) clearInterval(bossChargeIntervalRef.current);
  if (shieldExpiryTimerRef.current) clearTimeout(shieldExpiryTimerRef.current);
  setBoss(prev => prev ? { ...prev, phase: "defeat" } : null);
  submitBossAttempt(false);
};
```

#### Task 1.3.4 — Update handleBattleWin to clean up timers
Find the existing win logic (currently inside `handleAnswer` where boss HP hits 0).
Wrap it or add timer cleanup:

```typescript
const handleBattleWin = () => {
  battleActiveRef.current = false;
  if (bossChargeIntervalRef.current) clearInterval(bossChargeIntervalRef.current);
  if (shieldExpiryTimerRef.current) clearTimeout(shieldExpiryTimerRef.current);
  setBoss(prev => prev ? { ...prev, phase: "victory", currentHp: 0 } : null);
  playSound("level_up");
  submitBossAttempt(true);
};
```

Update the place in `handleAnswer` that currently calls `setBoss(...phase: "victory"...)`
to call `handleBattleWin()` instead.

#### Task 1.3.5 — Add boss charge bar to UI
File: `app/campaign/boss/[bossId]/page.tsx`

Find the boss HP bar section (currently ends with `{boss.currentHp} / {boss.maxHp} HP`).
Directly below it, add:

```tsx
{/* Boss charge bar — only show during combat */}
{boss.phase === "combat" && (
  <div className="w-full mt-1.5">
    <div className="text-xs text-orange-400 font-mono mb-0.5 tracking-wide">
      CHARGING ▶
    </div>
    <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-orange-900/40">
      <div
        className="h-full bg-orange-500 rounded-full transition-none"
        style={{ width: `${bossCharge}%` }}
      />
    </div>
  </div>
)}
```

Note: `transition-none` is intentional. The charge bar should NOT animate between
ticks — animation adds perceived lag to the urgency mechanic.

#### ✅ CHECKPOINT 1.3
**Pass criteria (test in browser):**
- [ ] Orange charge bar appears below boss HP during combat phase
- [ ] Bar fills smoothly over approximately 20 seconds (acid-baron, chargeTime 20)
- [ ] When bar hits 100%: hero hurt animation plays, bar resets to 0 and refills
- [ ] Check React DevTools: `playerHp` decreases each time boss attacks
- [ ] Charge bar does NOT appear during intro, victory, or defeat phases
- [ ] No console errors, no "state update on unmounted component" warnings

---

### SUB-PHASE 1.4 — Player HP and energy bar UI

**Purpose:** Make the player bars visible and reactive.
The player HP bar currently exists in the JSX but always shows 100%.
Fix it to reflect actual `playerHp` state.

#### Task 1.4.1 — Fix the player HP bar
File: `app/campaign/boss/[bossId]/page.tsx`

Find the player HP bar (top right, currently renders a static full green bar).
Replace the static bar with one driven by `playerHp`:

```tsx
{/* Player HP bar — top right */}
<div className="absolute top-4 right-4 z-10" style={{ width: "42%" }}>
  <div className="flex items-center justify-between mb-1">
    <span className="text-white font-bold text-sm">You</span>
    {stats.streak > 1 && (
      <motion.span
        key={stats.streak}
        initial={{ scale: 1.5, color: "#fb923c" }}
        animate={{ scale: 1, color: "#f97316" }}
        className="text-xs font-black"
      >
        🔥 {stats.streak}x
      </motion.span>
    )}
  </div>
  <div className="h-4 bg-black/70 rounded-full overflow-hidden border border-white/15 shadow-inner">
    <motion.div
      className="h-full rounded-full"
      animate={{ width: `${playerHp}%` }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        backgroundColor: playerHp > 60 ? "#22c55e" : playerHp > 30 ? "#f59e0b" : "#ef4444",
        boxShadow: playerHp > 60 ? "0 0 8px #4ade80" : playerHp > 30 ? "0 0 8px #f59e0b" : "0 0 8px #ef4444",
      }}
    />
  </div>
  <div className="text-xs text-white/35 mt-0.5">{playerHp} / 100 HP</div>
</div>
```

#### Task 1.4.2 — Add the player energy bar
Add this directly below the player HP bar:

```tsx
{/* Player energy bar */}
{boss.phase === "combat" && (
  <div className="absolute z-10" style={{ top: "4.5rem", right: "1rem", width: "42%" }}>
    <div className="flex items-center justify-between mb-0.5">
      <span className="text-blue-400 text-xs font-mono">ENERGY</span>
      <span className="text-blue-400 text-xs font-mono">{Math.floor(playerEnergy)}</span>
    </div>
    <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-blue-900/40">
      <div
        className="h-full rounded-full transition-all duration-150"
        style={{
          width: `${playerEnergy}%`,
          backgroundColor: playerEnergy >= 100 ? "#a855f7" : "#3b82f6",
          boxShadow: playerEnergy >= 100 ? "0 0 10px #a855f7" : "none",
        }}
      />
    </div>
  </div>
)}
```

#### ✅ CHECKPOINT 1.4
**Pass criteria:**
- [ ] Player HP bar shows the real HP value and decreases when boss attacks
- [ ] HP bar colour shifts: green > 60%, amber 31–60%, red ≤ 30%
- [ ] Energy bar visible during combat phase, hidden during intro/victory/defeat
- [ ] Energy bar shows 0 at battle start
- [ ] No layout overflow or breakage at 1280×800 desktop browser

---

### SUB-PHASE 1.5 — Wire energy to answers (replace direct damage)

**Purpose:** Answering correctly now fills the energy bar instead of dealing
direct damage. Wrong answers drain energy. This is the core mechanic shift.

#### Task 1.5.1 — Remove direct damage from handleAnswer
File: `app/campaign/boss/[bossId]/page.tsx`

Find `calculateDamage()`. Comment it out (do not delete — needed for reference):
```typescript
// PHASE 1: replaced by energy system — direct damage removed
// const calculateDamage = (isCorrect: boolean, streak: number): number => { ... }
```

In `handleAnswer`, find where `damage` is calculated and boss HP is reduced:
```typescript
const damage = calculateDamage(isCorrect, newStreak); // REMOVE this line
```
And find the boss HP reduction on correct answer. It currently looks like:
```typescript
const newHp = Math.max(0, boss.currentHp - damage);
setBoss(prev => prev ? { ...prev, currentHp: newHp } : null);
```
Remove the HP reduction entirely from the correct answer path.
Boss HP is now ONLY reduced by the Hit button (Sub-phase 1.6).

#### Task 1.5.2 — Add energy gain on correct answer
In `handleAnswer`, in the `if (isCorrect)` branch, replace the removed damage code with:

```typescript
// Energy gain — streak scaled (per BATTLE_SPEC.md §1)
const ENERGY_BY_STREAK: Record<number, number> = { 1: 15, 2: 22, 3: 30, 4: 38 };
const newCurrentStreak = currentStreak + 1;
const energyGain = newCurrentStreak >= 5 ? 45 : (ENERGY_BY_STREAK[newCurrentStreak] ?? 15);

setCurrentStreak(newCurrentStreak);
setWrongStreak(0);
updatePlayerEnergy(playerEnergyRef.current + energyGain);

// Update stats streak (for streak display — unchanged)
setStats(prev => ({
  ...prev,
  streak: newCurrentStreak,
  maxStreak: Math.max(prev.maxStreak, newCurrentStreak),
  questionsAnswered: prev.questionsAnswered + 1,
  correctAnswers: prev.correctAnswers + 1,
}));
```

#### Task 1.5.3 — Add energy drain on wrong answer
In `handleAnswer`, in the `else` (wrong answer) branch, replace existing wrong-answer
logic with:

```typescript
// Energy drain (per BATTLE_SPEC.md §1)
const newWrongStreak = wrongStreak + 1;
setWrongStreak(newWrongStreak);
setCurrentStreak(0);
updatePlayerEnergy(playerEnergyRef.current - 25);

setStats(prev => ({
  ...prev,
  streak: 0,
  questionsAnswered: prev.questionsAnswered + 1,
}));

// 3rd consecutive wrong: boss fires immediately (per BATTLE_SPEC.md §1)
if (newWrongStreak >= 3) {
  setWrongStreak(0);
  handleBossAttack();
}
```

#### Task 1.5.4 — Update triggerAttackAnimation call in handleAnswer
`triggerAttackAnimation` currently takes `(isCorrect, damage)` and passes damage
to Phaser. Since damage is no longer calculated here, update the call:

```typescript
// Change from:
triggerAttackAnimation(isCorrect, damage);
// To (pass 0 for damage — energy animation has no damage number):
triggerAttackAnimation(isCorrect, 0);
```

And in `triggerAttackAnimation`, the Phaser `triggerBossHurt(damage)` call will
now show "0" floating text. Suppress it by only calling when damage > 0:
```typescript
// Inside triggerAttackAnimation, replace:
phaserRef.current?.triggerBossHurt(damage);
// With:
if (damage > 0) phaserRef.current?.triggerBossHurt(damage);
```

This means the boss hurt animation (flash + shake) does NOT play when the player
answers correctly — only when they actually hit. That is correct behaviour.
The screen flash still plays.

#### ✅ CHECKPOINT 1.5
**Pass criteria (verify each value exactly):**
- [ ] First correct answer: energy bar shows 15
- [ ] Two correct in a row: energy shows 37 (15 + 22)
- [ ] Three correct in a row: energy shows 67 (15 + 22 + 30)
- [ ] Four correct in a row: energy shows 105 → clamped to 100
- [ ] Wrong answer: energy drops by 25 (never below 0)
- [ ] Three wrong in a row: boss attack animation triggers immediately
- [ ] Boss HP does NOT change when answering questions (only Hit button damages boss)
- [ ] No console errors

---

### SUB-PHASE 1.6 — Hit button

**Purpose:** Player can now choose when to spend energy and damage the boss.

#### Task 1.6.1 — Add calcHitDamage helper function
Add before `handleHit` (which doesn't exist yet):

```typescript
// Per BATTLE_SPEC.md §2 — damage scales with energy at time of hit
const calcHitDamage = (energy: number): number => {
  if (energy >= 100) return Math.floor(energy * 2.5);
  if (energy >= 70)  return Math.floor(energy * 2.0);
  if (energy >= 40)  return Math.floor(energy * 1.5);
  return Math.floor(energy * 1.0);
};
```

#### Task 1.6.2 — Add handleHit function
Add before `startBattle`:

```typescript
const handleHit = () => {
  if (playerEnergyRef.current < 1 || !battleActiveRef.current) return;
  if (boss?.phase !== "combat") return;

  const damage = calcHitDamage(playerEnergyRef.current);
  updatePlayerEnergy(0);

  phaserRef.current?.triggerPlayerAttack();
  setTimeout(() => {
    phaserRef.current?.triggerBossHurt(damage);
  }, 300);

  setStats(prev => ({ ...prev, damageDealt: prev.damageDealt + damage }));

  setBoss(prev => {
    if (!prev) return null;
    const newHp = Math.max(0, prev.currentHp - damage);
    if (newHp <= 0) {
      setTimeout(() => handleBattleWin(), 1200); // delay for death animation (P6)
    }
    return { ...prev, currentHp: newHp };
  });
};
```

#### Task 1.6.3 — Add Hit button to combat UI
In the combat phase JSX, find the power-up bar row (currently just the Hint button).
Add the Hit button ABOVE the power-up bar (it is a primary action, not a power-up):

```tsx
{/* Primary combat buttons — above power-ups */}
<div className="flex gap-2 mt-2">
  <button
    onClick={handleHit}
    disabled={playerEnergy < 1 || boss.phase !== "combat"}
    className={`flex-1 py-2.5 rounded-lg font-mono font-bold text-sm transition-all border
      ${playerEnergy >= 70
        ? "bg-purple-600/80 border-purple-500 text-white shadow-lg shadow-purple-900/50"
        : playerEnergy >= 40
        ? "bg-blue-700/80 border-blue-500 text-white"
        : playerEnergy >= 1
        ? "bg-blue-900/60 border-blue-800 text-blue-300"
        : "bg-gray-900/60 border-gray-800 text-gray-600 cursor-not-allowed"
      }`}
  >
    HIT
    {playerEnergy >= 1
      ? ` · ${calcHitDamage(Math.floor(playerEnergy))} dmg`
      : " · (need energy)"}
  </button>
</div>
```

#### ✅ CHECKPOINT 1.6
**Pass criteria:**
- [ ] HIT button visible in combat phase
- [ ] HIT button shows correct damage preview at each energy tier:
  - 30 energy → "HIT · 30 dmg"
  - 60 energy → "HIT · 90 dmg"
  - 80 energy → "HIT · 160 dmg"
  - 100 energy → "HIT · 250 dmg"
- [ ] Clicking HIT: player attack animation plays, then boss hurt animation + number
- [ ] Energy resets to 0 after hit
- [ ] Boss HP decreases by the correct amount
- [ ] Boss HP reaching 0: wait ~1.2s, then victory screen
- [ ] HIT button is dim and disabled at 0 energy

---

### SUB-PHASE 1.7 — Block button

**Purpose:** Player can sacrifice 40 energy to absorb the next boss attack.
This completes the core triangle: build energy → hit → or block.

#### Task 1.7.1 — Add handleBlock function
Add before `startBattle`:

```typescript
const handleBlock = () => {
  if (playerEnergyRef.current < 40) return;
  if (shieldCooldown || shieldActiveRef.current) return;
  if (boss?.phase !== "combat") return;

  updatePlayerEnergy(playerEnergyRef.current - 40);
  updateShieldActive(true);

  // Shield expires after 8s if boss doesn't attack (per BATTLE_SPEC.md §4)
  shieldExpiryTimerRef.current = setTimeout(() => {
    updateShieldActive(false);
    setShieldCooldown(true);
    setTimeout(() => setShieldCooldown(false), 5000); // 5s cooldown
  }, 8000);
};
```

#### Task 1.7.2 — Add Block button to combat UI
Add to the primary combat buttons row (next to HIT):

```tsx
<button
  onClick={handleBlock}
  disabled={playerEnergy < 40 || shieldCooldown || shieldActive || boss.phase !== "combat"}
  className={`flex-1 py-2.5 rounded-lg font-mono font-bold text-sm transition-all border
    ${shieldActive
      ? "bg-cyan-500/30 border-cyan-400 text-cyan-300 animate-pulse"
      : shieldCooldown
      ? "bg-gray-900/60 border-gray-800 text-gray-600 cursor-not-allowed"
      : playerEnergy >= 40
      ? "bg-cyan-800/80 border-cyan-600 text-cyan-300 hover:bg-cyan-700/80"
      : "bg-gray-900/60 border-gray-800 text-gray-600 cursor-not-allowed"
    }`}
>
  {shieldActive ? "SHIELDED" : shieldCooldown ? "COOLDOWN" : "BLOCK · 40"}
</button>
```

#### Task 1.7.3 — Add timer cleanup for shield in the main cleanup
The `handleBattleWin` and `handleBattleLoss` functions already clear
`shieldExpiryTimerRef` (added in Task 1.3.3 and Task 1.3.4). Verify this is the case.
If not, add `if (shieldExpiryTimerRef.current) clearTimeout(shieldExpiryTimerRef.current);`
to both.

#### ✅ CHECKPOINT 1.7
**Pass criteria:**
- [ ] BLOCK button visible, disabled when energy < 40
- [ ] BLOCK button enabled at ≥ 40 energy
- [ ] Pressing BLOCK: deducts 40 energy, button shows "SHIELDED" and pulses
- [ ] While shielded: boss attack plays hurt animation but player HP does NOT drop
- [ ] Shield expires after 8s: button shows "COOLDOWN"
- [ ] After 5s cooldown: BLOCK button is usable again
- [ ] If shielded AND boss attacks: shield is consumed, no HP loss, no cooldown delay
      (cooldown only triggers when shield expires unused)

---

### SUB-PHASE 1.8 — Validate full battle flow end-to-end

**Purpose:** Confirm the whole loop works together before declaring Phase 1 done.
No new features — just testing and fixing integration issues.

#### Task 1.8.1 — Verify defeat condition changed
The old defeat condition was "run out of questions". The new one is "player HP = 0".
Verify in `nextQuestion()`:
- If questions run out but player HP > 0: the player should NOT get a defeat screen.
  Instead: show the existing defeat screen (we'll add more questions in Phase 3,
  for now just confirm the HP-based condition is the primary loss state).
- The `nextQuestion` function may still have `setBoss(prev => { ...phase: "defeat" })`
  for running out of questions — leave this for now. It's an edge case.
  The primary loss path (player HP = 0 → `handleBattleLoss`) is what matters.

#### Task 1.8.2 — Verify all timers clean up correctly
Open browser DevTools → Performance tab.
Start a battle, let it run for 10 seconds, then click "Exit" to leave the battle.
Navigate back to the campaign map.
Navigate BACK to the boss battle.
Confirm: the charge bar starts fresh (not mid-fill), no errors in console.

#### ✅ CHECKPOINT 1.8
**Pass criteria:**
- [ ] Player HP = 0 triggers defeat screen (boss attack path works)
- [ ] Boss HP = 0 triggers victory screen (hit button path works)
- [ ] Leaving and re-entering the battle starts fresh with no leftover timer state
- [ ] Stats row shows correct accuracy and damage dealt
- [ ] Rewards show on victory screen (XP and coins from `submitBossAttempt`)

---

### SUB-PHASE 1.9 — Art pipeline decision

**Purpose:** Lock the art approach for Phase 2 before Phase 2 begins.
This sub-phase produces a decision document only. No code changes.

#### Task 1.9.1 — Evaluate Rive
Run in terminal (dry run only — do not actually install yet):
```bash
npm install @rive-app/react-canvas --dry-run
```
Note: any version conflicts with the existing Next.js / React version.

#### Task 1.9.2 — Create ART_PIPELINE.md
Create file `roadmap/ART_PIPELINE.md` with this content filled in:

```markdown
# Art Pipeline Decision

Date: [DATE]

## Chosen approach: [ RIVE | LUDO_AI_SPRITESHEETS ]

---

### If RIVE chosen:
- Package: @rive-app/react-canvas (no conflicts found in dry run)
- Workflow:
  1. Design character in Leonardo.ai
  2. Rig + animate in Rive editor (rive.app) — free tier sufficient
  3. Export .riv file, place in /public/animations/
  4. In Phase 2: replace PhaserBattleScene character sprites with
     Rive component; keep Phaser for particles and screen effects only
- Minimum animations needed per character: idle, attack, hurt
- Boss design: one design per boss, each gets its own .riv file

### If LUDO_AI_SPRITESHEETS chosen:
- Tool: Ludo.ai (ludo.ai) — upload character reference, generate sprite frames
- Minimum frames per animation state: 10 (up from current 4)
- Transparency fix: run all sheets through remove.bg before use
- In Phase 2: regenerate hero sheet and all boss sheets at higher frame count
- FRAME_W and FRAME_H in PhaserBattleScene.tsx must be updated to match new sheets

## Decision rationale:
[Write a 2-3 sentence reason for the choice]

## Known constraints:
[Any budget, time, or technical constraints that influenced the decision]
```

#### ✅ CHECKPOINT 1.9
**Pass criteria:**
- [ ] `roadmap/ART_PIPELINE.md` exists
- [ ] Decision is filled in — either RIVE or LUDO_AI_SPRITESHEETS, not blank
- [ ] Rationale section is not empty

---

## PHASE 1 FINAL CHECKPOINT

**This is the gate before Phase 2 begins.**
**Must be tested manually in a browser by a human — not code review alone.**

### Full playthrough test script:
1. Open app, navigate to any boss battle
2. Click "Begin Battle"
3. **Energy test:** Answer 3 questions correctly → verify energy = 67
4. **Hit test:** Click HIT → verify attack animation, boss HP drops, energy = 0
5. **Streak test:** Answer 5 in a row correctly → energy should reach 100 and glow purple
6. **Wrong answer test:** Answer 3 wrong in a row → 3rd wrong triggers boss attack immediately
7. **Block test:** Build 40+ energy → click BLOCK → button shows "SHIELDED"
8. **Shield absorption:** While shielded, wait for boss charge bar to fill →
   confirm boss attacks but player HP does NOT drop
9. **Unblocked attack:** Let charge bar fill without blocking → confirm HP drops
10. **Win test:** Hit the boss repeatedly until HP = 0 → confirm 1.2s delay then victory screen
11. **Loss test:** (You may need to reduce boss HP in bosses.json for testing)
    Let boss attack repeatedly until player HP = 0 → confirm defeat screen
12. **Timer cleanup:** Click Exit → go back to campaign → enter boss battle again →
    confirm charge bar starts fresh

### Final pass criteria (ALL must be true):
- [ ] Full playthrough completed with zero browser console errors
- [ ] All energy values match BATTLE_SPEC.md exactly (verified against spec, not estimated)
- [ ] No React warnings about state updates on unmounted components
- [ ] PROGRESS TRACKER at top of this file has been updated
- [ ] `roadmap/ART_PIPELINE.md` exists with a decision recorded
- [ ] `data/bosses.json` has `chargeTime` on all 8 bosses

---

## WHAT PHASE 2 RECEIVES

When Phase 1 is complete and the final checkpoint passes, Phase 2 starts with:
- Energy battle system fully working per BATTLE_SPEC.md
- Boss charge timer, Hit button, Block button, player HP all functional
- Three deprecated mechanics removed (boss shield phases, per-question timer, player shield power-up)
- Placeholder sprites in use (checkerboard present — Phase 2 fixes this)
- `roadmap/ART_PIPELINE.md` decision locked
- Phase 2 is entirely about art — zero new game mechanics

---

*Next phase: PHASE_02.md — Art Sprint*
*Spec reference: BATTLE_SPEC.md*
*Vision reference: VISION.md*
