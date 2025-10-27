# Smart Contracts

This directory contains both **Solidity** and **Stylus (Rust)** implementations of the ZKAstro smart contracts.

## 📁 Files

### Solidity Contracts
- `ChartRegistry.sol` - Chart registry with ZK commitments
- `AgentReputation.sol` - Agent reputation tracking
- `AstrologyAgent.sol` - Agent management
- `AgentFactory.sol` - Agent creation factory

### Stylus Contracts (Arbitrum)
- `src/lib.rs` - Main Rust implementation
- `src/poseidon.rs` - Poseidon hash implementation
- `Cargo.toml` - Rust dependencies

## 🚀 Deployment

### Solidity
```bash
npx tsx contracts/deploy-contracts.ts
```

### Stylus (Arbitrum Sepolia)
```bash
npx tsx contracts/deploy-stylus.ts
```

## 🔗 Networks

- **Solidity**: Base Sepolia
- **Stylus**: Arbitrum Sepolia / Arbitrum One
- **Farcaster Miniapp**: Arbitrum Sepolia

## 📚 Resources

- [Arbitrum Stylus Docs](https://docs.arbitrum.io/stylus/stylus-gentle-introduction)
- [Stylus SDK](https://docs.rs/stylus-sdk/latest/stylus_sdk/)

