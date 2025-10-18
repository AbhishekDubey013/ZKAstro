# Cosmic Predictions - Western Astrology Platform

## Overview

Cosmic Predictions is an AI-powered Western astrology platform that generates personalized daily predictions. Users create natal charts, receive predictions from competing AI agents, and vote on the most accurate guidance. The platform utilizes Equal House system calculations and timezone-aware astronomical computations to deliver authentic astrological insights. A core focus is user privacy through a zero-knowledge proof system, ensuring sensitive birth data never leaves the user's browser. The project aims to provide a unique and engaging experience for astrology enthusiasts by leveraging AI and a gamified reputation system for agents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Wouter for routing and TanStack Query for server state management. UI components are styled with Tailwind CSS, custom design tokens, and shadcn/ui components, adhering to Material Design principles with a celestial aesthetic. The design includes a custom theme system supporting dark/light modes and a specific typography hierarchy.

### Backend Architecture

The backend uses Express.js with TypeScript, providing a RESTful API. The astrological calculation engine leverages the `astronomia` library for planetary positions and `luxon` for timezone handling, ensuring high precision and reliability.

The platform features two competing AI agents, @auriga and @nova, each with distinct prediction methodologies (aggressive vs. conservative). Agent behavior is controlled by an aggressiveness parameter in the scoring algorithm. Perplexity API is used for natural language summaries, with template-based fallbacks. A reputation system tracks agent performance based on user votes.

The scoring algorithm calculates transit-to-natal aspects, considers benefic/malefic planets, integrates lunar phases, and allows for customizable weighting.

### Data Storage

PostgreSQL (Neon) is the primary database, accessed via Drizzle ORM for type-safe operations. Key data models include `users`, `charts`, `agents`, `predictionRequests`, `predictionAnswers`, `reputationEvents`, and `chatMessages`.

A critical privacy feature is the Zero-Knowledge Proof (ZKP) system. It uses Poseidon hash (BN254 elliptic curve) for client-side proof generation, ensuring birth data never leaves the browser. Only cryptographic commitments, proofs, and nonces are stored in the database, along with coarsened planetary positions, not raw birth data. The server cryptographically verifies these proofs.

### Interactive Chat Feature

Users can ask follow-up questions about their predictions through an interactive chat interface powered by Perplexity AI. The chat maintains conversation history and provides context-aware responses based on:
- The user's day score (0-100)
- Active transit factors (planetary aspects)
- Original prediction summary
- Target date for the prediction

Chat messages are stored in the database with full conversation history. The LLM uses the astrological context to provide personalized, relevant answers to questions about career, relationships, finances, and specific cosmic influences. Template-based fallbacks ensure responses even when the Perplexity API is unavailable.

### API Structure

The API provides endpoints for:
- **Chart Management**: Creating and retrieving natal charts.
- **Prediction Flow**: Requesting daily predictions, retrieving agent answers, and voting for preferred predictions.
- **Interactive Chat**: Sending follow-up questions and retrieving chat history for predictions (`GET/POST /api/request/:id/chat`).
- **Agent Performance & Leaderboard**: Listing agents with reputation scores and fetching comprehensive performance metrics.
API requests and responses use Zod schemas for validation and consistent error handling.

## External Dependencies

### Third-Party Services

- **Perplexity AI**: Used for natural language generation of prediction summaries via its OpenAI-compatible Chat Completions API. A template-based fallback is in place if the API is unavailable.
- **Neon PostgreSQL**: The serverless PostgreSQL database.

### Key Libraries

- **Astronomical Calculations**: `astronomia` (VSOP87 planetary calculations) and `luxon` (timezone-aware datetime).
- **Database & ORM**: `drizzle-orm`, `drizzle-kit`, and `@neondatabase/serverless`.
- **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `cmdk`.
- **Forms & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`.
- **Development Tools**: `vite`, `tsx`, `esbuild`, `@replit/vite-plugin-*`.
- **ZK Cryptography**: `snarkjs`, `circomlibjs`, `circomlib`.
- **Authentication**: `@privy-io/react-auth` for Web3 authentication.