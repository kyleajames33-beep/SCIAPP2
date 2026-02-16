# Changelog

All notable changes to the ChemQuest project are documented here.

## [Phase 5] - Boss Battle Enhancements

### Added
- **Intent System**: Bosses now telegraph their next action before executing
  - Attack intents show damage preview
  - Defend intents indicate damage reduction
  - Special/Debuff intents warn of incoming status effects
  - `BossIntentDisplay` component for visual feedback

- **Status Effects System**: Players can now be affected by boss debuffs
  - **Corrosion**: Reduces player damage output
  - **Burn**: Deals damage over time each turn
  - **Stun**: Temporarily reduces energy/actions
  - `StatusEffectsBar` shows active effects with turn counters
  - `StatusEffectOverlay` provides full-screen visual effects

- **Elemental Particle Animations**: Chemistry-themed visual effects
  - Acid-Base: Bubbling particles
  - Redox: Electron transfer effects
  - Organic: Carbon chain animations
  - Equilibrium: Balanced oscillating particles
  - Thermochemistry: Heat wave effects
  - `ElementalParticles` component with multiple animation patterns

- **Enhanced Battle Arena**: Upgraded visual battle experience
  - Dynamic backgrounds based on boss phase
  - Phase transition animations ("ENRAGED", "FINAL FORM")
  - Critical hit flash effects
  - Player sprite reactions to actions
  - Screen shake effects for impacts

- **Boss Special Abilities**: Unique moves per boss with cooldowns
  - Each boss has 3-4 special moves with different effects
  - Moves go on cooldown after use
  - Phase-based AI selects appropriate moves

- **Critical Hit System**: Chance for bonus damage on correct answers

### Changed
- Refactored `quiz-game.tsx` to integrate new boss battle mechanics
- Boss battle state management now uses dedicated types from `boss-battle-types.ts`
- Damage calculation accounts for status effects and boss defense

### Technical
- Added `lib/boss-battle-types.ts` with comprehensive type definitions
- Extended `globals.css` with new animation keyframes
- Updated component exports in `app/game/_components/index.ts`

---

## [Phase 4] - Two-Screen Battle System

### Added
- **Dual Screen Layout**: Separated battle visualization from question interface
  - Left panel: Battle arena with character sprites and HP bars
  - Right panel: Question card with answer options

- **Battle Arena Component**: Visual representation of combat
  - Player and boss/guardian sprites
  - Health bars with smooth animations
  - Attack and damage animations
  - Distance indicator showing combat progress

- **Combat Effects**: Visual feedback for gameplay actions
  - Hit animations on correct answers
  - Miss effects on incorrect answers
  - Streak multiplier displays
  - Coin collection animations

### Changed
- Restructured game UI layout for better engagement
- Improved responsive design for various screen sizes

---

## [Phase 3] - Guardian Battles and Question Integration

### Added
- **Guardian System**: NPCs that guard campaign nodes
  - Each guardian has unique stats and themes
  - Guardians tied to specific chemistry topics
  - `guardians.json` data file for guardian definitions

- **Question Bank Integration**: HSC Chemistry questions
  - Questions categorized by topic and difficulty
  - Support for multiple choice format
  - Correct/incorrect answer tracking

- **Battle Logic**: Turn-based combat mechanics
  - Player attacks by answering correctly
  - Guardians have HP that decreases on hits
  - Victory rewards coins and progression

### Changed
- Campaign nodes now reference specific guardians
- Game sessions track question performance

---

## [Phase 2] - Campaign System and Progression

### Added
- **Campaign Structure**: Multi-realm progression system
  - Realms represent major chemistry topics
  - Each realm contains multiple zones
  - Zones have nodes (battles, rewards, checkpoints)
  - `campaign.json` defines full campaign structure

- **Progression Mechanics**:
  - Unlock system for nodes and zones
  - Save progress between sessions
  - Coin and gem rewards

- **User Progression Tracking**: Database models for progress
  - `UserProgress` model tracks completed nodes
  - Achievement tracking foundation

### Changed
- Extended Prisma schema with progression models
- Added campaign-related API endpoints

---

## [Phase 1] - Initial Project Setup and Core Structure

### Added
- **Project Foundation**:
  - Next.js 14 with App Router
  - TypeScript configuration
  - Tailwind CSS with custom theme
  - shadcn/ui component library

- **Authentication System**:
  - User registration and login
  - JWT-based session management
  - Role-based access (student, teacher, admin)
  - Password hashing with bcrypt

- **Database Setup**:
  - PostgreSQL with Prisma ORM
  - User model with stats tracking
  - Game session model
  - Question and QuestionSet models

- **Core Features**:
  - User profiles with stats display
  - Basic leaderboard system
  - Character customization (body type, hair, weapons)
  - Coin and gem currency system

- **Teacher Tools**:
  - Question set management
  - Bulk question import
  - Basic analytics

- **Multiplayer Foundation**:
  - Room creation and joining
  - Real-time updates via SSE
  - Competitive quiz mode

### Technical
- Configured ESLint and Prettier
- Set up project directory structure
- Created reusable UI components
- Implemented API route handlers

---

## Development Notes

### Running Migrations
After pulling changes, always run:
```bash
npx prisma migrate dev
npx prisma generate
```

### Data Files
Game data is stored in `/data/` directory:
- `campaign.json` - Campaign structure
- `bosses.json` - Boss definitions with special moves
- `guardians.json` - Guardian configurations

### Environment
See `.env.example` for required environment variables.
