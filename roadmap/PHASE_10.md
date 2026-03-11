# Phase 10 — Years 7–10, Full Multiplayer, Monetisation Live
## "The Complete Product"

> This is the final phase. When Phase 10 is complete, the product matches VISION.md.
> Phase 9 finished: full HSC science suite, teacher dashboard, school subscriptions,
> friend system, leaderboards, race mode, cosmetics shop.

---

## What Phase 9 left us with

- All 4 HSC science subjects playable (Chemistry, Biology, Physics, Earth & Env)
- Teacher dashboard: assign modules, track class, custom questions
- School subscription model live and billing
- Async leaderboards + friend system
- Race mode: 2 students fight the same boss simultaneously
- Cosmetics shop: skins, boss themes, rank badges
- Freemium model working (free game, paid cosmetics)
- Auth fully implemented
- Mobile-responsive UI

---

## Phase 10 Goals

1. Years 7–10 NSW science curriculum — full content and world
2. Co-op mode (2 students share HP bar vs buffed boss)
3. PvP mode (students fight each other)
4. Advanced teacher tools (cohort analytics, exam mode)
5. Full mobile optimisation (not just responsive — touch-native)
6. Platform hardening: performance, scale, security audit
7. Monetisation maturity: school billing, cosmetics catalogue complete

---

## 1. Years 7–10 Content

### Curriculum scope
Four year levels × multiple topics each. NSW Science syllabus.

| Year | Topics (examples) |
|------|-------------------|
| 7    | Properties of matter, Classification of living things, Earth & Space |
| 8    | Chemical change, Forces & motion, Ecosystems |
| 9    | Chemical reactions, Energy transfer, Body systems |
| 10   | Atomic theory intro, Evolution, Motion & forces advanced |

### What needs building
- **Question bank**: 20–30 questions per topic minimum. Each question needs:
  - Question text
  - 4 options (A/B/C/D)
  - Correct answer index
  - Explanation
  - Topic tag
  - Year level tag
  - Difficulty (1–3)
- **Boss sprites**: 1 unique boss per year level per subject = ~16 new sprite sheets
  (can share attack/hurt animation structure, unique idle + colour palette per boss)
- **Overworld maps**: 4 new world maps (Year 7, 8, 9, 10 science)
  - Each map: 3–5 modules, each module: 5–8 nodes + boss gate
- **Boss configs**: add to `bosses.json` with `chargeTime`, `themeColor`,
  `particleColors`, `yearLevel`, `subject`

### Database changes
- Add `yearLevel` column to `Question` table (nullable for HSC content)
- Add `subject` column to `Question` (chemistry / biology / physics / earth / science)
- Add `CurriculumWorld` table: `{ id, name, yearLevel, subject, mapConfig }`
- Teacher dashboard filter by year level

### Content pipeline
- Questions authored by: curriculum-aligned AI generation + teacher review
- Each question set must pass accuracy review before going live
- Flag system: students can report incorrect questions

---

## 2. Co-op Mode

Two students fight a boss together. Shared HP bar. Boss has 2× HP.

### Game logic
- Session created by Player 1, Player 2 joins via code or friend invite
- Both see the same question simultaneously
- Both answer independently — if BOTH get it right: +energy to shared pool
- If only one gets it right: +half energy
- If both wrong: −energy AND wrong-streak counter ticks for both
- Hit and Block buttons: either player can press, first press wins
- Boss attacks: hits shared HP bar
- Win: boss HP = 0. Lose: shared HP = 0

### Technical requirements
- Real-time sync: Supabase Realtime (existing) or WebSocket
- Shared game state: `CoopSession` table
  - `{ id, player1Id, player2Id, bossId, sharedHp, bossCharge, playerEnergy,
     currentQuestionId, status, createdAt }`
- Both clients subscribe to session changes
- Answer submission: both must answer before energy is resolved (or 10s timeout)
- Latency tolerance: up to 2s delay is acceptable (answer timeout handles it)

### UI changes
- Battle arena: two player sprites side-by-side (left + right of center)
- Question panel: shows both players' answer status (waiting / answered)
- "Partner answered!" indicator when co-player submits before you
- Shared HP bar labeled "Team HP"
- Co-op reward multiplier: +20% XP and coins vs solo

