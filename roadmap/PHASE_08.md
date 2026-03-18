# PHASE 08 — MOBILE RESPONSIVENESS & PERFORMANCE

**Phase Goal:** The app is playable on a phone. No horizontal scrolling on the boss battle scene, no cut-off buttons, no invisible elements. Campaign map and chamber pages already work acceptably on mobile — the boss battle is the critical failure point.

**Depends On:** Phase 1 complete (energy battle system — we need the final component structure to know what to make responsive)

**Does NOT require:** Phases 2, 3, 4, 5, 6, 7 to be complete. Mobile fixes are mostly CSS and layout changes that are independent of content and auth wiring.

**Honest Assessment:** The boss battle page has a Phaser canvas hardcoded at 600×260 pixels. A mobile screen is 320–430px wide. The canvas overflows and causes horizontal scroll on the entire page, breaking the battle UI. The rest of the battle UI (HP bars, energy bar, question card, action buttons) is likely also not designed for 375px screens. Everything else in the app (campaign map, profile, leaderboard) uses Tailwind's responsive utilities and is probably acceptable on mobile with minor tweaks.

---

## CONTEXT WINDOW SURVIVAL PROTOCOL

**If you start a new session for Phase 8, READ THESE FILES FIRST — in this order:**

1. `roadmap/PHASE_08.md` (this file — read PROGRESS TRACKER first)
2. `app/campaign/boss/_components/PhaserBattleScene.tsx` — canvas sizing (fixed 600×260)
3. `app/campaign/boss/[bossId]/page.tsx` — find where PhaserBattleScene is rendered and with what width/height props
4. `app/campaign/page.tsx` — check mobile chamber path layout

**Then open browser DevTools → Device Toolbar → iPhone SE (375px) and visually check BEFORE writing code:**
- `/campaign` — do chamber nodes overflow? Is horizontal scroll present?
- `/campaign/boss/acid-baron` — does the canvas overflow? Are buttons reachable?
- `/campaign/chamber/m1-c1` — is the question card readable?

**DO NOT start coding from memory. Test visually first, then fix what you actually observe.**

---

## PROGRESS TRACKER

```
[ ] 8.1 — Phaser canvas responsive sizing
[ ] 8.2 — Boss battle UI mobile layout
[ ] 8.3 — Campaign map mobile audit
[ ] 8.4 — Touch and performance fixes
[ ] 8.5 — CHECKPOINT: full mobile playthrough
```

---

## ACCURATE CURRENT STATE (verified by reading files)

### `PhaserBattleScene.tsx` — fixed pixel sizing
- Component accepts `width` and `height` props (defaults: `width=600, height=260`)
- Container div: `style={{ width, height }}` — exact pixel values, not responsive
- Phaser config: `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` — would scale within the container IF the container were responsive, but it's not
- Phaser game created with `width, height` as pixel values — this is the internal resolution
- `mixBlendMode: "screen"` on container — for checkerboard suppression
- Lazy loaded: `await import("phaser")` — correct, avoids SSR issues
- Canvas destroyed on cleanup: `gameRef.current?.destroy(true)` — correct

### Boss sprite positions inside Phaser
- Player sprite: `W * 0.22` from left (W = Phaser internal width = 600)
- Boss sprite: `W * 0.78` from left
- If Phaser's internal W stays 600 but container is 375px, FIT mode scales everything down proportionally — positions stay correct as ratios

### Campaign map
- Chamber path: `flex items-center gap-0 overflow-x-auto pb-1` — horizontal scroll enabled
- Wrapper: `max-w-3xl mx-auto` — responsive, not fixed width
- Module cards: Tailwind responsive classes throughout — likely OK on mobile

### What WILL be broken on mobile (pre-audit predictions):
1. Boss battle Phaser canvas — 600px width on 375px screen = visible horizontal overflow
2. Boss battle HP bars — `absolute top-4 left-4` and `absolute top-4 right-4`, each `width: 42%` — positioned relative to page layout, may overlap canvas badly
3. Energy and charge bars — also absolutely positioned below HP bars
4. Question card — probably fine (uses Tailwind, not absolute)
5. Hit + Block buttons — need to be thumb-reachable at bottom of screen

