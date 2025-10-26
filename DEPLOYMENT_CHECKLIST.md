# 🚀 Arbitrum Stylus Deployment Checklist

## Pre-Deployment Setup

### ✅ 1. Install Required Tools

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install cargo-stylus
cargo install --force cargo-stylus

# Verify installations
rustc --version
cargo --version
cargo stylus --version
```

### ✅ 2. Get Arbitrum Sepolia ETH

You need ETH on Arbitrum Sepolia for deployment:

1. **Get Sepolia ETH** from faucet:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia

2. **Bridge to Arbitrum Sepolia**:
   - https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia
   - Or use: https://faucet.quicknode.com/arbitrum/sepolia

**Recommended**: Get at least 0.1 ETH on Arbitrum Sepolia

### ✅ 3. Configure Environment Variables

Create/update your `.env` file:

```bash
# Required for deployment
AGENT_DEPLOYER_PRIVATE_KEY=your_private_key_here

# Arbitrum Sepolia RPC
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc

# Network selection
ARBITRUM_NETWORK=arbitrum-sepolia

# Will be filled after deployment
CHART_REGISTRY_ADDRESS=
```

**⚠️ IMPORTANT**: Never commit your `.env` file!

### ✅ 4. Verify Your Wallet

```bash
# Check your wallet address has funds
npx tsx -e "
import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
const wallet = new ethers.Wallet(process.env.AGENT_DEPLOYER_PRIVATE_KEY, provider);
const balance = await provider.getBalance(wallet.address);
console.log('Address:', wallet.address);
console.log('Balance:', ethers.formatEther(balance), 'ETH');
"
```

## Build & Test

### ✅ 5. Build the Stylus Contract

```bash
# Navigate to contracts directory
cd contracts

# Build the contract
cargo build --release --target wasm32-unknown-unknown

# Expected output location:
# ../target/wasm32-unknown-unknown/release/chart_registry_stylus.wasm
```

### ✅ 6. Check Contract Size

```bash
# Check WASM file size and validity
cargo stylus check --wasm-file ../target/wasm32-unknown-unknown/release/chart_registry_stylus.wasm --endpoint https://sepolia-rollup.arbitrum.io/rpc

# This will show:
# - Contract size
# - Estimated deployment cost
# - Validation status
```

### ✅ 7. Run Tests (Optional)

```bash
# Run Rust tests
cargo test

# Run integration tests
npm run test
```

## Deployment

### ✅ 8. Deploy to Arbitrum Sepolia

```bash
# From project root
npm run deploy:stylus:testnet

# Or manually:
npx tsx contracts/deploy-stylus.ts arbitrum-sepolia
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
✅ Contract deployed at: 0x...
🔧 Initializing contract...
  Transaction sent: 0x...
✅ Contract initialized (block 12345)
🔍 Verifying deployment...
✅ Contract verified at 0x...
  Code size: 1234 bytes
📝 Deployment info saved to deployment-arbitrum-sepolia.json

📋 Add this to your .env file:
CHART_REGISTRY_ADDRESS=0x...
ARBITRUM_NETWORK=arbitrum-sepolia

✨ Deployment complete!
```

### ✅ 9. Update Environment Variables

Copy the contract address from deployment output:

```bash
# Add to .env
CHART_REGISTRY_ADDRESS=0x... # from deployment output
```

### ✅ 10. Verify Deployment

```bash
# Check contract on Arbiscan
# https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS

# Or verify programmatically:
npx tsx -e "
import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
const code = await provider.getCode('YOUR_CONTRACT_ADDRESS');
console.log('Contract deployed:', code !== '0x');
console.log('Code size:', (code.length - 2) / 2, 'bytes');
"
```

## Integration

### ✅ 11. Update Backend Integration

Update `server/routes.ts` to use Arbitrum:

```typescript
// Change from:
import { recordChartOnChain } from '../lib/blockchain/onchain-registry.js';

// To:
import { recordChartOnArbitrum } from '../lib/blockchain/arbitrum-registry.js';

// Update the call:
const onChainResult = await recordChartOnArbitrum(
  chart.id,
  zkBody.params,
  userId,
  zkBody.zkProof
);
```

### ✅ 12. Update Frontend Explorer Links

Update explorer URLs in your frontend:

```typescript
// Change from:
const explorerUrl = `https://sepolia-explorer.base.org/tx/${txHash}`;