### Matchmaking
- V1 co-op: invite by friend or share a 6-digit code
- V2 co-op (later): auto-match with a student at similar rank
- No ranked co-op in Phase 10 — casual only

---

## 3. PvP Mode

Two students fight each other. One is the Hero, one is the Boss (or both fight
a shared boss and whoever kills it wins — simpler to build).

### Recommended approach for Phase 10: "Race PvP"
Both students fight the SAME boss independently. First to kill it wins.
Opponent's HP bar is shown as a ghost bar in the arena.
- See opponent's boss HP in real-time — creates urgency
- Answer faster and more accurately to win
- No direct interaction (simpler to build, less latency-sensitive)

### Full asymmetric PvP (stretch goal, may slip to post-Phase 10)
One student plays Hero, the other plays the Boss.
- Boss player answers questions to charge attacks faster
- Hero player answers to build energy and attack
- Boss player can choose WHEN to fire (not just on timer)
- Harder to balance, harder to build — flag as aspirational

### Technical requirements (Race PvP)
- Extend `CoopSession` schema or create `PvpSession` table
- Both clients' boss HP tracked independently server-side
- Broadcast opponent HP updates via Supabase Realtime
- Win condition: first `bossHp <= 0` message to server wins
- Reward: winner gets 2× coins, both get XP

### Matchmaking
- Ranked: ELO-style rating per subject
- Unranked: casual queue with no rating change
- Friend challenge: direct invite

---

## 4. Advanced Teacher Tools

Phase 7 built the basic dashboard. Phase 10 completes it.

### Cohort analytics
- Class performance heatmap: question topic × accuracy %
- "Most missed questions" — ranked list, teacher can add to custom set
- Student comparison: anonymous ranking within class
- Progress over time: graph of XP / boss defeats per student per week

### Exam mode
- Teacher creates a timed "exam session"
- Students join with a class code
- Questions are fixed (teacher-selected or auto-generated from topic)
- No power-ups, no energy system — just answer questions, scored at end
- Teacher sees live results as students submit
- Exportable report (CSV) after session ends

### Assignment system
- Teacher assigns: "Complete Module 2 before Friday"
- Students see assignment banner on their campaign map
- Completion tracked, teacher notified
- Overdue: badge appears on student's map

### Custom question sets (upgrade from Phase 7)
- Phase 7: teacher can create questions
- Phase 10: teacher can import questions from CSV template
- Question approval workflow: teacher-created Qs flagged for review before
  going live to other schools (to prevent bad content spreading)

---

## 5. Full Mobile Optimisation

Currently: responsive web (works on mobile, not optimised for it).
Phase 10: touch-native feel.

### Key changes
- Battle arena: sprites scale to fill mobile screen (portrait mode priority)
- Hit and Block buttons: large touch targets (min 56px), thumb-accessible
- Question answers: full-width tap targets, no hover states
- Campaign map: pinch-to-zoom on the overworld, swipe to scroll
- Keyboard: virtual keyboard doesn't push up the battle arena
- Performance: 60fps on mid-range Android (Samsung A-series)

### Testing requirements
- Test on: iPhone SE (small), iPhone 14, Samsung Galaxy A54, iPad
- Lighthouse mobile score ≥ 85
- No content overflow at 320px viewport width
- Touch events tested (no mouse-only interactions)

### PWA (Progressive Web App)
- Add web app manifest
- "Add to Home Screen" prompt after 3rd session
- Offline: campaign map loads, questions cached for current module
- Push notifications: "Your friend just beat the boss!" (opt-in)

---

## 6. Platform Hardening

### Performance
- Phaser bundle lazy-loaded — current approach is correct, verify chunk size < 400kb
- Question images (if any added) served via Vercel CDN
- Supabase queries: add indexes on `Question.topic`, `Question.subject`,
  `Question.yearLevel`, `BossAttempt.userId`, `CampaignProgress.userId`
- Boss battle page: measure and optimise time-to-interactive
  (target: < 2s on 4G mobile)

