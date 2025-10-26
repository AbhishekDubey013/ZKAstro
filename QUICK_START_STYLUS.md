# 🚀 Quick Start: Deploy to Arbitrum Sepolia

Get your ZKAstro contracts deployed on Arbitrum Sepolia with Stylus in **under 30 minutes**!

## TL;DR - Fast Track

```bash
# 1. Install Rust & tools
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown
cargo install --force cargo-stylus

# 2. Get testnet ETH
# Visit: https://faucet.quicknode.com/arbitrum/sepolia

# 3. Set environment variable
export AGENT_DEPLOYER_PRIVATE_KEY="your_private_key"

# 4. Check setup
npm run stylus:setup

# 5. Build & Deploy
npm run stylus:build
npm run deploy:stylus:testnet

# Done! 🎉
```

## Step-by-Step Guide

### 1️⃣ Install Rust Toolchain (5 min)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Load Rust environment
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### 2️⃣ Install Stylus Tools (2 min)

```bash
# Add WASM target
rustup target add wasm32-unknown-unknown

# Install cargo-stylus
cargo install --force cargo-stylus

# Verify
cargo stylus --version
```

### 3️⃣ Get Arbitrum Sepolia ETH (5 min)

**Option A: Direct Faucet** (Recommended)
- Visit: https://faucet.quicknode.com/arbitrum/sepolia
- Enter your wallet address
- Get 0.1 ETH instantly

**Option B: Bridge from Sepolia**
1. Get Sepolia ETH: https://sepoliafaucet.com/
2. Bridge: https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia

### 4️⃣ Configure Environment (2 min)

Create or update `.env`:

```bash
# Your private key (NEVER commit this!)
AGENT_DEPLOYER_PRIVATE_KEY=your_private_key_here

# Arbitrum Sepolia RPC (default provided)
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc

# Network
ARBITRUM_NETWORK=arbitrum-sepolia
```

### 5️⃣ Verify Setup (1 min)

```bash
npm run stylus:setup
```

**Expected Output:**
```
✅ Private Key: AGENT_DEPLOYER_PRIVATE_KEY is set
✅ Wallet Balance: 0.1 ETH - sufficient for deployment
✅ Rust Compiler: rustc 1.75.0
✅ Cargo: cargo 1.75.0
✅ WASM Target: wasm32-unknown-unknown installed
✅ cargo-stylus: cargo-stylus 0.5.0
✅ Rust Contract: ChartRegistry.rs exists
✅ Network Connection: Connected to Arbitrum Sepolia

🎉 All checks passed! Ready to deploy!
```

### 6️⃣ Build Contract (3 min)

```bash
npm run stylus:build
```

This compiles your Rust contract to WASM.

### 7️⃣ Deploy to Arbitrum Sepolia (5 min)

```bash
npm run deploy:stylus:testnet
```

**Expected Output:**
```
🎨 Arbitrum Stylus Deployment
═══════════════════════════════════════
Network: arbitrum-sepolia
RPC: https://sepolia-rollup.arbitrum.io/rpc
═══════════════════════════════════════

🔨 Building Stylus contract...
✅ Contract built successfully

🚀 Deploying to arbitrum-sepolia...
✅ Contract deployed at: 0xYourContractAddress

🔧 Initializing contract...
  Transaction sent: 0xYourTxHash
✅ Contract initialized (block 12345)

🔍 Verifying deployment...
✅ Contract verified at 0xYourContractAddress
  Code size: 1234 bytes

📝 Deployment info saved to deployment-arbitrum-sepolia.json

📋 Add this to your .env file:
CHART_REGISTRY_ADDRESS=0xYourContractAddress
ARBITRUM_NETWORK=arbitrum-sepolia

✨ Deployment complete!

🎯 Benefits of Stylus:
  • 10-100x cheaper gas costs
  • Faster execution for ZK operations
  • Memory-safe Rust implementation
  • Better performance overall
```

### 8️⃣ Update .env with Contract Address (1 min)

Copy the contract address from the output:

```bash
# Add to .env
CHART_REGISTRY_ADDRESS=0xYourContractAddress
```

### 9️⃣ Verify on Arbiscan (2 min)

Visit: `https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS`

You should see:
- ✅ Contract code deployed
- ✅ Transactions
- ✅ Contract verified

### 🎉 Done!

Your ZKAstro contracts are now live on Arbitrum Sepolia!

## Test Your Deployment

### Test 1: Check Total Charts

```bash
npx tsx -e "
import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
const abi = ['function totalCharts() external view returns (uint256)'];
const contract = new ethers.Contract(process.env.CHART_REGISTRY_ADDRESS, abi, provider);
const total = await contract.totalCharts();
console.log('Total charts:', total.toString());
"
```

### Test 2: Create a Chart

Start your app and create a chart:

```bash
npm run dev
```

1. Navigate to chart creation
2. Fill in birth data
3. Generate ZK proof
4. Submit chart
5. Check transaction on Arbiscan

### Test 3: Verify Gas Savings

Compare gas costs:
- **Before (Solidity)**: ~0.002 ETH per chart
- **After (Stylus)**: ~0.0002 ETH per chart
- **Savings**: 90%+ 🎉

## What's Next?

### Update Your Application

1. **Backend**: Use `arbitrum-registry.ts` instead of `onchain-registry.ts`
2. **Frontend**: Update explorer links to Arbiscan
3. **Test**: Run end-to-end tests

### Monitor Performance

- Track gas costs
- Monitor transaction times
- Collect user feedback

### Deploy to Mainnet (When Ready)

```bash
# Get mainnet ETH
# Update .env with mainnet RPC
# Run:
npm run deploy:stylus:mainnet
```

## Troubleshooting

### "cargo: command not found"

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### "Insufficient funds"

Get more ETH from: https://faucet.quicknode.com/arbitrum/sepolia

### "WASM file not found"

```bash
# Build first
npm run stylus:build
```

### "Cannot connect to RPC"

Check your internet connection and RPC URL.

## Resources

- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Migration Guide**: See `STYLUS_MIGRATION_GUIDE.md`
- **Arbitrum Docs**: https://docs.arbitrum.io/stylus
- **Faucet**: https://faucet.quicknode.com/arbitrum/sepolia
- **Explorer**: https://sepolia.arbiscan.io

## Support

Need help?
- Check `DEPLOYMENT_CHECKLIST.md` for detailed troubleshooting
- Join Arbitrum Discord: https://discord.gg/arbitrum
- Create an issue: https://github.com/AbhishekDubey013/ZKAstro/issues

---

**Happy Deploying! 🚀**

Built with ❤️ using Arbitrum Stylus

