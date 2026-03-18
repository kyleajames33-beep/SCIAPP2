# Phase 2 — Art Sprint
## Goal: The Game Looks Like a Game

> When Phase 2 is complete, the battle scene has proper character animations,
> at least one boss with polished art, a basic themed arena background, and
> the checkerboard sprite issue is gone.
> Zero new game mechanics. This phase is entirely visual.

---

## ⚠️ ART APPROACH — READ BEFORE STARTING

**Chosen approach: Framer Motion + 3 PNGs per character**

- Rive was evaluated and discarded (rigging complexity produced poor results)
- Sprite sheets were discarded (AI tools produce inconsistent frames)
- Chosen approach: one high-quality PNG per state (idle/attack/hurt), swap src on
  state change, Framer Motion drives the character movement (lunge, shake, float)
- Phaser canvas stays but is narrowed to: particles, damage numbers, screen flash only
- Framer Motion is already installed — no new packages needed

This decision is locked. Do not re-litigate it.

---

## ⚠️ GUARDRAILS — READ BEFORE TOUCHING ANYTHING

1. **No new game mechanics in this phase.** If you find yourself writing game
   logic, stop. That belongs in a later phase.

2. **Do not change `BATTLE_SPEC.md`.** It is read-only forever.

3. **Do not change game logic in `page.tsx`** — only the arena JSX section,
   the two new character state variables, and the existing trigger call sites.
   If a task requires touching `handleAnswer`, `handleHit`, `handleBossAttack`,
   or any other game logic function body — stop, it is out of scope.

4. **One sub-phase at a time.** Each checkpoint is a hard gate.

5. **Art quality is subjective. Ship criteria are objective.**
   "Looks good" is not a checkpoint criterion. Specific observable outcomes are.

6. **The battle must remain playable at all times.**
   Never leave the app in a state where the boss battle throws an error.
   Keep the placeholder PNGs as fallbacks until real art is verified working.

---

## ⚠️ CONTEXT WINDOW SURVIVAL PROTOCOL

### Mandatory reading order for any new session:
1. Read `roadmap/PHASE_02.md` — this file, full read
2. Read `app/campaign/boss/_components/PhaserBattleScene.tsx`
3. Read `app/campaign/boss/[bossId]/page.tsx` — arena JSX section and trigger calls
4. Read `data/bosses.json` — check whether `images` field has been added yet
5. Check PROGRESS TRACKER below — find last passed checkpoint
6. Resume from the next incomplete task

### PROGRESS TRACKER
```
Last completed checkpoint: [ NONE — update this ]
Last files modified:       [ list them ]
Session notes:             [ anything unexpected ]
```

### If a session ends mid-task:
Revert the partial change. Do not leave a broken canvas or missing image.
The battle must remain playable (Phase 1 mechanics intact) at all times.

---

## ACCURATE CURRENT STATE AT START OF PHASE 2

*Phase 1 delivered this. Verify it before starting Phase 2.*

| Item | State |
|------|-------|
| Energy battle system | Working (Hit, Block, charge timer, player HP) |
| Hero sprite | `public/sprites/hero_sheet.png` — placeholder, checkerboard |
| Boss sprite | `public/sprites/boss_atom_sheet.png` — placeholder, checkerboard |
| Boss sprite loading | Hardcoded in `page.tsx` — NOT from bosses.json |
| `data/bosses.json` | Has `chargeTime` on all bosses, NO `images` field yet |
| Arena background | CSS gradient only — dark, functional, not thematic |
| Checkerboard fix | `mix-blend-mode: screen` workaround — still present |
| `PhaserBattleScene.tsx` | Renders hero + boss sprites AND particles — will be split |

---

## WHAT PHASE 2 MUST DELIVER

1. Characters rendered as `<img>` tags, not Phaser sprites
2. Framer Motion driving character movement (lunge, shake, idle float)
3. Phaser canvas narrowed to effects only (particles, damage numbers)
4. Hero with 3 real PNG images — idle, attack, hurt
5. Acid-baron boss with 3 real PNG images — idle, attack, hurt
6. Boss images loaded dynamically from `bosses.json` (not hardcoded)
7. Checkerboard issue resolved — `mix-blend-mode: screen` removed
8. A basic themed background in the battle arena for acid-baron

---

## PREDICTED PROBLEMS & MITIGATIONS