### What will likely be FINE on mobile:
1. Campaign map — `max-w-3xl` with `overflow-x-auto` on chamber paths
2. Chamber question page — simple card layout, Tailwind responsive
3. Profile page — `grid-cols-1 md:grid-cols-3` responsive
4. Leaderboard — list-based, responsive
5. Login/Register — centered card, small

---

## GUARDRAILS

1. **Fix only what is actually broken.** Do a visual audit in DevTools before writing any code. Do not fix problems that don't exist.
2. **Do not touch BATTLE_SPEC.md or game logic.** Mobile fixes are layout and CSS only.
3. **The Phaser canvas must keep its internal resolution at 600×260.** Reduce the CONTAINER width, let Phaser's scale mode handle rendering.
4. **Do not remove `mixBlendMode: "screen"`.** It suppresses checkerboard artifacts.
5. **Minimum target: iPhone SE (375px wide, 667px tall).** If it works here, it works everywhere larger.
6. **Test on real iOS Safari if possible.** DevTools emulation does not test touch performance, WebGL limits, or iOS Safari quirks.

---

## SUB-PHASE 8.1 — PHASER CANVAS RESPONSIVE SIZING

**Purpose:** The canvas must fit within the phone screen width without horizontal overflow.

### Task 8.1.1 — Find the PhaserBattleScene usage in page.tsx
In `app/campaign/boss/[bossId]/page.tsx`, search for `<PhaserBattleScene`. Note:
- What `width` and `height` props are passed (if any — may use defaults of 600×260)
- What wrapper div surrounds it and its CSS classes/styles
- Whether the wrapper has any `overflow: hidden` or width constraints

### Task 8.1.2 — Make the canvas container responsive
The fix is in `PhaserBattleScene.tsx`. Replace fixed pixel sizing on the container with responsive sizing, keeping Phaser's internal resolution unchanged.

**Current container:**
```tsx
<div
  ref={containerRef}
  style={{
    width,         // 600 — fixed pixels
    height,        // 260 — fixed pixels
    mixBlendMode: "screen",
  }}
/>
```

**Option A — Pure CSS fix (simpler):**
```tsx
<div
  ref={containerRef}
  style={{
    width: '100%',
    maxWidth: width,                      // caps at 600px on desktop
    aspectRatio: `${width} / ${height}`,  // height scales with width (e.g. 375px wide → ~162px tall)
    mixBlendMode: "screen",
  }}
/>
```
Phaser's `Scale.FIT` mode scales the canvas down to fit the narrower container.
Sprites stay correctly positioned as ratios (W * 0.22 etc.) because Phaser scales
everything proportionally.

**Why `aspectRatio` is required:** Without it the container stays at the fixed
`height` prop (260px) even when the canvas scales to ~162px on a 375px screen,
leaving ~98px of empty space below the rendered canvas. The `aspectRatio` CSS
property ensures the container height matches the actual rendered canvas height.
Remove the `height` prop from the container style when using Option A — height
is derived from width via `aspectRatio`.

**Option B — Dynamic sizing (more reliable):**
```typescript
// Inside init() in PhaserBattleScene.tsx, before Phaser.Game creation:
const containerWidth = containerRef.current?.offsetWidth ?? width;
const aspectRatio = height / width;
const scaledHeight = Math.floor(containerWidth * aspectRatio);

gameRef.current = new Phaser.Game({
  type: Phaser.AUTO,
  width: containerWidth,
  height: scaledHeight,
  ...
});
```
Also update the container style to `width: '100%', maxWidth: width, height: scaledHeight`.

**Choose Option A first** — it's simpler and Phaser's FIT mode is designed for this. Only switch to Option B if Option A doesn't scale correctly.

### Task 8.1.3 — Verify the parent wrapper in page.tsx isn't fixed-width
If the element wrapping `<PhaserBattleScene>` in `page.tsx` has `style={{ width: '600px' }}` or `min-w-[600px]`, making the component itself responsive won't help — the overflow will come from the parent.

Fix: change any fixed-width parent wrappers to `w-full` or `max-w-[600px]`.

