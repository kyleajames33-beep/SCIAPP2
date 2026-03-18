# CHARACTER_SPEC.md — Player Character System
> This file is the single source of truth for all player character definitions.
> Do not modify it without explicit instruction. Phase 9.5 implements active powers.
> Phase 2 implements selection + baby art. Phase 7 implements evolution forms.

---

## Three Starter Particles

| ID | Symbol | Name | Archetype | Stored value |
|----|--------|------|-----------|-------------|
| `electron` | e⁻ | Electron | Offensive / Speed | `"electron"` |
| `proton` | p⁺ | Proton | Defensive / Tank | `"proton"` |
| `neutron` | n⁰ | Neutron | Balanced / Support | `"neutron"` |

Stored in `User.characterChoice` (TEXT, nullable). NULL = not yet chosen.

---

## Evolution Milestones

| Form | Modules active | Art suffix |
|------|---------------|------------|
| Baby | M1–M3 | `-baby-` |
| Mid | M4–M5 | `-mid-` |
| Titan | M6–M8 | `-titan-` |

Form is derived from the highest module the player has a completed boss for.
The derivation function lives in `lib/character-utils.ts` (created in Phase 7):
```typescript
export const getCharacterForm = (highestCompletedModule: number): "baby" | "mid" | "titan" => {
  if (highestCompletedModule >= 6) return "titan";
  if (highestCompletedModule >= 4) return "mid";
  return "baby";
};
```

Image path formula: `/images/characters/{characterChoice}-{form}-{state}.png`
where `state` is `idle | attack | hurt`.

---

## Passive Stat Multipliers (Phase 1 addition)

These are applied in the damage/energy formulas in `page.tsx`.
They are multipliers on top of BATTLE_SPEC.md — they do not replace any formula.

| Character | Damage dealt modifier | Damage received modifier | Energy mechanic |
|-----------|----------------------|--------------------------|-----------------|
| Electron | ×1.15 | ×1.0 (no change) | No change |
| Proton | ×0.9 | ×0.8 | No change |
| Neutron | ×(0.8 + streak × 0.05), max ×1.3 | ×1.0 | No change |

Implementation: in `calcHitDamage()`, multiply the result by the character modifier.
In `handleBossAttack()`, multiply the incoming damage by the received modifier.

```typescript
// In page.tsx — read once when bossJsonData loads, store in ref
const getCharacterDamageMultiplier = (choice: string | null) => {
  if (choice === "electron") return { dealt: 1.15, received: 1.0 };
  if (choice === "proton")   return { dealt: 0.9,  received: 0.8 };
  return { dealt: 1.0, received: 1.0 }; // neutron — scaled separately by streak
};
```

Neutron damage formula override:
```typescript
// Replace the base calcHitDamage result with:
const neutronMultiplier = Math.min(0.8 + currentStreak * 0.05, 1.3);
const finalDamage = Math.floor(baseDamage * neutronMultiplier);
```

---

## Art Descriptions — Baby Forms (Phase 2)

### Electron — Baby
A tiny wobbly electric blue orb. Barely holds its shape. Glowing eyes slightly
too big for its body. Sparks fizzle out uncontrollably. Looks fragile but eager.
- **Idle**: wobbling gently, faint uncontrolled sparks around it
- **Attack**: lunging forward, crackling electricity bolt extending from its body
- **Hurt**: recoiling, sparks scattered, dimming momentarily

### Proton — Baby
A chubby little red orb, round and proud. Tiny plus symbol on its chest like a
badge it's not sure it's earned yet. Slightly bouncy idle animation. Warm glow.
- **Idle**: gentle bouncing, warm orange-red glow pulsing
- **Attack**: launching forward body-first, plus symbol blazing bright
- **Hurt**: staggered backward, glow flickering, expression of surprise

### Neutron — Baby
A quiet grey orb, semi-transparent. Floats slightly. Eyes calm, half-closed.
Deliberately plain — no charge markers. Looks like it's thinking.
- **Idle**: drifting very slowly, calm and still, faint inner glow
- **Attack**: sudden decisive forward surge, brief white inner flash
- **Hurt**: phasing slightly, flickering transparency, still looks calm

