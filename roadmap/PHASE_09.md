# Phase 9 — Polish & Onboarding
## "Making It Feel Like a Real Product"

> When Phase 9 is complete, the game is coherent end-to-end:
> sounds respect mute state, the hub guides new users to Campaign, first-time players
> get a tutorial, "Try Again" resets cleanly, and error boundaries prevent white screens.

---

## CONTEXT WINDOW SURVIVAL PROTOCOL

If you run out of context mid-phase, the next session must:
1. Read `roadmap/PHASE_09.md` (this file) in full
2. Check the PROGRESS TRACKER table below
3. Read the files listed under each incomplete sub-phase before touching them
4. Never re-read files that are already marked ✅ in the tracker

---

## PROGRESS TRACKER

| Sub-phase | Title                        | Status | Key files touched |
|-----------|------------------------------|--------|-------------------|
| 9.1       | Fix sound system             | ⬜     | app/campaign/boss/[bossId]/page.tsx, lib/sounds.ts |
| 9.2       | Fix hub nav cards + CTA      | ⬜     | app/hub/page.tsx |
| 9.3       | BattleTutorialModal          | ⬜     | app/campaign/boss/_components/BattleTutorialModal.tsx (new) |
| 9.4       | handleRestartBattle          | ⬜     | app/campaign/boss/[bossId]/page.tsx |
| 9.5       | BattleErrorBoundary          | ⬜     | app/campaign/boss/_components/BattleErrorBoundary.tsx (new) |
| 9.6       | Minor polish                 | ⬜     | app/campaign/page.tsx, app/hub/page.tsx |
| 9.7       | Checkpoint & smoke test      | ⬜     | — |

---

## CURRENT STATE (verified by code reads in prior sessions)

### Sound system
- `lib/sounds.ts` — complete `SoundManager` class
  - All 6 MP3s exist in `public/sounds/`: `correct.mp3`, `wrong.mp3`, `coin.mp3`,
    `boss_hit.mp3`, `powerup.mp3`, `level_up.mp3`
  - Exports: `playSound(sound, volume?)`, `toggleMute()`, `setMuted(muted)`, `isMuted()`
  - Uses `localStorage` key `chemquest_muted` for persistence
- `app/campaign/boss/[bossId]/page.tsx` — defines its **own local `playSound`** function
  (~line 71) that directly calls `new Audio(path).play()` — no mute support, bypasses
  `lib/sounds.ts` entirely.
  The local function signature: `const playSound = (type: string) => { ... }`

### Hub page
- `app/hub/page.tsx` — has `NAV_CARDS` array:
  - Campaign → `/campaign` (works)
  - Battle → `/battle` (`disabled: false` → 404 on click)
  - Training → `/training` (`disabled: false` → 404 on click)
  - Lab Store → `/shop` (`disabled: false` → 404 on click)
- Has its own inline RANKS array (Phase 6 consolidation removed this — verify after Phase 6)
- Calls `/api/auth/me` without auth header (Phase 6 task 6.6 fixes this — verify)
- Shows a "Play Campaign" card/link somewhere but it is not the primary CTA

### Boss battle restart
- "Try Again" button calls `window.location.reload()` — causes white flash,
  re-fetches all data, resets Phaser scene destructively

### Error handling
- No React error boundary around the boss battle page — a render error will
  produce a blank white screen with no recovery path

---

## GUARDRAILS

1. **Do not touch the Phaser scene internals** in this phase — that is Phase 8 territory.
   Only touch `page.tsx` for the sound fix and restart fix.
2. **Do not rebuild the hub page** — only change `disabled` flags and add a CTA.
   The hub layout is intentionally minimal until Phase 10.
