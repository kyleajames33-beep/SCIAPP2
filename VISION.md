# ChemQuest — Product Vision & End Goal

> This document defines where we are headed. Every build session should reference
> this before writing code. The spec files (BATTLE_SPEC.md etc.) define the HOW.
> This document defines the WHAT and WHY.

---

## The One-Line Pitch

> A Pokemon-style RPG where Australian HSC science students defeat boss monsters
> by answering curriculum questions — turning exam prep into something people
> actually want to play.

---

## The Full Vision (where this ends up)

A student opens ChemQuest on their phone or school laptop. They land in a world
that looks like a pixel-art overworld map — chemistry lab corridors, volcanic
reaction chambers, quantum energy fields. Their character (the Scientist) walks
the map, moving node to node. Each node is either a practice question, a bonus
challenge, a treasure chest, or a boss gate.

When they reach a boss gate, a dramatic battle screen opens. The boss — a
themed creature built around a chemistry concept (Acid Baron, Quantum Reaper,
Electron Tyrant) — faces their character. The student answers questions to build
energy, then chooses when to attack, when to block, when to spend their charge
on a big hit. The boss charges up on its own timer and fires back if they stall.

Defeat the boss and the module unlocks. Their rank ticks up (Hydrogen → Helium
→ Lithium). Coins and gems drop. A friend who just beat the same boss texts them
"finally got him". They go to the leaderboard and see they're rank 3 in their
school.

That's the end goal.

---

## Audience

### Phase 1 (now)
- HSC Year 11–12 Chemistry students (NSW, Australia)
- Ages 16–18
- Study context: after school, on phone, avoiding actual textbooks

### Phase 2
- All HSC science subjects: Biology, Physics, Earth & Environmental
- Same cohort, same formula, different content

### Phase 3
- Years 7–10 NSW science curriculum
- Younger audience = needs even more game feel, less text

### Never (out of scope permanently)
- Primary school
- Non-Australian curriculum (without a major content partnership)
- University level

---

## Monetization Strategy

### Phase 1: Free, no restrictions
Build the player base. Word of mouth. HSC students share things that help them.
No paywalls. No ads. Just build something good and let it spread.

### Phase 2: Freemium cosmetics
- Free: all curriculum content, all bosses, full game
- Paid: cosmetic character skins, boss themes, special rank badges, profile flair
- Price point: ~$5 one-time or $2/month — impulse buy territory for a student

### Phase 3: Institutional
- School/teacher dashboard: assign modules, track class progress, see who
  completed which boss
- Subscription per school (~$200–500/year per school, not per student)
- Teachers can create custom question sets for their specific class

### What we will NOT do
- Paywalling curriculum content
- Pay-to-win (buying more energy, HP, damage)
- Ads inside the game

---

## "Done" for Version 1 (current target)

V1 is complete when a student can:

1. Land on the site and immediately understand what to do
2. Walk the overworld map through **Module 1: Atomic Structure & Bonding**
3. Complete practice question nodes along the path
4. Reach the boss gate
5. Fight the boss using the **energy system** (answer questions → build energy →
   choose when to attack/block → boss charges and fires back)
6. Win or lose, see their rewards (XP, coins, rank progress)
7. See their rank badge update if they levelled up

That is one complete loop. Once that works, the formula repeats for every
subsequent module and subject.

### V1 is NOT
- Multiplayer
- Friends/social
- Teacher dashboard
- Mobile-optimised (desktop first)
- Auth (users can play as guests; progress only saves if logged in)

---

## Game Structure (full vision)

```
OVERWORLD MAP
│
├── Module 1: Atomic Structure
│   ├── Node: Practice question (atoms)
│   ├── Node: Practice question (bonding)
│   ├── Node: Bonus challenge (hard Q, extra coins)
│   ├── Node: Treasure chest (power-up drop)
│   ├── Node: Practice question (electron config)
│   └── BOSS GATE → The Acid Baron
│
├── Module 2: Chemical Reactions
│   ├── ... nodes ...
│   └── BOSS GATE → Plasma King
│
├── Module 3: Equilibrium
│   ├── ... nodes ...
│   └── BOSS GATE → Entropy Beast
│
└── [HSC Chemistry complete]
    → Unlock Biology world
    → Unlock Physics world
```

### Node types (V1 has basic nodes + boss gates)
| Node | V1 | Later |
|------|----|----|
| Practice question | ✅ | |
| Bonus hard question | | ✅ |
| Treasure chest (power-up) | | ✅ |
| NPC with hint/lore | | ✅ |
| Mini-boss (between main bosses) | | ✅ |
| Friend co-op gate | | ✅ |

---

## Boss Design (full set — Chemistry)

Each boss is a creature thematically linked to a chemistry concept.
Each has a unique charge speed, HP, and eventually a unique attack move.