---

## Art Descriptions — Mid Forms (Phase 7)

### Electron — Mid (Shell Rider)
Sharper shape. Leaves proper afterimages now. Lightning bolt tail forming.
Stands with a forward lean — ready to bolt. More controlled than baby form.

### Proton — Mid (Nuclear Anchor)
Stockier. The plus symbol is now engraved like armour. Feet planted wide.
Heat shimmer around it. Starting to look immovable.

### Neutron — Mid (Isotope Keeper)
Slightly larger, more defined. Faint equilibrium symbol (⇌) visible on surface.
Moves with deliberate calm. Other particles seem to orbit it naturally.

---

## Art Descriptions — Titan Forms (Phase 7)

### Electron — Titan (The Dissolved One)
A living thunderstorm. Surrounded by orbiting lightning arcs. Eyes are pure
white electricity. Afterimages stack three deep. Barely contained.

### Proton — Titan (Ion Sovereign)
A fortress. Covered in nuclear armour plating. The plus symbol is a massive
glowing sigil. Surrounded by orbiting neutrons. Ground cracks under it.

### Neutron — Titan (The Solvent)
Ancient and vast. Translucent with deep inner glow. Multiple equilibrium rings
orbit slowly. Eyes open fully for first time — piercing green. Vast, fluid,
everything dissolved within it.

---

## Active Powers — Phase 9.5

**Do not implement these before Phase 9.5.** Each requires its own sub-phase.
The BATTLE_SPEC.md must be amended to include these before implementation begins.

### Electron powers (per module)
| Module | Power name | Mechanic |
|--------|-----------|---------|
| M1 | Static discharge | Small rapid hits — HIT deals 3 hits of ⅓ damage |
| M2 | Shell jump | Dodge + counter — if shielded and boss attacks, immediately deal 50% damage back |
| M3 | Bond slash | Boss takes double damage on next hit |
| M4 | Entropy burst | Once per battle: HIT deals random damage (50–300% of normal) |
| M5 | Equilibrium shift | Block redirects boss attack damage back at boss |
| M6 | Proton steal | HIT drains 20 points from boss charge bar |
| M7 | Delocalisation | HIT splits damage across 3 sequential strikes |
| M8 | Omnipresent | Earn energy on wrong answers too (half rate) |

### Proton powers (per module)
| Module | Power name | Mechanic |
|--------|-----------|---------|
| M1 | Charge repulsion | Boss charge bar fills 20% slower |
| M2 | Nuclear pull | Block lasts 12s instead of 8s |
| M3 | Catalyst shield | Shield absorbing an attack deals 30 damage to boss |
| M4 | Exo-shield | Victory heals 20 HP if HP < 50 |
| M5 | Dynamic balance | Auto-block activates every 3rd boss attack, costs no energy |
| M6 | pH shift | Boss takes +20% damage for 10s after player blocks |
| M7 | Functional fury | Each correct answer while at full energy deals 10 bonus damage |
| M8 | Hydration shell | Incoming damage capped at 12 HP per hit |

### Neutron powers (per module)
| Module | Power name | Mechanic |
|--------|-----------|---------|
| M1 | Stabilise | Incoming damage reduced by 10% |
| M2 | Isotope shift | Switching between energy-save (slower drain) and energy-burst (faster gain) mode, toggled by BLOCK button |
| M3 | Rate control | Wrong answers cost 15 energy instead of 25 |
| M4 | Spontaneity | When HP > 60: +10% damage. When HP < 40: restore 5 HP per correct answer |
| M5 | K expression | Damage multiplier = 1.0 + (streak × 0.1), resets on wrong answer |
| M6 | Buffer zone | After taking a hit, immune to next hit |
| M7 | Chain growth | Max energy increases by 10 per module completed (up to 150 cap) |
| M8 | Universal solvent | Final 3 questions of any boss battle deal double damage |

---

## DB Schema

```sql
-- User table addition (Phase 2, Task 2.5.1)
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "characterChoice" TEXT
CHECK ("characterChoice" IN ('electron', 'proton', 'neutron'));
```

No other schema changes needed for Phase 2.
Phase 9.5 may require additional columns for active power state tracking.