### P1 — Image swap causes visible flash between states
**Problem:** Swapping `src` on an `<img>` tag while the new image is not yet
cached causes a brief blank frame between idle and attack.

**Mitigation:**
Preload all 3 images for both characters on component mount:
```typescript
useEffect(() => {
  [heroImages.idle, heroImages.attack, heroImages.hurt,
   bossImages.idle, bossImages.attack, bossImages.hurt].forEach(src => {
    const img = new Image();
    img.src = src;
  });
}, []);
```
Add this to the combat `useEffect` or a dedicated preload effect in `page.tsx`.

### P2 — Framer Motion and Phaser canvas z-index conflict
**Problem:** The Phaser canvas (absolute positioned) may overlap the character
images or the React UI depending on z-index order.

**Mitigation:**
Explicit z-index layers:
- Arena background image: `z-index: 0`
- Character images (Framer Motion): `z-index: 2`
- Phaser canvas (particles/effects): `z-index: 3` — sits ON TOP of characters
  so particles appear over them (this is correct)
- React UI (HP bars, buttons): `z-index: 10`

Phaser canvas must be `pointer-events: none` so clicks pass through to buttons.

### P3 — Framer Motion animate conflicts with state swap timing
**Problem:** If `heroState` is set back to `'idle'` before the attack animation
(a Framer Motion tween) has finished, the image swaps mid-motion.

**Mitigation:**
Use `useEffect` on `heroState` / `bossState` to auto-reset to idle after a
fixed duration. Do NOT reset state from the game logic functions — let the
effect handle it:
```typescript
useEffect(() => {
  if (heroState === 'idle') return;
  const t = setTimeout(() => setHeroState('idle'), heroState === 'attack' ? 500 : 400);
  return () => clearTimeout(t);
}, [heroState]);
```
Same pattern for `bossState`.

### P4 — AI-generated art has inconsistent image dimensions
**Problem:** If idle.png is 512×512 and attack.png is 480×600, the character
will visibly jump size when swapping states.

**Mitigation:**
Set a fixed container size on the character wrapper div. The `<img>` uses
`object-fit: contain` inside that container. All three images render at the
same container size regardless of their actual pixel dimensions.

### P5 — Boss images not ready when battle starts
**Problem:** `bossJsonData` is fetched async. If the arena renders before
`bossJsonData` resolves, the boss image src will be undefined.

**Mitigation:**
The arena already renders conditionally on `boss && boss.phase === "combat"`.
`boss` is only set after `bossJsonData` loads. This should be safe — verify
during checkpoint testing that the boss image is never undefined when visible.

### P6 — remove.bg quality on illustrated character art
**Problem:** remove.bg is optimised for photos. Illustrated characters with
complex edges (hair, robes, flame effects) may have ragged transparent edges.

**Mitigation:**
Use Leonardo.ai's built-in background removal if available (it understands
illustrated art better). Otherwise use Adobe Express (free tier) which handles
illustrated art better than remove.bg. For final production quality, GIMP's
"Fuzzy Select" + "Feather" (2px) on a solid background gives clean edges.

---

## TASKS

---

### SUB-PHASE 2.1 — Strip sprites from Phaser, keep effects

**Purpose:** `PhaserBattleScene.tsx` currently renders both sprites AND effects.
Split these concerns before adding new art. After this sub-phase, Phaser only
handles particles and damage numbers. Characters will be added in Sub-phase 2.3.

#### Task 2.1.1 — Remove sprite loading and animations from PhaserBattleScene
File: `app/campaign/boss/_components/PhaserBattleScene.tsx`

Remove the following from the Phaser scene:
- `this.load.spritesheet("hero", ...)` from `preload()`
- `this.load.spritesheet("boss", ...)` from `preload()`
- All `this.anims.create(...)` calls (all 6 animation definitions)
- `this.player = this.add.sprite(...)` and the `play` call
- `this.boss = this.add.sprite(...)` and the `play` call
- Both `animationcomplete` event listeners
- The boss idle float tween (`this.tweens.add({ targets: this.boss, ... })`)
- The `private player` and `private boss` class fields

Keep:
- Ground rectangle and ground line (`g.fillRect`, `g.lineBetween`)
- Particle emitter (`this.particles`)
- The `bossHurt` method (particles + damage number text)
- The `onReady` callback

Remove from the component props interface:
- `bossSheetUrl` prop (no longer needed — Phaser does not load sprites)