| # | Boss Name       | Theme             | HP   | Charge Time |
|---|-----------------|-------------------|------|-------------|
| 1 | The Acid Baron  | Acids & Bases     | 800  | 20s         |
| 2 | Plasma King     | States of Matter  | 1000 | 17s         |
| 3 | Entropy Beast   | Thermodynamics    | 1200 | 14s         |
| 4 | Electron Tyrant | Electrochemistry  | 1400 | 12s         |
| 5 | Covalent Crusher| Bonding           | 1600 | 10s         |
| 6 | Quantum Reaper  | Atomic Structure  | 1800 | 9s          |
| 7 | The Equilibrium | Reaction Kinetics | 2000 | 8s          |

Each boss needs:
- Sprite sheet (idle, attack, hurt — 4 frames each)
- Unique themeColor for arena lighting
- Custom particle colours on hit
- Unique attack name (cosmetic only in V1)

---

## Progression & Economy

### XP & Ranks
Element-based rank names. Students recognise these from chemistry.
```
Hydrogen  (0 XP)    →  Helium    (200)   →  Lithium   (500)
Beryllium (1000)    →  Boron     (2000)  →  Carbon    (3500)
Nitrogen  (5500)    →  Oxygen    (8000)
```
Rank badge shows on profile, leaderboard, and next to username.

### Coins & Gems
- Coins: earned every battle, spent in the shop on power-ups
- Gems: rare drops, spent on cosmetics (later)
- Neither can be bought with real money in V1

### Power-ups (purchased with coins before a battle)
- Extra Time (boss charges slower for one round)
- Hint (eliminate 2 wrong answers)
- Shield (absorb one boss attack for free)

---

## Visual Direction

### Style
Pixel art. Dark background (#0a0a14). Neon accent colours per module.
Think: a science lab that got possessed by a video game.

### Characters
- **Hero**: Scientist — lab coat, goggles, spiky hair, throws chemical flasks
- **Bosses**: Chemistry concepts made monstrous — atoms with faces, acid drops
  with teeth, molecules with arms. Each unique sprite sheet.

### Arena
For V1: dark background with floating particles matching boss theme colour.
Eventually: unique environment per boss (volcano for thermodynamics, underwater
for electrochemistry, etc.)

### UI
- HP bars: thick, retro, colour-coded (green → orange → red as HP drops)
- Energy bar: glowing blue/green below player sprite
- Boss charge bar: red/orange above boss, labelled "CHARGING ▶"
- All damage numbers: floating yellow with black stroke, animated up

---

## Technical Architecture

```
Next.js 14 (App Router)
  ├── /app/campaign          → overworld map
  ├── /app/campaign/boss     → boss battle (Phaser scene + React UI)
  ├── /app/hub               → profile, leaderboard, shop (later)
  └── /app/api               → questions, progress, auth, attempt

Supabase
  ├── User                   → XP, coins, gems, rank, stats
  ├── CampaignProgress       → which nodes completed
  ├── BossAttempt            → battle history
  ├── Question               → question bank
  └── LeaderboardEntry       → cached scores

Phaser 3 (embedded in battle page)
  → handles sprite animation, tweens, particles
  → communicates with React via onReady callback + event calls

Vercel (deployment)
  → auto-deploy from main branch
```

### Key technical constraints
- Phaser must be dynamically imported (SSR = false) — browser only
- All hooks must be called before any conditional returns
- Supabase uses service role key server-side, anon key client-side
- Auth is intentionally deferred — guest play works, saving requires login

---

## Multiplayer Roadmap (future phases)

### Phase A: Leaderboards (async social)
- Global and per-school leaderboards
- "Your friend just beat Plasma King" notifications
- Share rank badge as image

### Phase B: Race mode
- Two students fight the same boss simultaneously
- Questions are identical, energy bars visible to both
- First to kill the boss wins a bonus reward

### Phase C: Co-op
- Two students share one HP bar against a boss with double HP
- Both answer questions, energy pools together
- Requires real-time sync (Supabase Realtime or websockets)

### Phase D: PvP
- Students fight each other
- One plays boss, one plays hero (or both play heroes against shared boss)
- Most complex — requires matchmaking

---

## What "done" looks like at each phase

| Phase | Milestone |
|-------|-----------|
| V1 | 1 chemistry module, energy battle system, guest play works |
| V2 | Auth, save progress, leaderboard, full HSC chemistry |
| V3 | HSC Biology + Physics worlds, cosmetics shop |
| V4 | Teacher dashboard, class assignment, progress tracking |
| V5 | Years 7–10 content, mobile-optimised UI |
| V6 | Multiplayer (race mode), friend system |

---

## What NOT to build (ever)

- Ads inside the gameplay
- Pay-to-win mechanics
- Non-curriculum content (random trivia, etc.)
- Desktop app / Electron wrapper (web is fine)
- Native mobile app (responsive web is sufficient)

---

*Last updated: session where energy system was specced (BATTLE_SPEC.md)*
*Next session: implement energy system per BATTLE_SPEC.md*