### Task 8.1.4 — Test canvas on mobile
After the fix, reload on DevTools iPhone SE (375px):
- Canvas should fill the 375px width
- No horizontal scroll bar should appear
- Sprites should be visible (scaled down but present)

#### ✅ CHECKPOINT 8.1
- [ ] No horizontal scroll on boss battle page (iPhone SE 375px)
- [ ] Phaser canvas visible with both sprites
- [ ] Animations play correctly
- [ ] Canvas does not overflow the viewport

---

## SUB-PHASE 8.2 — BOSS BATTLE UI MOBILE LAYOUT

**Purpose:** With the canvas fixed, audit the rest of the boss battle page UI on mobile.

### Task 8.2.1 — Visual audit with an active battle
On DevTools iPhone SE, navigate to a boss battle and tap "Begin Battle". Check:

1. Boss HP bar and name (top-left area) — visible? Cut off?
2. Player HP bar (top-right area) — visible? Overlapping canvas?
3. Energy bar — visible?
4. Boss charge bar — visible?
5. Question card — readable? Overlapping canvas?
6. Answer options — all 4 visible? Tappable without zooming?
7. Hit + Block buttons — visible? In thumb reach (bottom of screen)?
8. Hint button — visible?

Document every issue found. Fix only issues actually observed.

### Task 8.2.2 — Fix HP bar positioning if bars overlap canvas
The HP bars use `absolute` positioning. If the canvas height on mobile is ~162px (scaled from 260px to maintain 375/600 ratio) and the bars are at `top-4` (16px), they are visually inside the canvas.

**Fix approach:** On mobile, move the HP bars below the canvas rather than overlapping it.

Use Tailwind responsive variants:
```tsx
// HP bar container — overlaps canvas on desktop, sits below on mobile
className="absolute left-2 right-2 md:top-4 md:left-4 md:right-auto"
style={{ top: isMobile ? `${canvasHeight + 8}px` : undefined }}
```

Or simpler: restructure the layout section to be a vertical stack on mobile:
```tsx
<div className="flex flex-col md:relative">
  {/* Canvas first */}
  <PhaserBattleScene ... />

  {/* HP bars below canvas on mobile, overlapping on desktop */}
  <div className="flex justify-between px-2 md:absolute md:top-4 md:left-0 md:right-0 md:px-4">
    {/* Boss HP left, Player HP right */}
  </div>
</div>
```

This is the safest approach — avoid absolute positioning on mobile entirely.

### Task 8.2.3 — Ensure action buttons are thumb-reachable
The Hit and Block buttons should be in the lower 40% of the screen on mobile. On a 667px tall iPhone SE, that means below 400px from the top.

If the buttons are buried under the question card text and off-screen:
- Add `sticky bottom-0 bg-gray-900/95 pb-safe` to the action button row
- The `pb-safe` CSS (env(safe-area-inset-bottom)) handles iPhone notch/home bar
- Or simply ensure the battle layout scrolls naturally with buttons always visible below the question

### Task 8.2.4 — Answer options: single column on mobile
Answer options should be `grid-cols-1 sm:grid-cols-2` — single column on small phones, 2-column on larger screens. This makes each option taller and easier to tap.

If currently 2-column on all screen sizes, add `grid-cols-1 sm:grid-cols-2` to the answer grid container.

### Task 8.2.5 — Increase answer button minimum touch target
Answer option buttons should have minimum `py-3` (48px height with text) for comfortable tapping. If currently `py-2`, change to `py-3 md:py-2`.

#### ✅ CHECKPOINT 8.2
On iPhone SE active battle:
- [ ] Boss and player HP bars visible without overlapping unreadably
- [ ] Energy bar and charge bar visible
- [ ] Question text readable without pinch-zoom
- [ ] All 4 answer options visible and tappable
- [ ] Hit and Block buttons in thumb reach (no need to scroll down to tap)
- [ ] No element cut off by screen edge

---

## SUB-PHASE 8.3 — CAMPAIGN MAP MOBILE AUDIT

**Purpose:** Verify the campaign map works acceptably on mobile. It likely needs only minor fixes.

### Task 8.3.1 — Visual audit on iPhone SE
On DevTools iPhone SE, navigate to `/campaign`. Check:

