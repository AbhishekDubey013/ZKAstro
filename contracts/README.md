# Smart Contracts

This directory contains both **Solidity** and **Stylus (Rust)** implementations of the ZKAstro smart contracts.

## 📁 Files

### Solidity Contracts (Base Network)
- `ChartRegistry.sol` - Original Solidity implementation
- `AgentReputation.sol` - Agent reputation tracking
- `AstrologyAgent.sol` - Agent management
- `AgentFactory.sol` - Agent creation factory
- `deploy-contracts.ts` - Solidity deployment script

### Stylus Contracts (Arbitrum Network) 🆕
- `ChartRegistry.rs` - **Rust/WASM implementation (10-100x cheaper gas!)**
- `Cargo.toml` - Rust dependencies and build configuration
- `deploy-stylus.ts` - Stylus deployment script

## 🚀 Quick Start

### Deploy Solidity (Base Sepolia)

```bash
npm run deploy:base
```

### Deploy Stylus (Arbitrum Sepolia) 🆕

```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install cargo-stylus

# Build and deploy
npm run stylus:build
npm run deploy:stylus:testnet
```

## 💰 Cost Comparison

| Operation | Solidity (Base) | Stylus (Arbitrum) | Savings |
|-----------|----------------|-------------------|---------|
| Register Chart | ~$5-10 | ~$0.50-1 | **90%+** |
| Verify Chart | ~$2-3 | ~$0.20-0.30 | **90%+** |
| Get Chart | Free (view) | Free (view) | - |

## 📚 Documentation

- **Solidity**: See original deployment docs
- **Stylus**: See [STYLUS_MIGRATION_GUIDE.md](../STYLUS_MIGRATION_GUIDE.md)

## 🔗 Networks

### Current (Solidity)
- **Network**: Base Sepolia
- **Explorer**: https://sepolia-explorer.base.org

### New (Stylus) 🆕
- **Network**: Arbitrum Sepolia / Arbitrum One
- **Explorer**: https://sepolia.arbiscan.io / https://arbiscan.io

## ✨ Why Stylus?

1. **10-100x cheaper gas costs** 💰
2. **Better performance** for crypto operations ⚡
3. **Memory-safe** Rust implementation 🔒
4. **Future-proof** WASM technology 🚀
5. **On-chain ZK verification** possible 🔐

## 🛠️ Development

### Build Stylus Contract

```bash
npm run stylus:build
```

### Check Contract

```bash
npm run stylus:check
```

### Run Tests

```bash
cd contracts
cargo test
```

## 📞 Support

- [Arbitrum Stylus Docs](https://docs.arbitrum.io/stylus/stylus-gentle-introduction)
- [Stylus SDK](https://docs.rs/stylus-sdk/latest/stylus_sdk/)
- [GitHub Issues](https://github.com/AbhishekDubey013/ZKAstro/issues)

---

**Built with ❤️ using Solidity & Arbitrum Stylus**

