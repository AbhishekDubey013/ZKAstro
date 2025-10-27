# Farcaster Astrology Miniapp

A Farcaster miniapp that provides personalized daily astrology predictions using AI and Arbitrum Stylus smart contracts.

## 🌟 Features

- **Privy Authentication**: Wallet-based login with Farcaster integration
- **Daily Predictions**: AI-powered astrological insights using Perplexity
- **Personalized Chat**: Ask specific questions about your day
- **Rating System**: Rate predictions to improve accuracy
- **Stylus Smart Contracts**: On-chain storage on Arbitrum Sepolia
- **ZK Privacy**: Birth data secured with zero-knowledge proofs

## 🛠️ Tech Stack

### Frontend
- React + TypeScript + Vite
- Privy for authentication
- Tailwind CSS + shadcn/ui
- TanStack Query

### Backend
- Node.js + Express
- PostgreSQL (Neon)
- Perplexity AI
- Ethers.js v6

### Blockchain
- Arbitrum Sepolia (Stylus)
- Rust/WASM smart contracts
- ZK proof verification

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon)
- Privy account
- Perplexity API key
- Arbitrum Sepolia testnet ETH

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Privy (Authentication)
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret
VITE_PRIVY_APP_ID=your_privy_app_id

# AI
PERPLEXITY_API_KEY=your_perplexity_key

# Blockchain
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
AGENT_DEPLOYER_PRIVATE_KEY=your_private_key
FARCASTER_CONTRACT_ADDRESS=0xfbcbb9088301cb94946ad415d7d862a583f6289d
```

### Local Development

```bash
# Install dependencies
npm install

# Create database tables
npx tsx scripts/create-farcaster-tables.ts

# Start dev server
npm run dev
```

Visit `http://localhost:5000`

## 📦 Deployment

### Vercel

1. Import GitHub repository
2. Select `farcaster-miniapp` branch
3. Add environment variables
4. Deploy!

### Environment Variables for Vercel

Add all the environment variables listed above in Vercel dashboard:
- Settings → Environment Variables
- Add each variable
- Redeploy

### After Deployment

1. Whitelist your Vercel domain in Privy dashboard
2. Test wallet login
3. Test full user flow

## 🔗 Smart Contract

Deployed on Arbitrum Sepolia:
- **Address**: `0xfbcbb9088301cb94946ad415d7d862a583f6289d`
- **Explorer**: https://sepolia.arbiscan.io/address/0xfbcbb9088301cb94946ad415d7d862a583f6289d

## 📚 API Routes

- `GET /api/farcaster/check-data` - Check if user has birth data
- `POST /api/farcaster/save-birth-data` - Save birth data
- `GET /api/farcaster/daily-prediction` - Get daily prediction
- `POST /api/farcaster/rate-prediction` - Rate a prediction
- `POST /api/farcaster/ask-question` - Ask personalized question
- `GET /api/farcaster/stats` - Get user statistics

## 🔐 Privacy

- Birth data calculated client-side
- Only ZK commitments sent to server
- Poseidon hash for privacy
- On-chain verification optional

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ for Farcaster**