Update `PhaserBattleSceneHandle` to remove `triggerPlayerAttack` and
`triggerPlayerHurt` — Phaser no longer controls character animations:
```typescript
export interface PhaserBattleSceneHandle {
  triggerBossHurt: (damage: number) => void;
}
```

Update `onReady` callback to only expose `triggerBossHurt`:
```typescript
onReady?.({
  triggerBossHurt: (dmg) => methodsRef.current?.bossHurt(dmg),
});
```

The `playerAttack` and `playerHurt` entries in `methodsRef` can be removed entirely.

#### Task 2.1.2 — Update page.tsx to match the new handle type
File: `app/campaign/boss/[bossId]/page.tsx`

`phaserRef` currently has type `PhaserBattleSceneHandle`. After the handle
type changes, any call to `phaserRef.current?.triggerPlayerAttack()` or
`phaserRef.current?.triggerPlayerHurt()` will be a TypeScript error.

Find and remove these two Phaser calls (they will be replaced by Framer Motion
state changes in Sub-phase 2.3):
- `phaserRef.current?.triggerPlayerAttack()` — inside `triggerAttackAnimation` or `handleHit`
- `phaserRef.current?.triggerPlayerHurt()` — inside `handleBossAttack` and the shield absorb path

Also remove the `bossSheetUrl` prop from the `<PhaserBattleScene>` JSX usage.

Run `npx tsc --noEmit` after this task. Expect and fix type errors here.
Do NOT move to 2.1.3 until TypeScript is clean.

#### Task 2.1.3 — Verify battle still runs (degraded but functional)
At this point the battle will run with NO character visuals (only the ground line,
particles on hit, and damage numbers). This is expected and temporary.

Verify:
- Battle loads without console errors
- HP bars and energy bar work
- HIT button still calls `phaserRef.current?.triggerBossHurt(damage)` — particles fire
- Damage numbers still appear

This is the known degraded state between 2.1 and 2.3.

#### ✅ CHECKPOINT 2.1
**Pass criteria:**
- [ ] App compiles with zero TypeScript errors
- [ ] Battle loads without console errors
- [ ] Particles fire and damage numbers appear when HIT is clicked
- [ ] No Phaser sprite errors in console
- [ ] `PhaserBattleSceneHandle` has only `triggerBossHurt` — verified in the file

---

### SUB-PHASE 2.2 — Art production

**This is the art task. No code in this sub-phase.**
**The code that uses these images is written in Sub-phase 2.3.**

#### Task 2.2.1 — Generate player character baby-form images (Leonardo.ai)

The player character is one of three particles, not a scientist.
Phase 2 only needs the baby (M1–M3) forms — 9 images total.
See `roadmap/CHARACTER_SPEC.md` for full character descriptions.

Generate 3 images per particle. Save to `public/images/characters/`:

**Electron baby form** (`electron-baby-idle.png`, `electron-baby-attack.png`, `electron-baby-hurt.png`)
```
2D game character, tiny electric blue orb creature, glowing eyes slightly too large
for its body, flickering light trails, unsteady sparking energy, small and wobbly,
front-facing, pure black background, clean vector illustration, no background details
```
- idle: wobbling gently, faint sparks fizzling out around it
- attack: lunging forward, crackling bolt of electricity extending from its body
- hurt: recoiling backward, sparks scattered, dimming momentarily

**Proton baby form** (`proton-baby-idle.png`, `proton-baby-attack.png`, `proton-baby-hurt.png`)
```
2D game character, chubby round red orb creature, small plus symbol badge on chest,
warm orange-red glow, slightly bouncy and proud, front-facing, pure black background,
clean vector illustration, no background details
```
- idle: gentle proud bounce, warm glow pulsing
- attack: launching forward, plus symbol blazing, charging ahead
- hurt: staggered backward, glow flickering, looking surprised

**Neutron baby form** (`neutron-baby-idle.png`, `neutron-baby-attack.png`, `neutron-baby-hurt.png`)
```
2D game character, quiet semi-transparent grey orb creature, calm half-closed eyes,
drifting gently, no charge markers, ethereal ghostly quality, front-facing,
pure black background, clean vector illustration, no background details
```
- idle: drifting slowly, calm and still
- attack: sudden decisive forward surge, brief inner glow
- hurt: phasing slightly, flickering transparency, calm even in pain

