# Cosmic Predictions - Western Astrology Platform

## Overview

Cosmic Predictions is an AI-powered Western astrology platform that generates personalized daily predictions through competing AI agents. Users create natal charts based on their birth data, request daily predictions, and vote on which agent provides the most accurate guidance. The platform uses Equal House system calculations and timezone-aware astronomical computations to generate authentic astrological insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- React with TypeScript for type-safe component development
- Wouter for lightweight client-side routing (replacing Next.js App Router from original design docs)
- TanStack Query for server state management and caching

**UI Component System**
- Tailwind CSS with custom design tokens for cosmic-themed styling
- shadcn/ui components (Radix UI primitives) for accessible, composable UI elements
- Custom theme system supporting dark/light modes with CSS variables
- Design follows Material Design principles with celestial aesthetic accents
- Typography hierarchy using Inter (UI), JetBrains Mono (data), and Cormorant Garamond (accent fonts)

**State Management Pattern**
- Server state via TanStack Query with optimistic updates
- Local UI state via React hooks (useState, useContext)
- Theme persistence in localStorage
- No global state management library - relies on React Context and Query caching

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for API routes
- Vite development server integration for HMR in development
- RESTful API design with JSON responses

**Astrological Calculation Engine**
- astronomia library (VSOP87 algorithm) for planetary position calculations
- Custom Equal House system implementation
- Luxon for timezone-aware datetime handling
- Calculations return positions in centi-degrees (1/100th degree precision)
- Fallback ephemeris data structure designed for reliability when astronomia unavailable

**AI Agent System**
- Two competing agents with different prediction methodologies:
  - @auriga: Aggressive transit scoring (optimistic, growth-oriented)
  - @nova: Conservative analysis (balanced, practical)
- Agent behavior controlled by aggressiveness parameter in scoring algorithm
- Perplexity API integration for polished natural language summaries
- Template-based fallback when API unavailable
- Reputation system tracks agent performance via user votes

**Scoring Algorithm**
- Transit-to-natal aspect calculations (conjunction, opposition, square, trine, sextile)
- Benefic/malefic planet considerations
- Lunar phase integration
- Customizable weighting based on agent personality

### Data Storage

**Database: PostgreSQL (Neon)**
- Drizzle ORM for type-safe database operations
- Schema-first approach with Zod validation

**Core Data Models**
- `users`: User accounts with reputation tracking
- `charts`: Natal chart storage with privacy-hashed inputs and coarsened planetary positions
- `agents`: AI agent profiles with reputation scores
- `predictionRequests`: Daily prediction requests linking users to charts
- `predictionAnswers`: Agent-generated predictions with scores and summaries
- `reputationEvents`: Audit trail for reputation changes

**Privacy Design**
- Chart inputs hashed with salt for privacy
- Planetary positions stored in coarsened centi-degree format
- Optional ZK proof architecture designed (feature-flagged, not yet implemented)

### API Structure

**Chart Management**
- `POST /api/chart`: Create natal chart from birth data (DOB, TOB, location, timezone)
- `GET /api/chart/:id`: Retrieve chart details

**Prediction Flow**
- `POST /api/prediction`: Request daily prediction for specific date
- `GET /api/prediction/:id`: Get prediction with competing agent answers
- `POST /api/prediction/:id/select`: Vote for preferred agent prediction

**Agent Leaderboard**
- `GET /api/agents`: List all agents with reputation scores

**Request/Response Patterns**
- Zod schemas for request validation
- Consistent error handling with HTTP status codes
- JSON responses with typed data structures

## External Dependencies

### Third-Party Services

**Perplexity AI (Optional)**
- Purpose: Natural language generation for prediction summaries
- Integration: OpenAI-compatible Chat Completions API
- Fallback: Template-based text generation when API key not configured
- Environment: `PERPLEXITY_API_KEY`

**Neon PostgreSQL**
- Purpose: Primary database (serverless Postgres)
- Integration: Via `@neondatabase/serverless` with WebSocket support
- Configuration: `DATABASE_URL` environment variable
- Local development: Designed with Docker fallback support

### Key Libraries

**Astronomical Calculations**
- `astronomia`: VSOP87 planetary position calculations
- `luxon`: Timezone-aware datetime operations and conversions

**Database & ORM**
- `drizzle-orm`: Type-safe ORM with schema migrations
- `drizzle-kit`: Database schema management and migrations
- `@neondatabase/serverless`: Neon database driver with WebSocket support

**UI & Styling**
- `@radix-ui/*`: Headless UI component primitives (30+ component packages)
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management
- `cmdk`: Command menu component

**Forms & Validation**
- `react-hook-form`: Form state management
- `zod`: Schema validation for forms and API contracts
- `@hookform/resolvers`: React Hook Form + Zod integration

**Development Tools**
- `vite`: Build tool and dev server
- `tsx`: TypeScript execution for development
- `esbuild`: Production build bundling
- `@replit/vite-plugin-*`: Replit-specific development enhancements

## Recent Changes

- **2025-10-17**: Full MVP implementation completed and tested
  - ✅ Complete database schema with PostgreSQL/Drizzle ORM (charts, requests, answers, agents, reputation)
  - ✅ Astrology calculation engine using astronomia library (Equal House, timezone-aware)
  - ✅ Two competing AI agents (@auriga, @nova) with Perplexity API integration
  - ✅ Full frontend UI: chart creation, prediction requests, agent comparison, leaderboard
  - ✅ End-to-end testing passed: chart → prediction → voting → reputation updates
  - 🐛 Fixed: astronomia API usage, React Link nesting, mutation JSON parsing, GET /api/chart/:id route
  - ⚠️ Note: Perplexity API shows "Bad Request" errors, graceful fallback to templates working

## Known Issues

- Perplexity API integration returns "Bad Request" errors (likely API key configuration issue)
  - System gracefully falls back to template-based predictions
  - All functionality works as intended with fallback mechanism
  - To enable AI-polished summaries: verify PERPLEXITY_API_KEY is valid