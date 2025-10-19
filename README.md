# ZKastro - Privacy-First AI Astrology Platform

A decentralized astrology platform combining Zero-Knowledge proofs, AI agents, and blockchain transparency. Built for the Ethereum is for AI Hackathon.

## 🌟 Key Features

- **Zero-Knowledge Privacy**: Birth data calculated client-side, only cryptographic proofs sent to server
- **On-Chain Verification**: Chart commitments and agent reputation recorded on Base Sepolia
- **AI-Powered Predictions**: Competing agents provide daily astrological insights
- **Transparent Reputation**: Agent performance immutably stored on blockchain
- **Beautiful Modern UI**: Gradient-themed interface with real-time notifications
- **Decentralized Agents**: Ready for Virtuals Protocol GAME SDK integration

## 🛠️ Tech Stack

### Frontend
- React + TypeScript + Vite
- TanStack Query for state management
- Tailwind CSS + shadcn/ui components
- Privy.io for authentication
- Wouter for routing

### Backend
- Node.js + Express + TypeScript
- Drizzle ORM + PostgreSQL (Neon Serverless)
- Perplexity AI for predictions
- Ethers.js v6 for blockchain

### Blockchain
- Base Sepolia (Ethereum L2)
- Solidity 0.8.20
- ChartRegistry contract
- AgentReputation contract

### Privacy & Security
- Zero-Knowledge proofs (Poseidon hash)
- Client-side position calculation
- Server-side proof verification
- Gas-sponsored transactions

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon)
- Perplexity API key
- Base Sepolia testnet ETH

### Local Development

1. **Clone repository**
   ```bash
   git clone <your-repo-url>
   cd AIInterviewCoach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

## 🌐 Production Deployment

See [DEPLOY_NOW.md](DEPLOY_NOW.md) for step-by-step deployment to Railway + Vercel.

**Quick Links:**
- [Deployment Guide](DEPLOY_NOW.md) - 15-minute setup
- [Environment Variables](ENV_VARIABLES.md) - All variables explained
- [Complete Documentation](DEPLOYMENT.md) - Comprehensive guide

## 📖 How It Works

### 1. Create Chart with Zero-Knowledge Privacy

1. User enters birth data (date, time, location)
2. **Client-side**: Planetary positions calculated in browser
3. **Client-side**: ZK proof generated using Poseidon hash
4. **Sent to server**: Only proof + positions (NOT raw birth data)
5. **Server**: Verifies proof cryptographically
6. **Blockchain**: Chart commitment stored on Base Sepolia
7. **Database**: Full data stored with proof in PostgreSQL

**Privacy Guarantee**: Birth data never leaves your browser!

### 2. Request Daily Prediction

1. User clicks "Know Your Day"
2. System selects 2 active agents
3. Agents analyze daily transits vs natal chart
4. AI generates personalized predictions
5. Predictions displayed side-by-side

### 3. Select Best Prediction

1. User chooses preferred prediction
2. Agent reputation +1 in database
3. **Blockchain**: Selection recorded on Base Sepolia
4. Agent leaderboard updates

### 4. Transparent Reputation

All agent performance is:
- ✅ Recorded on-chain
- ✅ Publicly verifiable
- ✅ Immutable
- ✅ Cannot be manipulated

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Browser   │────────▶│   Server    │────────▶│  PostgreSQL  │
│ (ZK Proofs) │         │  (Verify)   │         │   (Neon)     │
└─────────────┘         └─────────────┘         └──────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │ Base Sepolia│
                        │ (Blockchain)│
                        └─────────────┘
```

## 📋 Smart Contracts

### ChartRegistry
- **Address**: `0x9E62826B28d72739524a00975905C4e618926690`
- **Purpose**: Store chart commitments with ZK verification
- **View**: [BaseScan](https://sepolia.basescan.org/address/0x9E62826B28d72739524a00975905C4e618926690)

### AgentReputation  
- **Address**: `0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7`
- **Purpose**: Transparent agent reputation tracking
- **View**: [BaseScan](https://sepolia.basescan.org/address/0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7)

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chart` | Create chart (ZK mode only) |
| GET | `/api/charts` | Get user's charts |
| POST | `/api/request` | Request daily prediction |
| GET | `/api/request/:id` | Get prediction details |
| POST | `/api/request/:id/select` | Select winning prediction |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/stats` | Agent statistics |

## 🔐 Security Features

- ✅ Zero-Knowledge proof generation
- ✅ Client-side cryptography
- ✅ No raw birth data transmission
- ✅ On-chain verification
- ✅ Immutable reputation system
- ✅ Gas-sponsored transactions
- ✅ Session encryption
- ✅ HTTPS enforcement

## 🎨 UI Features

- Beautiful gradient themes
- Animated background orbs
- Toast notifications with BaseScan links
- Real-time ZK proof status
- On-chain transaction tracking
- Dark mode support
- Fully responsive design
- Glassmorphism effects

## 👥 AI Agents

### @auriga
**Method**: Aggressive Transit Scoring  
**Approach**: Optimistic, emphasizes beneficial aspects  
**Personality**: Growth-oriented, encouraging

### @nova
**Method**: Conservative Transit Analysis  
**Approach**: Balanced, cautious with challenging aspects  
**Personality**: Practical, measured guidance

Both agents use identical astronomical data but employ different weighting strategies.

## 🔬 Technical Details

### Astrology Engine
- **Zodiac**: Tropical (Western)
- **House System**: Equal House (30° per house)
- **Planets**: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn
- **Aspects**: Conjunction, Opposition, Square, Trine, Sextile
- **Library**: astronomia (VSOP87)

### Zero-Knowledge System
- **Hash Function**: Poseidon
- **Proof Type**: Commitment + Verification
- **Privacy Level**: Maximum (birth data never exposed)
- **Verification**: On-chain + Server-side

### Blockchain Integration
- **Network**: Base Sepolia (Ethereum L2)
- **Contracts**: Deployed via ethers.js v6
- **Gas**: Platform-sponsored
- **Explorer**: BaseScan

## 📁 Project Structure

```
/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database layer
│   └── db.ts               # Drizzle config
├── contracts/              # Smart contracts
│   ├── ChartRegistry.sol
│   └── AgentReputation.sol
├── lib/                    # Shared utilities
│   ├── astro/              # Astronomy engine
│   ├── agents/             # AI agents
│   └── blockchain/         # On-chain integration
└── shared/
    └── schema.ts           # Database schema
```

## 🚀 Deployment

**Quick Deploy (15 minutes):**

1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Update environment variables
4. Done!

See [DEPLOY_NOW.md](DEPLOY_NOW.md) for complete instructions.

## 🏆 Hackathon Features

Built for **Ethereum is for AI Hackathon**:

- ✅ Zero-Knowledge proofs for privacy
- ✅ On-chain transparency
- ✅ AI agent competition
- ✅ Base (Ethereum L2) integration
- ✅ Decentralized reputation
- ✅ Gas sponsorship
- ✅ Modern Web3 UX

## 📄 License

MIT

## 🙏 Acknowledgments

- Ethereum Foundation
- Virtuals Protocol
- Base Network
- Privy.io
- Perplexity AI
- Neon Database

---

**Built with 💜 for the Ethereum is for AI Hackathon**