Remove background using Leonardo's built-in tool or Adobe Express.
All 9 images should be the same pixel dimensions (e.g. 512×512).

#### Task 2.2.2 — Generate acid-baron boss images (Leonardo.ai)

Generate 3 images. Save to `public/images/characters/`:
- `boss-acid-baron-idle.png`
- `boss-acid-baron-attack.png`
- `boss-acid-baron-hurt.png`

**Leonardo.ai prompt template:**
```
2D game boss character, towering dark noble, corroded acid-eaten armour,
crown made of periodic table tiles, green glowing liquid dripping from hands,
front-facing, full body portrait, pure black background, menacing expression,
clean vector illustration style, game character art, no background details
```

Vary the pose per state:
- **idle**: imposing upright stance, arms slightly raised, green liquid dripping,
  subtle pulsing energy around hands
- **attack**: lunging forward, both hands extended firing a jet of green acid,
  mouth open in a roar
- **hurt**: staggered backward, one arm clutching armour, expression of pain and
  rage, cracks visible in armour

Remove background. Same pixel dimensions as hero images.

#### Task 2.2.3 — Generate acid-baron arena background (Leonardo.ai)

Generate 1 image. Save to `public/backgrounds/`:
- `arena-acid-baron.png`

**Leonardo.ai prompt template:**
```
2D game battle arena background, underground chemistry laboratory,
acid vats glowing green, corroded stone walls, dripping pipes, moody dark
atmosphere, wide horizontal image, no characters, 1200x400 aspect ratio,
game background art, pixel art style
```

Target dimensions: 1200×400px (or similar wide crop). The image will be
scaled to fit the arena div — exact dimensions are not critical.

#### ✅ CHECKPOINT 2.2
**Pass criteria (visual check only — no code):**
- [ ] `public/images/characters/` contains 6 PNG files (hero × 3, boss × 3)
- [ ] All 6 images have transparent backgrounds (no black/white fill)
- [ ] All 3 hero images are the same pixel dimensions
- [ ] All 3 boss images are the same pixel dimensions
- [ ] `public/backgrounds/arena-acid-baron.png` exists
- [ ] Viewing images in browser confirms transparent background (checkerboard pattern
      visible in image viewer = transparent — this is correct)

---

### SUB-PHASE 2.3 — BattleCharacter component and arena wiring

**Purpose:** Add the Framer Motion character components and wire them into page.tsx.

#### Task 2.3.1 — Create BattleCharacter component
Create new file: `app/campaign/boss/_components/BattleCharacter.tsx`

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";

type CharacterState = "idle" | "attack" | "hurt";

interface Props {
  idleSrc: string;
  attackSrc: string;
  hurtSrc: string;
  state: CharacterState;
  flip?: boolean;       // true for boss (faces left)
  width?: number;
  height?: number;
  alt: string;
}

const MOVE: Record<CharacterState, object> = {
  idle:   { y: [0, -8, 0], transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" } },
  attack: { x: 55, transition: { duration: 0.15, ease: "easeOut" } },
  hurt:   { x: [-10, 10, -10, 10, 0], transition: { duration: 0.35, ease: "easeInOut" } },
};

export default function BattleCharacter({
  idleSrc, attackSrc, hurtSrc, state,
  flip = false, width = 160, height = 200, alt,
}: Props) {
  const src = state === "attack" ? attackSrc : state === "hurt" ? hurtSrc : idleSrc;

  return (
    <motion.div
      style={{
        width,
        height,
        transform: flip ? "scaleX(-1)" : undefined,
        position: "relative",
      }}
      animate={MOVE[state]}
    >
      <motion.img
        key={src}
        src={src}
        alt={alt}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1, filter: state === "hurt" ? "brightness(2)" : "brightness(1)" }}
        transition={{ duration: 0.08 }}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </motion.div>
  );
}
```

**Notes:**
- Attack `x: 55` moves hero right (toward boss). The boss is `flip=true` — since
  its whole div is `scaleX(-1)`, a positive x moves it left (toward hero). Correct.
- `key={src}` on the `<motion.img>` causes Framer Motion to animate on image swap.
- The `brightness(2)` on hurt gives a white flash effect — visible on dark art.
- Do NOT add `"use server"` — this is a client component.

#### Task 2.3.2 — Add character state variables to page.tsx
File: `app/campaign/boss/[bossId]/page.tsx`

Add these two state variables immediately after the existing `useState` declarations:

```typescript
const [heroState, setHeroState]   = useState<"idle" | "attack" | "hurt">("idle");
const [bossState, setBossState]   = useState<"idle" | "attack" | "hurt">("idle");
```

Add these two auto-reset effects immediately after the existing `useEffect` blocks:

```typescript
// Auto-reset hero animation state to idle after action completes
useEffect(() => {
  if (heroState === "idle") return;
  const t = setTimeout(() => setHeroState("idle"), heroState === "attack" ? 520 : 420);
  return () => clearTimeout(t);
}, [heroState]);