// To:
const explorerUrl = `https://sepolia.arbiscan.io/tx/${txHash}`;
```

### ✅ 13. Test End-to-End Flow

```bash
# Start your application
npm run dev

# Test chart creation:
# 1. Create a new chart
# 2. Verify ZK proof is generated
# 3. Check transaction on Arbiscan
# 4. Verify gas costs (should be 10-100x cheaper!)
```

## Post-Deployment Verification

### ✅ 14. Test Contract Functions

```bash
# Test registering a chart
npx tsx -e "
import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
const wallet = new ethers.Wallet(process.env.AGENT_DEPLOYER_PRIVATE_KEY, provider);
const abi = ['function totalCharts() external view returns (uint256)'];
const contract = new ethers.Contract(process.env.CHART_REGISTRY_ADDRESS, abi, wallet);
const total = await contract.totalCharts();
console.log('Total charts:', total.toString());
"
```

### ✅ 15. Monitor Gas Costs

Compare gas costs:

```
Solidity (Base Sepolia):
- Register Chart: ~0.002 ETH ($5-10)
- Verify Chart: ~0.001 ETH ($2-3)

Stylus (Arbitrum Sepolia):
- Register Chart: ~0.0002 ETH ($0.50-1) ✅ 90% cheaper!
- Verify Chart: ~0.0001 ETH ($0.20-0.30) ✅ 90% cheaper!
```

### ✅ 16. Document Deployment

Save deployment information:

```bash
# Deployment info is automatically saved to:
# contracts/deployment-arbitrum-sepolia.json

# Contains:
# - Contract address
# - Deployment timestamp
# - Network details
# - Transaction hash
```

## Troubleshooting

### Issue: "WASM file not found"

```bash
# Solution: Build the contract first
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

### Issue: "Insufficient funds"

```bash
# Solution: Get more Arbitrum Sepolia ETH
# Visit: https://faucet.quicknode.com/arbitrum/sepolia
```

### Issue: "Contract deployment failed"

```bash
# Check:
# 1. RPC URL is correct
# 2. Private key is valid
# 3. Wallet has sufficient ETH
# 4. Network is reachable

# Test connection:
curl https://sepolia-rollup.arbitrum.io/rpc -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Issue: "cargo-stylus not found"

```bash
# Solution: Install cargo-stylus
cargo install --force cargo-stylus

# Add to PATH if needed
export PATH="$HOME/.cargo/bin:$PATH"
```

## Production Deployment (Arbitrum One)

### When Ready for Mainnet:

1. **Security Audit** ✅ Complete security audit
2. **Testing** ✅ Extensive testing on Sepolia
3. **Get Mainnet ETH** ✅ Bridge ETH to Arbitrum One
4. **Update Config** ✅ Change network to `arbitrum-one`
5. **Deploy** ✅ Run `npm run deploy:stylus:mainnet`
6. **Monitor** ✅ Watch transactions and gas costs

## Success Criteria

- ✅ Contract deployed successfully
- ✅ Contract initialized
- ✅ Can register charts
- ✅ Can verify charts
- ✅ Gas costs 10-100x cheaper than Solidity
- ✅ Explorer shows transactions
- ✅ Frontend integration working
- ✅ End-to-end flow tested

## Next Steps

1. **Monitor Performance**
   - Track gas costs
   - Monitor transaction times
   - Collect user feedback

2. **Optimize Further**
   - Batch operations
   - Storage optimization
   - Advanced ZK features

3. **Scale**
   - Deploy to Arbitrum One mainnet
   - Add more features
   - Expand to other chains

## Resources

- **Arbitrum Sepolia Explorer**: https://sepolia.arbiscan.io
- **Arbitrum Sepolia Faucet**: https://faucet.quicknode.com/arbitrum/sepolia
- **Stylus Docs**: https://docs.arbitrum.io/stylus/stylus-gentle-introduction
- **Stylus SDK**: https://docs.rs/stylus-sdk/latest/stylus_sdk/
- **Support**: https://discord.gg/arbitrum

---

**Ready to deploy? Follow this checklist step by step!** 🚀

**Estimated Time**: 30-60 minutes
**Cost**: ~0.01-0.05 ETH on Arbitrum Sepolia