1. Header — coins + shop + Pro badge + rank bar on one line?
2. Module cards — correct width, no overflow?
3. Chamber path — horizontal scroll smooth?
4. Chamber node labels — text readable (not too small)?
5. Boss node — reachable by scrolling right?
6. CTA button — full width, visible?

### Task 8.3.2 — Fix header overflow if present
The campaign header contains: title + subtitle (left) + coins badge + shop link + optional Pro badge (right). On 375px this may be cramped.

**If overflow:** On mobile, hide the shop link (`hidden md:flex`) and shorten the coins display. The shop is accessible from the hub — not essential in the campaign header.

### Task 8.3.3 — Verify chamber path scrolls smoothly on iOS
The chamber path div uses `overflow-x-auto`. On iOS Safari, add `-webkit-overflow-scrolling: touch` for momentum scroll:
```tsx
// In the chamber path div
style={{ WebkitOverflowScrolling: 'touch' }}
```
Or use Tailwind's `overflow-x-auto` which should handle this in modern iOS. Test on real device if possible.

#### ✅ CHECKPOINT 8.3
- [ ] Campaign map header fits on 375px without overflow
- [ ] Chamber path horizontal scroll works and is smooth
- [ ] CTA button full-width and tappable
- [ ] Module cards render correctly

---

## SUB-PHASE 8.4 — TOUCH AND PERFORMANCE FIXES

### Task 8.4.1 — Verify Phaser doesn't block page scrolling
Phaser's input system may intercept touch events, preventing the browser's native scroll. If tapping the canvas blocks scrolling:
```typescript
// In Phaser game config:
input: { touch: { capture: false } }
```
Only apply if scrolling is actually broken — don't preemptively add it.

### Task 8.4.2 — Check for iOS Safari WebGL issues
Phaser uses `Phaser.AUTO` which selects WebGL if available. If the canvas renders blank on iOS:
```typescript
// Check if WebGL is available:
const canvas = document.createElement('canvas');
const hasWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
type: hasWebGL ? Phaser.AUTO : Phaser.CANVAS,
```
Canvas renderer is slower but universally supported. Only switch if WebGL blank canvas is confirmed.

### Task 8.4.3 — Prevent iOS text zoom on question inputs
iOS Safari auto-zooms when an input has `font-size < 16px`. The question card has no inputs per se (answer selection is tap, not type), but any `<input>` fields on login/register pages with `text-sm` (14px) will trigger zoom.

On login and register forms: ensure `text-base` (16px) on all `<Input>` elements, or add `text-[16px]` inline override.