// Auto-reset boss animation state to idle after action completes
useEffect(() => {
  if (bossState === "idle") return;
  const t = setTimeout(() => setBossState("idle"), 480);
  return () => clearTimeout(t);
}, [bossState]);
```

#### Task 2.3.3 — Wire character states to existing trigger call sites
File: `app/campaign/boss/[bossId]/page.tsx`

**In `handleHit`:**
Replace the removed `phaserRef.current?.triggerPlayerAttack()` call with:
```typescript
setHeroState("attack");
```
The existing `phaserRef.current?.triggerBossHurt(damage)` stays unchanged —
it still fires particles and the damage number.

Add boss hurt state after the Phaser call:
```typescript
setTimeout(() => setBossState("hurt"), 300); // 300ms after hero attack starts
```

**In `handleBossAttack`:**
Replace the removed `phaserRef.current?.triggerPlayerHurt()` calls with:
```typescript
setHeroState("hurt");
```
(Both call sites: the shield-absorbed path and the HP-damage path)

#### Task 2.3.4 — Add image preloading to prevent swap flash
File: `app/campaign/boss/[bossId]/page.tsx`

Add this effect after the character state effects from Task 2.3.2:

```typescript
// Preload character images to prevent blank-frame flash on state swap
useEffect(() => {
  if (!bossJsonData) return;
  const srcs = [
    "/images/characters/hero-idle.png",
    "/images/characters/hero-attack.png",
    "/images/characters/hero-hurt.png",
    bossJsonData.images?.idle,
    bossJsonData.images?.attack,
    bossJsonData.images?.hurt,
  ].filter(Boolean) as string[];

  srcs.forEach(src => {
    const img = new window.Image();
    img.src = src;
  });
}, [bossJsonData]);
```

#### Task 2.3.5 — Add `images` field to data/bosses.json
File: `data/bosses.json`

Add `"images"` object to acid-baron. All other bosses get a fallback to the
placeholder (pointing at the hero images temporarily — they will be updated in Phase 7):

For acid-baron:
```json
"images": {
  "idle":   "/images/characters/boss-acid-baron-idle.png",
  "attack": "/images/characters/boss-acid-baron-attack.png",
  "hurt":   "/images/characters/boss-acid-baron-hurt.png"
}
```

For all other bosses (temporary placeholder pointing to acid-baron art):
```json
"images": {
  "idle":   "/images/characters/boss-acid-baron-idle.png",
  "attack": "/images/characters/boss-acid-baron-attack.png",
  "hurt":   "/images/characters/boss-acid-baron-hurt.png"
}
```

This means every boss uses acid-baron art until Phase 7 adds their own.
That is acceptable — the energy system will work for all of them.

#### Task 2.3.6 — Render BattleCharacter components in the arena JSX
File: `app/campaign/boss/[bossId]/page.tsx`

Add import at the top:
```typescript
import BattleCharacter from "../_components/BattleCharacter";
```

In the arena JSX (the `boss.phase === "combat"` render section), find where
`<PhaserBattleScene>` is currently rendered. The Phaser canvas stays — add the
character components ABOVE it in the DOM (they will be z-indexed below the canvas):

```tsx
{/* Arena — battle area */}
<div className="relative w-full" style={{ height: 280 }}>

  {/* Arena background */}
  {bossJsonData?.arenaBackground && (
    <img
      src={bossJsonData.arenaBackground}
      alt=""
      className="absolute inset-0 w-full h-full object-cover opacity-50"
      style={{ zIndex: 0 }}
      draggable={false}
    />
  )}

  {/* Characters — Framer Motion */}
  <div className="absolute inset-0 flex items-end justify-between px-8 pb-4" style={{ zIndex: 2 }}>
    <BattleCharacter
      idleSrc="/images/characters/hero-idle.png"
      attackSrc="/images/characters/hero-attack.png"
      hurtSrc="/images/characters/hero-hurt.png"
      state={heroState}
      width={150}
      height={190}
      alt="Hero"
    />
    <BattleCharacter
      idleSrc={bossJsonData?.images?.idle   ?? "/images/characters/boss-acid-baron-idle.png"}
      attackSrc={bossJsonData?.images?.attack ?? "/images/characters/boss-acid-baron-attack.png"}
      hurtSrc={bossJsonData?.images?.hurt    ?? "/images/characters/boss-acid-baron-hurt.png"}
      state={bossState}
      flip
      width={160}
      height={200}
      alt={bossJsonData?.name ?? "Boss"}
    />
  </div>

  {/* Phaser canvas — particles and damage numbers only */}
  <div className="absolute inset-0" style={{ zIndex: 3, pointerEvents: "none" }}>
    <PhaserBattleScene
      width={600}
      height={280}
      onReady={(handle) => { phaserRef.current = handle; }}
    />
  </div>

