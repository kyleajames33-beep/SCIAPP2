# Boss Battle — Energy System Spec

> Reference document for implementing the real-time energy battle system.
> All future sessions should read this before touching battle code.

---

## What stays the same

- Question panel UI (text, answer buttons, A/B/C/D layout)
- Boss HP bar + player HP bar
- Phaser animations (idle, attack, hurt already wired)
- Supabase saving on battle end
- Campaign map, rank system, rewards
- Power-ups (hint, shield, extra time)

---

## What changes

Replace the per-question-damage turn loop with an energy accumulation system.
The player now **chooses when to attack** rather than every correct answer = instant damage.

---

## 1. Player Energy Bar

- Sits in the battle arena, above the player sprite
- Range: 0–100
- Visual: glowing green/blue fill bar that pulses when full

### Gaining energy (streak-scaled)
Each correct answer adds energy based on current streak:

| Streak | Energy gained |
|--------|--------------|
| 1      | +15          |
| 2      | +22          |
| 3      | +30          |
| 4      | +38          |
| 5+     | +45 (cap)    |

> Rationale: Rewards consistency. A 5-streak is roughly 2× more valuable than grinding singles.

### Losing energy (wrong answers)
- **1st or 2nd wrong answer:** −25 energy (minimum 0), streak resets
- **3rd wrong answer in a row:** −25 energy AND boss fires an immediate attack (see §3)
- Wrong-answer counter resets on any correct answer

---

## 2. Hit Button (Attack)

**Available at all times.** Damage scales with current energy — saving up pays off.

### Damage formula
```
damage = floor(energy × scalingFactor)

scalingFactor:
  0–39 energy  →  ×1.0   (e.g. 30 energy = 30 dmg)
  40–69 energy →  ×1.5   (e.g. 60 energy = 90 dmg)
  70–99 energy →  ×2.0   (e.g. 80 energy = 160 dmg)
  100 energy   →  ×2.5   (100 energy = 250 dmg — max single hit)
```

After hitting: energy resets to 0.

### Charge shot (hold to hit bigger)
- Player can **hold** the Hit button to charge up
- Holding adds a visual "charge ring" expanding around the player
- The charge itself does NOT increase damage — it just signals intent
- If the player answers **wrong while holding**: energy resets to 0, charge cancelled
- If the player **releases** the button: executes the hit at current energy
- This creates the core risk/reward tension: answer carefully while charged

> The hold mechanic is visual/psychological, not mechanical — it signals to the player
> "I'm committed, don't mess up this answer."

---

## 3. Boss Charge Bar

Sits above the boss sprite. Fills on a timer. When full → boss attacks → resets.

### Charge speed per boss (seconds to 100%)

| Boss # | Name example      | Charge time |
|--------|-------------------|-------------|
| 1      | Atom Lord         | 20s         |
| 2      | Acid Baron        | 17s         |
| 3      | Plasma King       | 14s         |
| 4      | Electron Tyrant   | 12s         |
| 5      | Covalent Crusher  | 10s         |
| 6      | Entropy Beast     | 9s          |
| 7      | Quantum Reaper    | 8s          |

> Charge time is set in `bosses.json` as `chargeTime` (seconds). Defaults to 15s if missing.

### Boss attack
When charge reaches 100%:
1. Boss plays **attack animation** (Phaser: frames 4–7)
2. Player takes damage: `floor(boss.maxHp × 0.08)` — 8% of boss max HP
3. Player plays **hurt animation**
4. Screen flash red
5. Boss charge resets to 0

---

## 4. Block Button

**Costs 40 energy.** Completely absorbs the next boss attack.

- Block button is only enabled when player energy ≥ 40
- Pressing Block: deducts 40 energy, activates a shield (blue glow on player)
- When boss next fires: attack is fully absorbed, no player damage
- Shield expires after absorbing one hit OR after 8 seconds (so it can't be pre-stacked forever)
- Cooldown: 5 seconds after shield expires before Block can be used again

---

## 5. Win / Lose Conditions

**Win:** Boss HP reaches 0 → victory screen, rewards, Supabase save.

**Lose:** Two options (decide before build):
- Option A: Player has a HP bar, boss attacks deplete it, 0 HP = defeat
- Option B: Run out of questions without killing boss = defeat

> Recommendation: **Option A** — a visible HP bar makes the threat feel real.
> Player starts at 100 HP. Each boss attack hits for 8% of boss maxHp.
> Boss 1 (1000 HP) → 80 damage per attack. Player survives ~1–2 unblocked hits.
> This makes Block feel critical on harder bosses.

---

## 6. State shape (reference for implementation)

```typescript
// New states to add to page.tsx
playerEnergy: number          // 0–100
playerHp: number              // 0–100 (starts 100)
bossCharge: number            // 0–100 (fills on interval)
wrongStreak: number           // resets on correct answer
shieldActive: boolean         // true when Block used, pending boss attack
shieldCooldown: boolean       // true during 5s cooldown after shield expires
isCharging: boolean           // true while Hit button held
chargeRingScale: number       // visual only, 1→2 while holding

// Timers
bossChargeIntervalRef         // setInterval filling bossCharge
shieldExpiryTimerRef          // setTimeout to expire unused shield
```

---

## 7. UI layout changes

**Arena (top half):**
- Add player energy bar (below player sprite, green fill)
- Add boss charge bar (below boss HP, red/orange fill with "CHARGING" label)
- Remove the per-question timer countdown

**Question panel (bottom half):**
- Add Hit button and Block button in the power-up row
- Hit button: always visible, dim when 0 energy, brighter as energy fills
- Block button: greyed out when < 40 energy or on cooldown

---

## 8. Out of scope for this build

- Environments / backgrounds per boss (add later)
- Multiple boss attack types (add later)
- PvP / multiplayer (separate project)
- Auth system (intentionally deferred)
