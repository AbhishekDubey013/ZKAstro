/**
 * Deploy Agent Factory and Initial Agents to Base Sepolia
 * Simple ethers.js deployment without Hardhat complexity
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract sources (we'll compile inline)
const AGENT_CONTRACT = fs.readFileSync(
  path.join(__dirname, '../contracts/AstrologyAgent.sol'),
  'utf8'
);

const FACTORY_CONTRACT = fs.readFileSync(
  path.join(__dirname, '../contracts/AgentFactory.sol'),
  'utf8'
);

// Simplified bytecode and ABI (for deployment without Hardhat)
// In production, use proper compilation
const FACTORY_ABI = [
  "constructor()",
  "function createAgent(string handle, string name, string method, uint256 aggressiveness, string personality, string metadataURI) payable returns (address)",
  "function getAllAgents() view returns (address[])",
  "function getAgentCount() view returns (uint256)",
  "function agentsByHandle(string) view returns (address)",
  "function isAgent(address) view returns (bool)",
];

const AGENT_ABI = [
  "function handle() view returns (string)",
  "function name() view returns (string)",
  "function method() view returns (string)",
  "function getStats() view returns (uint256, uint256, uint256, uint256)",
  "function getAgentInfo() view returns (string, string, string, uint256, string, string, bool, uint256)",
];

async function deployContracts() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   🏭 DEPLOYING AGENT FACTORY TO BASE SEPOLIA                ║');
  console.log('║      Custom Autonomous Agent Architecture                   ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Setup
  const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('AGENT_DEPLOYER_PRIVATE_KEY not set');
  }

  const rpcUrl = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📋 Configuration');
  console.log('  Deployer:', wallet.address);
  console.log('  Network: Base Sepolia (84532)');
  console.log('  RPC:', rpcUrl);

  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  console.log('  Balance:', balanceEth, 'ETH\n');

  if (parseFloat(balanceEth) < 0.01) {
    console.error('❌ Insufficient balance. Need at least 0.01 ETH');
    console.log('\n💡 Get testnet ETH:');
    console.log('   https://www.coinbase.com/faucets/base-ethereum-goerli-faucet');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Note: Without Hardhat, we need to provide compiled bytecode
  // For now, show what would happen and provide manual deployment instructions
  console.log('⚠️  MANUAL DEPLOYMENT REQUIRED\n');
  console.log('The contracts need to be compiled first. Here are your options:\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎯 OPTION 1: Use Remix IDE (Recommended - Easiest)\n');
  console.log('  1. Go to https://remix.ethereum.org');
  console.log('  2. Create new file: AstrologyAgent.sol');
  console.log('     Location: contracts/AstrologyAgent.sol');
  console.log('  3. Create new file: AgentFactory.sol');
  console.log('     Location: contracts/AgentFactory.sol');
  console.log('  4. Compile with Solidity 0.8.20');
  console.log('  5. Deploy to "Injected Provider - MetaMask"');
  console.log('  6. Select Base Sepolia network in MetaMask');
  console.log('  7. Deploy AgentFactory');
  console.log('  8. Copy deployed address to .env\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎯 OPTION 2: Use Foundry (For Developers)\n');
  console.log('  # Install Foundry');
  console.log('  curl -L https://foundry.paradigm.xyz | bash');
  console.log('  foundryup\n');
  console.log('  # Compile');
  console.log('  forge build\n');
  console.log('  # Deploy');
  console.log('  forge create contracts/AgentFactory.sol:AgentFactory \\');
  console.log('    --rpc-url $BASE_SEPOLIA_RPC \\');
  console.log('    --private-key $AGENT_DEPLOYER_PRIVATE_KEY\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎯 OPTION 3: Use solc (Solidity Compiler)\n');
  console.log('  npm install -g solc');
  console.log('  solcjs --bin --abi contracts/AgentFactory.sol\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 AFTER DEPLOYMENT\n');
  console.log('  1. Copy the deployed AgentFactory address');
  console.log('  2. Add to .env:');
  console.log('     AGENT_FACTORY_ADDRESS=0x...\n');
  console.log('  3. Create initial agents:');
  console.log('     npm run create:agents\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 CONTRACT SUMMARY\n');
  console.log('AgentFactory.sol:');
  console.log('  • Permissionless agent creation');
  console.log('  • Registry of all agents');
  console.log('  • Handle-based lookup');
  console.log('  • Optional creation fee\n');

  console.log('AstrologyAgent.sol:');
  console.log('  • Individual agent contract');
  console.log('  • On-chain reputation');
  console.log('  • Prediction tracking');
  console.log('  • Owner controls\n');

  console.log('Initial Agents to Create:');
  console.log('  • @auriga - Optimistic predictions (1.3x aggressiveness)');
  console.log('  • @nova   - Conservative predictions (0.8x aggressiveness)\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 RECOMMENDATION\n');
  console.log('For fastest deployment:');
  console.log('  1. Use Remix IDE (no local setup needed)');
  console.log('  2. Copy/paste contracts');
  console.log('  3. Deploy with MetaMask');
  console.log('  4. Add address to .env');
  console.log('  5. Run agent creation script\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Save deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: 'base-sepolia',
    chainId: 84532,
    deployer: wallet.address,
    contracts: {
      AgentFactory: {
        source: 'contracts/AgentFactory.sol',
        compiler: 'solidity 0.8.20',
        status: 'ready-to-deploy',
      },
      AstrologyAgent: {
        source: 'contracts/AstrologyAgent.sol',
        compiler: 'solidity 0.8.20',
        status: 'ready-to-deploy',
      },
    },
    initialAgents: [
      {
        handle: '@auriga',
        name: 'Auriga',
        method: 'Aggressive Transit Scoring',
        aggressiveness: 1300,
        personality: 'optimistic and growth-oriented, emphasizing opportunities',
      },
      {
        handle: '@nova',
        name: 'Nova',
        method: 'Conservative Transit Analysis',
        aggressiveness: 800,
        personality: 'measured and practical, providing balanced guidance',
      },
    ],
  };

  fs.writeFileSync(
    path.join(__dirname, '../deployment-plan.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('✅ Deployment plan saved to deployment-plan.json');
  console.log('✅ Contracts ready to deploy');
  console.log('\n🚀 Use Remix IDE for easiest deployment!');
}

deployContracts()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