</div>
```

Note: `bossJsonData` TypeScript type will need updating to recognise the new
`images` and `arenaBackground` fields. TypeScript will infer these from the JSON
automatically — just verify no `never` errors after adding them to bosses.json.

#### Task 2.3.7 — Add `arenaBackground` field to data/bosses.json
File: `data/bosses.json`

Add to acid-baron only:
```json
"arenaBackground": "/backgrounds/arena-acid-baron.png"
```

All other bosses: omit this field. The `?.arenaBackground` optional chain in the
JSX renders nothing for bosses without it — which is correct.

#### Task 2.3.8 — Remove mix-blend-mode screen from PhaserBattleScene container
File: `app/campaign/boss/_components/PhaserBattleScene.tsx`

The container div currently has `mixBlendMode: "screen"` to suppress
checkerboard rendering. With sprites removed from Phaser, this is no longer needed.

```typescript
// Remove mixBlendMode: "screen" from the container div style
// Leave the style prop empty or remove it entirely
```

The CLAUDE.md rule "do not remove mixBlendMode: screen" applied to the old
sprite-based Phaser setup. With sprites moved out of Phaser, that workaround
is no longer relevant. This task officially supersedes that rule for this file.

#### ✅ CHECKPOINT 2.3
**Pass criteria:**
- [ ] Hero character visible in arena during combat phase
- [ ] Boss character visible in arena, facing left (mirrored)
- [ ] Both characters do a gentle float/bob in idle state
- [ ] HIT button: hero lunges right, then boss flinches, damage number appears
- [ ] Boss attack: hero flinches with brightness flash
- [ ] No checkerboard visible anywhere
- [ ] No TypeScript errors, no console errors
- [ ] Phaser particles still fire on boss hurt (verify in DevTools — no Phaser errors)

---

### SUB-PHASE 2.4 — Visual polish and consistency pass

**Purpose:** Catch visual issues before declaring Phase 2 done.
No new features — only fixing what looks wrong during testing.

#### Task 2.4.1 — Side-by-side visual review
Open the battle page in browser at 1280×800. Check:

1. **Characters not obscuring UI:** HP bars, energy bars, buttons must not be
   covered by character images. Adjust character `height` prop if needed.
2. **Arena proportions:** Both characters visible with clear space between them.
3. **Animation timing:** Hero attack starts, then 300ms later boss flinches with
   damage number. Feels responsive, not laggy.
4. **Idle bob:** Both characters visibly floating when nothing is happening.
5. **Image quality:** Art looks clean, edges are transparent (no jagged halos).

Fix any issue that takes under 10 minutes.
Longer issues: add `// TODO Phase 2 polish: [description]` and note in tracker.

#### Task 2.4.2 — Clean up dead sprite references in bosses.json
File: `data/bosses.json`

The `sprite` field on each boss (`boss_chemistry.png`, `boss_biology.png`, etc.)
references files that do not exist. The `spriteSheet` field from the old Rive
plan was never added (we skipped it). Clean up:

Remove or nullify any fields that reference non-existent sprite files.
The only image fields that should exist going forward are `images` (object with
idle/attack/hurt) and optionally `arenaBackground`.