### Security audit
- All API routes: verify auth checks, no unauthenticated write access
- Service role key: confirm never exposed client-side
- Rate limiting on `/api/campaign/boss/attempt` (max 30 submissions/min per user)
- Input validation: all user-submitted fields sanitised
- CORS: lock Supabase to production domain only

### Scalability
- Supabase plan review: confirm row limits and concurrent connection limits
  handle 1000+ simultaneous users
- Vercel: confirm serverless function timeout is sufficient for complex queries
- Real-time: Supabase Realtime channel limits for co-op/PvP sessions
- Load test: simulate 500 concurrent boss battles

### Error monitoring
- Add Sentry (or similar) for frontend error tracking
- Alert on error spike (> 10 errors/min)
- Log all failed boss attempt submissions to a separate table for debugging

---

## 7. Monetisation Maturity

### Cosmetics catalogue (complete)
Phase 6 launched the shop. Phase 10 fills it out.

| Category | Items |
|----------|-------|
| Character skins | 8 hero variants (lab themes, seasonal) |
| Boss themes | Reskin boss colour palette (e.g. gold Acid Baron) |
| Rank badges | Animated versions of element rank badges |
| Battle backgrounds | Unique arena environments per purchase |
| Sound packs | Retro 8-bit vs modern synth |

All cosmetics: gems only (no real money directly). Gems earnable in-game
or purchasable. This keeps it ethical for students.

### Gem packs (if freemium live)
- 100 gems: $1.99
- 500 gems: $7.99
- 1200 gems: $14.99
- School pack: bulk gems for teacher to distribute to class as rewards

### School billing
- Stripe integration for school subscriptions
- Invoice-based billing (schools won't use credit cards — they need invoices)
- Annual plan only (schools budget annually)
- Pricing tiers:
  - Small school (< 200 students): $299/year
  - Medium (200–1000): $599/year
  - Large (1000+): custom

### Analytics dashboard (internal)
- Revenue per month, churn, new schools, active students
- Top played modules, most failed bosses (content quality signal)
- Cohort retention (do students come back after first session?)

---

## Done Criteria for Phase 10

Phase 10 is complete when ALL of the following are true:

- [ ] Years 7–10 content live: all 4 year levels, all science topics, questions reviewed
- [ ] Co-op mode: 2 players can complete a boss battle together, results save correctly
- [ ] Race PvP: 2 players can race the same boss, winner determined and rewarded
- [ ] Teacher exam mode: teacher can create, run, and export a timed exam session
- [ ] Cohort analytics: teacher can see class performance heatmap and missed questions
- [ ] Mobile: battle and campaign map feel native on iPhone and Android, PWA installable
- [ ] Performance: < 2s time-to-interactive on 4G mobile
- [ ] Security audit passed: no critical or high vulnerabilities
- [ ] Cosmetics shop: minimum 20 purchasable items across all categories
- [ ] Gem purchase flow: works end-to-end (purchase → gems added → spend in shop)
- [ ] School billing: invoice flow tested with at least 2 real school accounts
- [ ] Error monitoring: Sentry live, alerting configured
- [ ] Load tested: 500 concurrent users without degradation

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Co-op real-time sync is too laggy on mobile | Medium | Build with 2s timeout buffer; degrade gracefully to "one player answered" |
| Years 7-10 question quality is poor from AI | High | Never publish without human curriculum review; build flagging system early |
| PvP balancing takes forever | High | Ship Race PvP only; asymmetric PvP is post-Phase 10 |
| School invoicing is complex | Medium | Use Stripe's invoice module; don't build custom billing |
| Mobile 60fps fails on low-end Android | Medium | Profile early, consider disabling Phaser particles on mobile |
| Sentry adds bundle size | Low | Use lazy import, only load in production |

---

## What comes AFTER Phase 10

Phase 10 completes the VISION.md. Post-Phase 10 (not planned yet):
- Asymmetric PvP (Hero vs Boss player)
- International curriculum (UK GCSE, US Common Core)
- Native iOS/Android apps
- AI-generated personalised question difficulty
- Classroom competition events (tournament brackets)

---

*Previous phase: PHASE_09.md*
*Vision: VISION.md*
*This is the final phase.*
