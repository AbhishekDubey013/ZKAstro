# Cosmic Predictions - Western Astrology Daily Prediction Platform

An AI-powered Western astrology platform where users create natal charts and receive daily predictions from competing AI agents.

## Features

- **Natal Chart Generation**: Create Western Equal-house charts from birth date, time, and location
- **AI-Powered Predictions**: Two competing astrology agents analyze daily transits and provide predictions
- **Reputation System**: Users vote on the best prediction, building agent reputation over time
- **Agent Leaderboard**: Track the most trusted and accurate astrology agents
- **Dark/Light Mode**: Beautiful cosmic-themed UI that works in both modes
- **Timezone-Aware**: All calculations properly handle timezones using Luxon

## Tech Stack

- **Frontend**: React + TypeScript + Wouter routing + TanStack Query
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Astrology Engine**: astronomia library (VSOP87) for planetary calculations
- **AI**: Perplexity API for polished prediction summaries
- **UI**: Tailwind CSS + shadcn/ui components
- **Fonts**: Inter (UI), JetBrains Mono (data), Cormorant Garamond (accent)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- Perplexity API key (optional - works without it using template text)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   DATABASE_URL="your_neon_postgres_connection_string"
   PERPLEXITY_API_KEY="your_perplexity_api_key" # optional
   ```

4. Push database schema:
   ```bash
   npm run db:push
   ```

5. Seed the database with initial agents:
   ```bash
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open your browser to `http://localhost:5000`

## How It Works

### 1. Create Your Natal Chart

Enter your birth date, time, and location. The system:
- Computes planetary positions using VSOP87 astronomical algorithms
- Calculates Equal house cusps (each house is exactly 30°)
- Stores coarsened positions (0.01° precision) for privacy
- Handles all timezone conversions using IANA timezone database

### 2. Request a Daily Prediction

Select a target date (default: today). The system:
- Selects 2 active agents using weighted random sampling (weight = 1 + reputation)
- Each agent analyzes daily transits:
  - Beneficial aspects (Jupiter/Venus to natal points): +3 points
  - Harmonious aspects (Sun/Moon to natal points): +2 points
  - Hard aspects (Mars/Saturn squares/oppositions): -3 points
  - Mercury retrograde: -2 points
  - Lunar phase (waxing/waning): ±1 point
- Generates prediction summaries using Perplexity API (or templates)
- Returns day score (0-100), summary, highlights, and cosmic factors

### 3. Choose the Best Prediction

Compare the two agent predictions side-by-side:
- View day scores with visual progress circles
- Read AI-generated summaries and highlights
- See specific astrological factors (aspects, retrogrades)
- Select the prediction that resonates most

### 4. Agent Reputation Grows

When you select a prediction:
- The chosen agent gains +1 reputation
- A reputation event is recorded for transparency
- The leaderboard updates to reflect new rankings

## API Endpoints

- `POST /api/chart` - Create a new natal chart
- `POST /api/request` - Request daily predictions
- `GET /api/request/:id` - Get prediction details
- `POST /api/request/:id/select` - Select winning prediction
- `GET /api/agents` - List all agents with reputation

## Project Structure

```
/
├── client/               # Frontend React app
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Client utilities
├── server/               # Backend Express server
│   ├── routes.ts         # API route handlers
│   ├── storage.ts        # Database interface
│   └── db.ts             # Drizzle client
├── shared/
│   └── schema.ts         # Shared types and schemas
└── lib/                  # Shared utilities
    ├── astro/            # Astronomy calculations
    └── agents/           # Agent implementations
```

## Astrology Engine

The platform uses:
- **Tropical Zodiac**: Traditional Western system
- **Equal House System**: Each house is exactly 30° from the Ascendant
- **Planetary Bodies**: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn
- **Aspects**: Conjunction, Opposition, Square (6° orb), Trine (4° orb), Sextile (3° orb)
- **Retrograde Tracking**: Notes retrograde planets in natal and transit charts

## Agent System

Two built-in agents with different approaches:

### @auriga
- **Method**: Aggressive Transit Scoring
- **Focus**: Strong emphasis on benefic aspects
- **Personality**: Optimistic, growth-oriented predictions

### @nova
- **Method**: Conservative Transit Analysis
- **Focus**: Balanced assessment with caution on malefics
- **Personality**: Measured, practical guidance

Both agents use the same astronomical data but weight factors differently, providing users with varied perspectives.

## ZK-Proof Support (Feature-Flagged)

The platform includes optional zero-knowledge proof capabilities:
- Set `ZK_ENABLED=true` to enable
- Requires additional setup: ephemeris commitments, on-chain verifier contract
- See spec document for full ZK implementation details

## Development

```bash
# Run development server
npm run dev

# Push database schema changes
npm run db:push

# Seed database
npm run db:seed

# Run tests (when implemented)
npm test
```

## Privacy

- Birth data is hashed with a random salt before storage
- Planetary positions are coarsened to 0.01° precision
- User email is optional (anonymous sessions supported)
- Chart data can optionally be published on-chain with ZK proofs

## License

MIT

## Credits

Built with love for astrology enthusiasts and AI explorers.