#### ✅ CHECKPOINT 2.4
**Pass criteria:**
- [ ] No visible UI overlap issues at 1280×800 viewport
- [ ] Both characters animate through all 3 states during a full playthrough
- [ ] Animation timing feels correct — action leads consequence by ~300ms
- [ ] Dead sprite file references cleaned from bosses.json
- [ ] PROGRESS TRACKER updated

---

### SUB-PHASE 2.5 — Character Selection Screen

**Purpose:** Players choose their particle (Electron / Proton / Neutron) before
their first battle. This choice is stored in the User table and persists across
sessions. The battle page reads it to determine which character images to show.

#### Task 2.5.1 — Add `characterChoice` column to User table (Supabase migration)

Run in Supabase SQL editor:
```sql
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "characterChoice" TEXT
CHECK ("characterChoice" IN ('electron', 'proton', 'neutron'));
```

Default is NULL — a null `characterChoice` means the player hasn't chosen yet.
The selection screen appears when `characterChoice` is null.

#### Task 2.5.2 — Create character selection API endpoint
Create: `app/api/user/character/route.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse as json } from "next/server";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return json.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return json.json({ error: "Unauthorized" }, { status: 401 });

  const { characterChoice } = await req.json();
  if (!["electron", "proton", "neutron"].includes(characterChoice)) {
    return json.json({ error: "Invalid character" }, { status: 400 });
  }

  await db.from("User").update({ characterChoice }).eq("id", user.id);
  return json.json({ ok: true });
}
```

#### Task 2.5.3 — Create CharacterSelectModal component
Create: `app/campaign/boss/_components/CharacterSelectModal.tsx`

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/auth-fetch";
import type { Session } from "@supabase/supabase-js";

const CHARACTERS = [
  {
    id: "electron" as const,
    symbol: "e⁻",
    name: "Electron",
    tagline: "Tiny, fast, negatively charged. Never sits still.",
    archetype: "Offensive / Speed",
    color: "#3b82f6",
    bg: "from-blue-950/80 to-blue-900/40",
    border: "border-blue-500/60",
  },
  {
    id: "proton" as const,
    symbol: "p⁺",
    name: "Proton",
    tagline: "Heavy, positive, powerful. Slow but hits hard and takes hits harder.",
    archetype: "Defensive / Tank",
    color: "#ef4444",
    bg: "from-red-950/80 to-red-900/40",
    border: "border-red-500/60",
  },
  {
    id: "neutron" as const,
    symbol: "n⁰",
    name: "Neutron",
    tagline: "Neutral, mysterious, stabilising. No charge — but that's the power.",
    archetype: "Balanced / Support",
    color: "#22c55e",
    bg: "from-green-950/80 to-green-900/40",
    border: "border-green-500/60",
  },
] as const;

type CharacterId = "electron" | "proton" | "neutron";

interface Props {
  session: Session | null;
  onSelect: (choice: CharacterId) => void;
}