3. **Do not add analytics or tracking** — Phase 10 only.
4. **BattleTutorialModal must not block rendering** — if localStorage read throws
   (SSR context), default to `false` (don't show tutorial). Always guard with
   `typeof window !== 'undefined'`.
5. **BattleErrorBoundary must be a class component** — React error boundaries cannot
   be function components.
6. **Sound fix must be surgical** — only remove the local `playSound` definition and
   replace call sites. Do not refactor the rest of the page.

---

## SUB-PHASE 9.1 — Fix Sound System

**Goal**: Boss battle sounds respect the global mute toggle.

### Pre-read checklist
Before editing, re-read:
- `app/campaign/boss/[bossId]/page.tsx` lines 60–90 (local playSound function)
- Grep the file for all `playSound(` call sites to count them

### Task 9.1.1 — Remove local playSound, import from lib/sounds.ts

In `app/campaign/boss/[bossId]/page.tsx`:

1. Find and **delete** the local `playSound` function block (~line 71):
   ```ts
   // DELETE THIS ENTIRE BLOCK:
   const playSound = (type: string) => {
     const soundMap: Record<string, string> = { ... };
     ...
     new Audio(path).play().catch(() => {});
   };
   ```

2. Add to the import section at the top of the file:
   ```ts
   import { playSound, toggleMute, isMuted } from "@/lib/sounds";
   ```

3. The `playSound` call sites use string literals like `playSound("correct")`,
   `playSound("wrong")`, `playSound("boss_hit")`, `playSound("powerup")`,
   `playSound("coin")`, `playSound("level_up")`.
   **The `lib/sounds.ts` type is** `'correct' | 'wrong' | 'coin' | 'boss_hit' | 'powerup' | 'level_up'`
   — verify each call site matches one of these literal strings exactly.
   If the local function used different names (e.g. `"hit"` instead of `"boss_hit"`),
   update the call site to match the `lib/sounds.ts` type.

### Task 9.1.2 — Add mute toggle button to boss battle UI

In the boss battle page, find the top-right controls area (near the timer or HP display).
Add a mute toggle button:

```tsx
// Add near top of component:
const [muted, setMuted] = useState(() =>
  typeof window !== "undefined" ? isMuted() : false
);

const handleToggleMute = () => {
  toggleMute();
  setMuted(isMuted());
};
```

Button JSX (place in the game controls bar, top-right):
```tsx
<button
  onClick={handleToggleMute}
  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
  title={muted ? "Unmute" : "Mute"}
>
  {muted ? (
    <VolumeX className="w-5 h-5" />
  ) : (
    <Volume2 className="w-5 h-5" />
  )}
</button>
```

Add to lucide-react imports: `Volume2`, `VolumeX`

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| Local playSound uses different sound name strings than lib/sounds.ts type | Grep for all `playSound(` calls in the file and cross-check against `'correct' \| 'wrong' \| 'coin' \| 'boss_hit' \| 'powerup' \| 'level_up'` |
| TypeScript error: argument of type `string` not assignable to union type | Cast as `as Parameters<typeof playSound>[0]` or fix the string literals |
| lib/sounds.ts uses browser-only `Audio` — SSR will fail | lib/sounds.ts already guards with `typeof window !== 'undefined'` in the class constructor — this is fine |

---

## SUB-PHASE 9.2 — Fix Hub Nav Cards + CTA

**Goal**: Battle/Training/Shop cards show "Coming Soon" and are non-clickable.
A prominent "Play Campaign" CTA is the primary action.

### Pre-read checklist
Before editing, re-read:
- `app/hub/page.tsx` in full — focus on `NAV_CARDS` array structure and the
  rendered card JSX (how `disabled` is currently handled)

### Task 9.2.1 — Disable dead nav cards

In `app/hub/page.tsx`, find the `NAV_CARDS` (or equivalent) array and update:

```ts
// Change disabled to true for non-existent routes:
{ title: "Battle", href: "/battle", disabled: true, comingSoon: true, ... },
{ title: "Training", href: "/training", disabled: true, comingSoon: true, ... },
{ title: "Lab Store", href: "/shop", disabled: true, comingSoon: true, ... },
```

If the card component doesn't have a `comingSoon` prop, add a `badge?: string` field
and pass `badge: "Soon"` — then render it as a small pill in the card UI.

### Task 9.2.2 — Render disabled cards as non-clickable

In the card rendering JSX, ensure disabled cards:
- Use a `div` instead of `Link` (or `pointer-events-none` on the Link)
- Show reduced opacity: `opacity-50` class
- Show "Coming Soon" badge: small `<span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Soon</span>`
- Do NOT navigate on click

Pattern:
```tsx
{card.disabled ? (
  <div className="... opacity-50 cursor-not-allowed">
    {/* card content */}
    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
      Soon
    </span>
  </div>
) : (
  <Link href={card.href}>
    {/* card content */}
  </Link>
)}
```

### Task 9.2.3 — Add primary "Play Campaign" CTA

Find the main hub content area. Add a prominent CTA above the nav cards:

```tsx
<Link
  href="/campaign"
  className="block w-full max-w-sm mx-auto mb-8 py-4 px-6 rounded-2xl
    bg-gradient-to-r from-indigo-500 to-purple-600
    hover:from-indigo-600 hover:to-purple-700
    text-white text-xl font-bold text-center shadow-lg
    transition-all hover:scale-105 active:scale-95"
>
  Play Campaign
</Link>
```

If a campaign CTA already exists and is adequately prominent, skip this task and
note it in the tracker.

### Task 9.2.4 — Verify auth header fix (from Phase 6)

Check if Phase 6 task 6.6 was completed: the `/api/auth/me` call in hub should
now use `authFetch`. If it still uses bare `fetch`, apply the same fix as Phase 6.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| NAV_CARDS is typed as a readonly const with no `comingSoon` field | Add `comingSoon?: boolean` to the type or use `badge?: string` |
| Disabled card still navigates on click if using `<Link>` | Wrap in conditional: render `<div>` for disabled, `<Link>` for enabled |
| Hub page already has a "Play Campaign" link — duplication | If one exists, just make it more prominent (increase size/color) rather than adding a second |

---

## SUB-PHASE 9.3 — BattleTutorialModal

**Goal**: First-time players see a 3-step tutorial modal before the battle starts.
Tutorial is dismissed via localStorage and never shown again.

### Pre-read checklist
Before creating, re-read:
- `app/campaign/boss/[bossId]/page.tsx` — find where the game phase transitions
  from "loading" to "battle" to know where to inject the tutorial check
- `app/campaign/boss/_components/` — list existing components to avoid naming collision

### Task 9.3.1 — Create BattleTutorialModal component

Create `app/campaign/boss/_components/BattleTutorialModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Zap, Shield, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Swords,
    title: "Answer to Attack",
    description:
      "Each correct answer deals damage to the boss. The faster you answer, the more damage you deal.",
    color: "text-red-400",
  },
  {
    icon: Zap,
    title: "Build Your Streak",
    description:
      "Consecutive correct answers build a streak — streak multiplies your damage and earns bonus XP.",
    color: "text-yellow-400",
  },
  {
    icon: Shield,
    title: "Wrong Answers Hurt",
    description:
      "Wrong answers break your streak and let the boss recharge its attack. Stay focused!",
    color: "text-blue-400",
  },
];

const STORAGE_KEY = "chemquest_battle_tutorial_seen";

export function useBattleTutorial() {
  const seen =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY) === "true"
      : true; // SSR: default to seen (no modal)
  const [showTutorial, setShowTutorial] = useState(!seen);

  const dismissTutorial = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setShowTutorial(false);
  };

  return { showTutorial, dismissTutorial };
}

interface BattleTutorialModalProps {
  onDismiss: () => void;
}

export function BattleTutorialModal({ onDismiss }: BattleTutorialModalProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full text-center space-y-6"
        >
          {/* Step indicator */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-8 bg-indigo-500" : "w-3 bg-gray-600"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`flex justify-center ${current.color}`}>
            <Icon className="w-16 h-16" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">{current.title}</h2>
            <p className="text-gray-400 leading-relaxed">{current.description}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 text-gray-500 hover:text-gray-300"
              onClick={onDismiss}
            >
              Skip
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => (isLast ? onDismiss() : setStep(step + 1))}
            >
              {isLast ? (
                "Let's go!"
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### Task 9.3.2 — Wire tutorial into boss battle page

In `app/campaign/boss/[bossId]/page.tsx`:

1. Import:
   ```ts
   import { BattleTutorialModal, useBattleTutorial } from "../_components/BattleTutorialModal";
   ```

2. Inside the component, destructure the hook:
   ```ts
   const { showTutorial, dismissTutorial } = useBattleTutorial();
   ```

3. Render the modal at the root of the returned JSX (before the main game UI):
   ```tsx
   {showTutorial && <BattleTutorialModal onDismiss={dismissTutorial} />}
   ```

4. The tutorial overlays the entire screen — the battle starts in its normal
   loading state underneath. When dismissed, battle proceeds normally.
   No game state changes are needed — the tutorial is purely cosmetic.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| `useState(!seen)` reads localStorage on every render during SSR — ReferenceError | Guard: `typeof window !== "undefined" ? localStorage.getItem(...) : true` (already in code above) |
| Tutorial shows on every visit despite localStorage — hydration mismatch | The `useState` initializer runs once on mount client-side; the SSR default is `true` (hidden) — hydration diff is harmless for a modal |
| `useBattleTutorial` is defined in the same file as the component | This is fine — it's a simple hook with no async. Keep it colocated |

---

## SUB-PHASE 9.4 — handleRestartBattle

**Goal**: "Try Again" resets game state cleanly without `window.location.reload()`.

### Pre-read checklist
Before editing, re-read:
- `app/campaign/boss/[bossId]/page.tsx` lines 1–100 (all state declarations)
  and the section containing the "Try Again" button and `window.location.reload()`
- Note every `useState` and `useRef` that represents in-battle state

### Task 9.4.1 — Identify all stateful fields to reset

Before writing any code, list all state vars that need resetting. From the prior read,
the expected fields are (verify against actual code):

**useState values to reset:**
- `gamePhase` → `"loading"` (or `"question"` if we want to skip loading)
- `bossCurrentHp` → `boss.baseHp` (or the calculated HP from difficulty)
- `currentQuestion` → `null`
- `streak` → `0`
- `correctAnswers` → `0`
- `questionsAnswered` → `0`
- `feedback` → `null`
- `showVictory` → `false`
- `showDefeat` → `false`
- `showRankUp` → `false`
- `rankUpData` → `null`
- `rewards` → `null`

**useRef values to reset:**
- `damageDealtRef` → `0` (tracks total damage without re-renders)
- `streakRef` → `0` (if separate from useState streak)
- Any other refs used for battle tracking

### Task 9.4.2 — Write handleRestartBattle

```ts
const handleRestartBattle = useCallback(() => {
  // Reset all battle state
  setGamePhase("question"); // skip loading — boss data already in memory
  setBossCurrentHp(boss?.baseHp ?? 1000);
  setCurrentQuestion(null);
  setStreak(0);
  setCorrectAnswers(0);
  setQuestionsAnswered(0);
  setFeedback(null);
  setShowVictory(false);
  setShowDefeat(false);
  setShowRankUp(false);
  setRankUpData(null);
  setRewards(null);

  // Reset refs
  if (damageDealtRef) damageDealtRef.current = 0;
  if (streakRef) streakRef.current = 0;
}, [boss]);
```

Add `useCallback` to imports if not already present.

### Task 9.4.3 — Replace window.location.reload()

Find the "Try Again" button (in the defeat screen section) and replace:

```tsx
// BEFORE:
onClick={() => window.location.reload()}

// AFTER:
onClick={handleRestartBattle}
```

Also find any other `window.location.reload()` calls in the file and assess
whether they should also use `handleRestartBattle`.

**Note on question loading**: After `handleRestartBattle`, the component needs
a new question. Check if `currentQuestion === null` already triggers fetching
the next question (it likely does via a `useEffect` that calls `getNextQuestion`
when `currentQuestion` is null and `gamePhase === "question"`). If not, call
`getNextQuestion()` directly at the end of `handleRestartBattle`.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| Boss HP reset uses `boss?.baseHp` but boss data varies by difficulty — reset may use wrong HP | Store the initial HP in a ref (`initialHpRef`) during mount, use `initialHpRef.current` for reset |
| Question pool is exhausted after first run — questions repeat or run out | Most question pools shuffle — the `getNextQuestion` logic should handle this; if not, reset the question index/shuffle |
| Phaser scene is still in "victory" or "defeat" visual state | Phaser scene needs explicit reset — call a `resetScene()` function via the ref pattern from Phase 1. If Phaser ref not exposed, this is a known limitation; document it |
| `useCallback` dependency on `boss` causes stale closure | Include `boss` in deps array |

---

## SUB-PHASE 9.5 — BattleErrorBoundary

**Goal**: Catch unexpected React render errors in the battle, show a recovery UI
with "Return to Campaign" instead of a blank white screen.

### Pre-read checklist
Before creating, re-read:
- `app/campaign/boss/[bossId]/page.tsx` — just the export line and wrapper to know
  where to insert the boundary
- `app/campaign/boss/layout.tsx` if it exists — an error boundary there would cover
  the whole boss subdirectory

### Task 9.5.1 — Create BattleErrorBoundary

Create `app/campaign/boss/_components/BattleErrorBoundary.tsx`:

```tsx
"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class BattleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would report to Sentry/similar
    console.error("[BattleErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-sm">
            <div className="text-6xl">⚗️</div>
            <h1 className="text-2xl font-bold text-white">
              Something went wrong
            </h1>
            <p className="text-gray-400">
              The battle encountered an unexpected error. Your progress has been saved.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-red-400 font-mono bg-gray-900 p-3 rounded-lg text-left">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, errorMessage: "" })}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/campaign"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Return to Campaign
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Task 9.5.2 — Wrap boss battle page with the boundary

**Option A** (preferred): Create `app/campaign/boss/[bossId]/layout.tsx` if it
doesn't exist, and wrap children:

```tsx
import { BattleErrorBoundary } from "../_components/BattleErrorBoundary";

export default function BossLayout({ children }: { children: React.ReactNode }) {
  return <BattleErrorBoundary>{children}</BattleErrorBoundary>;
}
```

**Option B**: If a layout already exists, add `BattleErrorBoundary` to it.

**Option C** (fallback): Wrap the export in `page.tsx` directly:
```tsx
// At bottom of page.tsx:
export default function WrappedBossPage(props: PageProps) {
  return (
    <BattleErrorBoundary>
      <BossPage {...props} />
    </BattleErrorBoundary>
  );
}
```

Use Option A to keep `page.tsx` clean.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| Error boundary doesn't catch async errors (fetch failures, promise rejections) | This is expected — error boundaries only catch render errors. Async errors should be handled with try/catch in the existing fetch logic |
| "Try Again" button resets hasError but the component re-renders into the same error | This is acceptable for dev use; in production users should use "Return to Campaign" |
| `layout.tsx` for `[bossId]` conflicts with the existing layout structure | Check if `app/campaign/boss/layout.tsx` (parent) already exists before creating a child layout |

---

## SUB-PHASE 9.6 — Minor Polish

**Goal**: Small UI improvements that increase the "finished product" feel.

### Task 9.6.1 — Pulse the first chamber node on campaign map

In `app/campaign/page.tsx`, find the first chamber node for the first available
module. Add a CSS pulse animation if the user has 0 XP or has never started
(i.e., `campaignXp === 0`).

Wrap the first chamber node with:
```tsx
{isFirstChamber && campaignXp === 0 && (
  <span className="absolute -inset-1 rounded-full animate-ping bg-indigo-400 opacity-30 pointer-events-none" />
)}
```

Only pulse the first incomplete chamber of the first available module — not all nodes.

### Task 9.6.2 — Loading skeleton on leaderboard

In `app/leaderboard/page.tsx` (if it exists and has a loading state):
Add a skeleton UI for when the leaderboard data is loading. Use the existing
Tailwind `animate-pulse` pattern:

```tsx
{isLoading && (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
    ))}
  </div>
)}
```

If the leaderboard page doesn't exist yet (Phase 5 may not be complete), skip
this task and note it.

### Task 9.6.3 — Fix "Back to Hub" links

Grep for all instances of `href="/hub"` and `href="/"` in the campaign and boss
pages. Verify they point to the correct destination:
- From boss battle page: "Back" should go to `/campaign` (not `/hub`)
- From campaign page: "Back" or the logo should go to `/hub`
- From hub page: no "back" needed — it is the root

Fix any incorrectly pointed links.

### Task 9.6.4 — Boss CTA coach mark (optional, skip if complex)

On the campaign map, if the user has completed all chambers in a module but
hasn't fought the boss yet, show a small pulsing badge or arrow pointing at
the boss node.

This is **optional** — only implement if it can be done in under 15 lines of JSX.
If it requires significant state changes, defer to Phase 10.

### Predicted problems

| Problem | Mitigation |
|---------|-----------|
| `campaignXp === 0` condition also triggers for users who have XP but somehow lost it | Use `gamesPlayed === 0` instead — more reliable "never played" signal |
| Leaderboard page doesn't exist | Skip task 9.6.2, note in tracker |
| "Back" links are inside server components — can't use client-side router | Use `<Link href="...">` which works in server components |

---

## SUB-PHASE 9.7 — Checkpoint & Smoke Test

### Smoke test checklist

Run `npm run dev` and verify manually:

**Sound system:**
- [ ] Open boss battle, answer correctly — `correct.mp3` plays
- [ ] Answer wrong — `wrong.mp3` plays
- [ ] Boss is hit — `boss_hit.mp3` plays
- [ ] Click mute button — icon changes to muted
- [ ] With mute on, answer correctly — NO sound plays
- [ ] Refresh page — mute state persists (localStorage)
- [ ] Re-unmute — sounds work again

**Hub page:**
- [ ] Battle/Training/Lab Store cards are visually disabled with "Soon" badge
- [ ] Clicking a disabled card does NOT navigate
- [ ] Campaign card still works
- [ ] "Play Campaign" CTA is visible and links to `/campaign`

**Tutorial modal:**
- [ ] Clear `localStorage.removeItem("chemquest_battle_tutorial_seen")` in devtools
- [ ] Open boss battle — tutorial modal appears
- [ ] Step through all 3 steps with "Next"
- [ ] "Let's go!" dismisses and battle loads
- [ ] Refresh page — tutorial does NOT appear again
- [ ] Test "Skip" button — also dismisses and sets localStorage

**Restart:**
- [ ] Complete a boss fight (win or lose)
- [ ] Click "Try Again" — game resets without page reload, no white flash
- [ ] HP bar resets to full
- [ ] Streak resets to 0
- [ ] New questions appear

**Error boundary:**
- [ ] Temporarily throw in a render function to test the boundary catches it
- [ ] Verify recovery UI shows "Return to Campaign" and "Try Again"
- [ ] Remove the test throw

**Minor polish:**
- [ ] Campaign map — first chamber pulses for new users
- [ ] Leaderboard has skeleton loading state (if implemented)
- [ ] "Back" links point to correct destinations

### TypeScript build check

```bash
npx tsc --noEmit
```

Fix any type errors introduced by this phase before moving to Phase 10.

---

## PHASE 9 COMPLETION CRITERIA

Phase 9 is complete when:
1. Sounds in the boss battle respect the global mute state
2. Hub page has no broken links — all disabled cards show "Soon" badge
3. First-time players see the tutorial modal (subsequent visits skip it)
4. "Try Again" resets battle state without `window.location.reload()`
5. An error boundary prevents white-screen crashes in the boss battle route
6. TypeScript build passes with no new errors
7. All smoke test items are checked off

---

## SESSION-END INSTRUCTIONS

If you must stop before Phase 9 is fully complete:

1. Update the PROGRESS TRACKER table at the top of this file — mark completed
   sub-phases ✅ and in-progress ones 🔄
2. Add a "STOPPED AT" note below the tracker specifying the exact task number
   (e.g., "STOPPED AT: Task 9.4.2 — wrote handleRestartBattle, not yet wired")
3. Do NOT commit partial changes — stage only complete sub-phases
4. The next session should read this file first, then read only the files
   listed for the remaining sub-phases

---

## NEXT PHASE

After Phase 9 is verified complete, proceed to **Phase 10: Production Launch**.

Phase 10 covers:
- Vercel deployment configuration
- Production Supabase environment variables
- Pro paywall reinstatement (removing the `free: true` TODO markers from Phase 7)
- Rate limiting on public API routes
- Error monitoring setup (Sentry or similar)
- Performance audit (Lighthouse mobile score target: 70+)
- Final ASSESSMENT_02.md review of Phases 6–10
