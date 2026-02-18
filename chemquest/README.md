# ChemQuest - HSC Chemistry Educational Game

ChemQuest is an interactive educational game designed to help HSC (Higher School Certificate) Chemistry students learn and practice key concepts through engaging gameplay mechanics. Battle guardians, defeat bosses, and master chemistry topics through a campaign-based progression system.

## Features

### Core Gameplay
- **Campaign Mode**: Progress through themed realms, each focusing on different HSC Chemistry modules
- **Guardian Battles**: Face chemistry-themed guardians with unique abilities
- **Boss Battles**: Epic encounters with enhanced mechanics including:
  - Intent system showing upcoming boss actions
  - Status effects (Burn, Corrosion, Stun)
  - Elemental particle animations
  - Phase transitions with increasing difficulty
  - Critical hit mechanics

### Progression System
- Earn coins and gems through gameplay
- Unlock character customizations (body types, hair colors, weapons)
- Prestige system for dedicated players
- Daily challenges for bonus rewards

### Educational Content
- Questions aligned with HSC Chemistry curriculum
- Multiple chemistry topics: Acid-Base, Redox, Organic, Equilibrium, and more
- Immediate feedback on answers

### Multiplayer
- Real-time multiplayer quiz battles
- Leaderboards and competitive play

### Teacher Tools
- Custom question set creation
- Student analytics dashboard
- Bulk question import

## Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **PostgreSQL** 14.x or higher

## Setup Instructions

### 1. Clone or Extract the Project

```bash
# If using git
git clone <repository-url>
cd chemquest

# Or extract from zip
unzip chemquest-phase5-complete.zip
cd chemquest
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your database connection string and other settings.

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
chemquest/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── auth/          # Authentication routes
│   │   ├── game/          # Game logic endpoints
│   │   ├── multiplayer/   # Real-time multiplayer
│   │   ├── questions/     # Question management
│   │   └── teacher/       # Teacher tools
│   ├── game/              # Game UI components
│   │   └── _components/   # Battle arena, effects, quiz components
│   ├── profile/           # User profile page
│   ├── leaderboard/       # Leaderboards
│   └── admin/             # Admin tools
├── components/            # Shared UI components (shadcn/ui)
├── data/                  # Static game data
│   ├── bosses.json        # Boss configurations
│   ├── campaign.json      # Campaign structure
│   └── guardians.json     # Guardian definitions
├── lib/                   # Utility functions and types
│   ├── auth.ts            # Authentication helpers
│   ├── boss-battle-types.ts # Boss battle logic
│   └── utils.ts           # General utilities
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Prisma schema
│   └── migrations/        # Database migrations
├── public/                # Static assets (images, sounds)
├── scripts/               # Utility scripts (seeding)
└── hooks/                 # Custom React hooks
```

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Animations** | Framer Motion |
| **Authentication** | Custom JWT-based auth |
| **Real-time** | Server-Sent Events (SSE) |
| **Icons** | Lucide React |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |

## License

This project is for educational purposes.

---

**ChemQuest** - Making HSC Chemistry fun and engaging! 🧪⚔️

<!-- Deployment trigger: 2026-02-18T07:49:41Z -->