export default function CharacterSelectModal({ session, onSelect }: Props) {
  const handleSelect = async (choice: CharacterId) => {
    if (session) {
      await authFetch("/api/user/character", session, {
        method: "POST",
        body: JSON.stringify({ characterChoice: choice }),
      });
    }
    onSelect(choice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-4 text-center"
      >
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
          Choose Your Particle
        </h1>
        <p className="text-white/50 text-sm mb-8 font-mono">
          This choice persists through your entire journey. Choose wisely.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {CHARACTERS.map((char) => (
            <motion.button
              key={char.id}
              onClick={() => handleSelect(char.id)}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              className={`bg-gradient-to-b ${char.bg} border ${char.border}
                rounded-xl p-5 text-left cursor-pointer transition-shadow
                hover:shadow-lg`}
              style={{ boxShadow: `0 0 0 0 ${char.color}` }}
            >
              <div className="text-4xl font-bold mb-3" style={{ color: char.color }}>
                {char.symbol}
              </div>
              <div className="text-white font-bold text-lg mb-1">{char.name}</div>
              <div className="text-white/60 text-xs leading-relaxed mb-3">
                {char.tagline}
              </div>
              <div
                className="text-xs font-mono font-bold px-2 py-1 rounded-full inline-block"
                style={{ backgroundColor: `${char.color}22`, color: char.color }}
              >
                {char.archetype}
              </div>
            </motion.button>
          ))}
        </div>

        <p className="text-white/25 text-xs mt-6 font-mono">
          Your particle evolves as you progress through modules.
        </p>
      </motion.div>
    </div>
  );
}
```

#### Task 2.5.4 — Read characterChoice in the battle page
File: `app/campaign/boss/[bossId]/page.tsx`

Add state for character choice (defaults to electron if not yet set):
```typescript
const [characterChoice, setCharacterChoice] = useState<"electron" | "proton" | "neutron" | null>(null);
```

Add a fetch in the existing data-loading `useEffect` to read `characterChoice`
from the User table. When the user profile loads, set `characterChoice` from
`userData.characterChoice`. If it is null, `characterChoice` state stays null
and the selection modal renders.

Import and render the modal:
```typescript
import CharacterSelectModal from "../_components/CharacterSelectModal";
```

```tsx
{/* Character selection — shown before first battle if no choice saved */}
{characterChoice === null && (
  <CharacterSelectModal
    session={session}
    onSelect={(choice) => setCharacterChoice(choice)}
  />
)}
```

#### Task 2.5.5 — Wire characterChoice to BattleCharacter image paths
Replace the hardcoded hero image paths in the arena JSX with dynamic paths:

```typescript
// Derive form based on module progress
// For Phase 2: always "baby" — Phase 7 adds form progression
const characterForm = "baby";
const characterBase = characterChoice ?? "electron";

const heroImages = {
  idle:   `/images/characters/${characterBase}-${characterForm}-idle.png`,
  attack: `/images/characters/${characterBase}-${characterForm}-attack.png`,
  hurt:   `/images/characters/${characterBase}-${characterForm}-hurt.png`,
};
```

Pass these to `BattleCharacter`:
```tsx
<BattleCharacter
  idleSrc={heroImages.idle}
  attackSrc={heroImages.attack}
  hurtSrc={heroImages.hurt}
  state={heroState}
  width={150}
  height={190}
  alt={characterBase}
/>
```

#### ✅ CHECKPOINT 2.5
**Pass criteria:**
- [ ] First visit to a boss battle: CharacterSelectModal appears
- [ ] Selecting a particle dismisses modal and shows that character in the arena
- [ ] Refreshing the page: modal does NOT appear again (choice is saved to DB)
- [ ] The correct particle images render in battle (electron = blue orb, etc.)
- [ ] No TypeScript errors, no console errors
- [ ] `authFetch` is used for the character save call (not bare fetch)

---

## PHASE 2 FINAL CHECKPOINT

**Must be tested manually in browser. Not code review alone.**

### Full visual test script:
1. Navigate to the acid-baron battle
2. Confirm: arena background visible (chemistry lab, green tones)
3. Confirm: hero character visible left, animating (idle bob)
4. Confirm: boss character visible right, facing left, animating (idle float)
5. Answer correctly → HIT → confirm: hero lunges, pause, boss flinches + damage number
6. Let boss charge bar fill → confirm: hero flinches (brightness flash)
7. Block → let boss attack → confirm: hero flinches but HP does NOT drop
8. Win the battle → confirm victory screen
9. Navigate to a different boss (e.g. redox-reaper)
10. Confirm: battle loads without errors (acid-baron art used as placeholder — fine)

### Final pass criteria (ALL must be true):
- [ ] Full visual test script completed with zero console errors
- [ ] No checkerboard anywhere — neither on characters nor on Phaser canvas
- [ ] Hero and boss animate through idle/attack/hurt during a full battle
- [ ] Arena background visible for acid-baron, no error for other bosses
- [ ] `data/bosses.json` has `images` field on all 8 bosses
- [ ] No hardcoded image paths in `page.tsx` (all come from bosses.json or constants)
- [ ] PROGRESS TRACKER updated

---

## WHAT PHASE 3 RECEIVES

When Phase 2 is complete, Phase 3 starts with:
- Hero and acid-baron with polished PNG art, Framer Motion animations
- All other bosses using acid-baron art as placeholder (updated in Phase 7)
- Arena background for acid-baron, CSS gradient for all others
- Phaser canvas doing effects only — clean separation of concerns
- Energy battle system from Phase 1 fully intact, untouched
- Phase 3 focuses on: Module 1 chambers, the full map-to-battle-to-map loop

---

*Previous phase: PHASE_01.md*
*Next phase: PHASE_03.md — Module 1 Complete & Full Campaign Loop*
*Vision reference: VISION.md*
*Art decision: ART_PIPELINE.md*