### Task 8.4.4 — Add `viewport` meta tag if missing
Check `app/layout.tsx` for the viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```
If missing, the entire app renders at desktop scale on mobile. This is usually handled by Next.js automatically in `<head>` — verify it's present.

#### ✅ CHECKPOINT 8.4
- [ ] Phaser canvas loads on mobile (no blank canvas)
- [ ] Touching the canvas doesn't lock page scrolling
- [ ] Login/register forms don't trigger iOS zoom
- [ ] Viewport meta tag present in page source

---

## SUB-PHASE 8.5 — FULL MOBILE PLAYTHROUGH

This is the Phase 8 pass/fail gate. Run on mobile DevTools (iPhone SE, 375×667) or real device.

### Full playthrough script:
1. Open app on mobile (375px viewport)
2. Register account — form usable, keyboard doesn't obscure submit button
3. Navigate to `/campaign`
4. Tap Chamber 1 → chamber page renders
5. Answer 8 questions — tap answer options, all tappable
6. Return to campaign map — checkmark on chamber 1
7. Complete remaining chambers
8. Enter boss battle — canvas renders, NO horizontal scroll
9. Begin battle:
   - Answer questions (tap)
   - Watch energy bar fill
   - Tap HIT — player attack animation plays
   - Tap BLOCK — button shows SHIELDED
   - Boss charge bar fills and resets
10. Win — victory screen fully visible, "Continue Campaign" tappable

### Pass criteria (ALL must be true):
- [ ] No horizontal scroll on any page
- [ ] No elements cut off by screen edges
- [ ] All buttons have ≥ 44px touch target
- [ ] Phaser canvas visible and functional
- [ ] Question text readable without pinch-zoom
- [ ] Hit and Block buttons in thumb reach
- [ ] Victory screen "Continue Campaign" button visible and tappable
- [ ] No console errors during mobile playthrough

---

## PREDICTED PROBLEMS AND MITIGATIONS

### Problem 1: Phaser canvas still overflows after CSS fix
**Symptom:** Horizontal scroll persists even with `width: '100%'`
**Root cause:** A parent element in page.tsx has a fixed pixel width
**Mitigation:** Task 8.1.3 — audit ALL parent elements. Find any with `style={{ width: 600 }}` or `min-w-[600px]` and change to `w-full` / `max-w-[600px]`.

### Problem 2: Phaser FIT mode mispositions sprites on narrow canvas
**Symptom:** Sprites appear at wrong positions or clipped after canvas is narrowed
**Root cause:** FIT mode scales uniformly, but if Phaser's internal `W` stays 600 and the CSS container is 375px, Phaser may not re-calculate sprite positions
**Mitigation:** Switch to Option B from Task 8.1.2 (dynamic sizing) — pass actual container pixel width to Phaser at init time so `W` in the scene equals the actual display width.

### Problem 3: HP bars overlap canvas unreadably on mobile
**Symptom:** HP bars are inside the canvas area, text illegible over sprites
**Root cause:** Absolute positioning with `top-4` puts bars at 16px from top — always inside a 162px canvas
**Mitigation:** Task 8.2.2 restructures the layout to stack HP bars below canvas on mobile using responsive Tailwind. No absolute positioning on mobile.

### Problem 4: iOS WebGL context lost mid-battle
**Symptom:** Canvas goes blank during battle on iPhone, game freezes
**Root cause:** iOS limits concurrent WebGL contexts. If user has multiple tabs open or memory is low, context is lost.
**Mitigation:** Task 8.4.2 — fall back to Canvas renderer on mobile. Also add a `contextlost` event listener to detect and show an error message:
```typescript
gameRef.current?.canvas.addEventListener('webglcontextlost', () => {
  toast.error('Graphics context lost. Please refresh.');
});
```

### Problem 5: Keyboard pushes battle UI out of view on mobile
**Symptom:** When an input is focused (login/register), the virtual keyboard pushes content up and the layout breaks
**Root cause:** iOS Safari resizes the viewport when the keyboard opens
**Mitigation:** This mainly affects login/register pages, not the battle UI (no typing in battle). For forms: use `position: fixed` on important buttons or ensure they don't rely on viewport height.

### Problem 6: Chamber horizontal scroll steals vertical scroll events
**Symptom:** Trying to scroll the page vertically in the campaign module section accidentally triggers horizontal chamber scroll
**Root cause:** A single touch swipe can be interpreted as either horizontal or vertical scroll depending on angle
**Mitigation:** Add `touch-action: pan-y` to the chamber path container to tell the browser to prioritize vertical scrolling:
```tsx
style={{ touchAction: 'pan-y' }}
```
Users must swipe horizontally intentionally to scroll the chamber path.

---

## SESSION-END INSTRUCTIONS

At the end of every session working on Phase 8:
1. Update PROGRESS TRACKER
2. Document what was changed and what breakpoint it targets
3. Note which devices were tested (real vs emulated)
4. If Checkpoint 8.5 passes, write "PHASE 8 COMPLETE" in PROGRESS TRACKER

---

## WHAT PHASE 8 DOES NOT INCLUDE

- ❌ Native app (React Native / Capacitor)
- ❌ Push notifications
- ❌ Offline mode / service workers
- ❌ PWA manifest
- ❌ Landscape mode optimization (portrait is the target)
- ❌ Android-specific issues beyond what DevTools emulation catches

---

## WHAT PHASE 9 RECEIVES

When Phase 8 is complete:
- App works on mobile browsers (Safari iOS, Chrome Android)
- No horizontal overflow on any page
- Boss battle canvas responsive
- Phase 9 handles polish: onboarding, tutorial, sound, hub page decisions, and production prep

---

*Previous phase: PHASE_07.md — Modules 2 & 3 Content*
*Next phase: PHASE_09.md — Polish & Onboarding*
