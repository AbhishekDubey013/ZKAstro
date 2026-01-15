# ZKastro - Privacy-First AI Astrology Platform

A decentralized astrology platform combining Zero-Knowledge proofs, AI agents, and blockchain transparency. Features ERC-8004 agent identity registry and x402 payment protocol integration.

## 🌟 Key Features

- **Zero-Knowledge Privacy**: Birth data calculated client-side, only cryptographic proofs sent to server
- **On-Chain Verification**: Chart commitments recorded on Arbitrum Sepolia using Stylus
- **AI-Powered Predictions**: Competing agents provide daily astrological insights
- **ERC-8004 Agent Registry**: Standardized agent identity, credentials, and reputation on-chain
- **x402 Payment Protocol**: HTTP 402 payment-required flow for premium predictions
- **Transparent Reputation**: Agent performance immutably stored on blockchain
- **Stylus Smart Contracts**: Rust-based contracts with on-chain ZK verification

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
- Arbitrum Sepolia (Ethereum L2)
- Stylus (Rust/WASM smart contracts)
- ChartRegistry contract with on-chain ZK verification
- ERC-8004 Agent Registry (Draft standard implementation)
- x402 Payment Protocol for monetization

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
- Arbitrum Sepolia testnet ETH

### Local Development

1. **Clone repository**
   ```bash
   git clone https://github.com/your-username/zkastro.git
   cd zkastro
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

Deploy backend to Railway/Vercel and frontend to Vercel. See [ENV_VARIABLES.md](ENV_VARIABLES.md) for required environment variables.

## 📖 How It Works

### 1. Create Chart with Zero-Knowledge Privacy

1. User enters birth data (date, time, location)
2. **Client-side**: Planetary positions calculated in browser
3. **Client-side**: ZK proof generated using Poseidon hash
4. **Sent to server**: Only proof + positions (NOT raw birth data)
5. **Server**: Verifies proof cryptographically
6. **Blockchain**: Chart commitment stored on Arbitrum Sepolia (Stylus)
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
3. **Blockchain**: Selection recorded on-chain
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
                        │ Arbitrum    │
                        │ (Stylus)    │
                        └─────────────┘
```

## 📋 Smart Contracts

### ChartRegistry (Stylus)
- **Network**: Arbitrum Sepolia
- **Purpose**: Store chart commitments with on-chain ZK verification
- **Technology**: Rust/WASM smart contract

### ERC8004AgentRegistry (Solidity)
- **Network**: Arbitrum Sepolia
- **Purpose**: Standardized agent identity, credentials, and reputation
- **Standard**: [ERC-8004 Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004) (Draft)
- **Features**: Agent profiles, verifiable credentials, validation workflows

## 🎯 API Endpoints

### Core API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chart` | Create chart (ZK mode only) |
| GET | `/api/charts` | Get user's charts |
| POST | `/api/request` | Request daily prediction |
| GET | `/api/request/:id` | Get prediction details |
| POST | `/api/request/:id/select` | Select winning prediction |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/stats` | Agent statistics |

### ERC-8004 Registry API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/erc8004/status` | Check registry deployment status |
| GET | `/api/erc8004/agents/:id/profile` | Get full agent profile |
| GET | `/api/erc8004/agents/:id/credentials` | Get agent credentials |
| GET | `/api/erc8004/agents/:id/stats` | Get on-chain agent stats |
| POST | `/api/erc8004/agents/:id/validate` | Validate agent (admin) |
| POST | `/api/erc8004/agents/:id/credentials` | Issue credential (admin) |

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
- **Network**: Arbitrum Sepolia (Ethereum L2)
- **Contracts**: Stylus (Rust/WASM) deployed via cargo-stylus
- **Gas**: Platform-sponsored
- **Explorer**: Arbiscan

## 📁 Project Structure

```
/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks (useX402, useMetaMask)
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── routes.ts           # API routes (including ERC-8004)
│   ├── storage.ts          # Database layer
│   └── db.ts               # Drizzle config
├── contracts/              # Smart contracts
│   ├── src/lib.rs          # Stylus ChartRegistry (Rust)
│   ├── ERC8004AgentRegistry.sol  # ERC-8004 implementation
│   └── Cargo.toml          # Rust dependencies
├── lib/                    # Shared utilities
│   ├── astro/              # Astronomy engine
│   ├── agents/             # AI agents
│   └── blockchain/         # On-chain integration (ERC-8004)
├── scripts/                # Deployment scripts
│   └── deploy-erc8004.ts   # ERC-8004 deployment
└── shared/
    └── schema.ts           # Database schema
```

## 🚀 Deployment

**Deployment Steps:**

1. Set up PostgreSQL database (Neon)
2. Deploy backend to Railway or Vercel
3. Deploy frontend to Vercel
4. Configure environment variables
5. Deploy Stylus contract to Arbitrum Sepolia

## 🏆 Hackathon Features

Built for **Ethereum is for AI Hackathon**:

- ✅ Zero-Knowledge proofs for privacy
- ✅ On-chain transparency
- ✅ AI agent competition
- ✅ Arbitrum Stylus (Rust/WASM) integration
- ✅ ERC-8004 Agent Identity Registry (Draft standard)
- ✅ x402 Payment Protocol integration
- ✅ Decentralized reputation with verifiable credentials
- ✅ Gas sponsorship
- ✅ Modern Web3 UX

## 📄 License

MIT

## 🙏 Acknowledgments

- Ethereum Foundation
- Virtuals Protocol
- Arbitrum Foundation
- Privy.io
- Perplexity AI
- Neon Database

---

**Built with 💜 for the Ethereum is for AI Hackathon**
