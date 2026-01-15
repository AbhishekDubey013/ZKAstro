/**
 * Deploy Smart Contracts to Base Sepolia
 * Direct deployment with ethers.js (no Hardhat needed)
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployContracts() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   🚀 DEPLOYING TO BASE SEPOLIA                              ║');
  console.log('║      ChartRegistry + AgentReputation                        ║');
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

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  console.log('  Balance:', balanceEth, 'ETH\n');

  if (parseFloat(balanceEth) < 0.01) {
    throw new Error('Insufficient balance. Need at least 0.01 ETH');
  }

  // Read contract source files
  const chartRegistrySource = fs.readFileSync(
    path.join(__dirname, '../contracts/ChartRegistry.sol'),
    'utf8'
  );

  const agentReputationSource = fs.readFileSync(
    path.join(__dirname, '../contracts/AgentReputation.sol'),
    'utf8'
  );

  console.log('✅ Contract sources loaded');
  console.log('   ChartRegistry.sol:', chartRegistrySource.length, 'bytes');
  console.log('   AgentReputation.sol:', agentReputationSource.length, 'bytes\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('ℹ️  For production deployment, use:\n');
  console.log('   • npx tsx scripts/deploy-erc8004.ts  (ERC-8004 on Arbitrum Sepolia)');
  console.log('   • cargo stylus deploy              (Stylus contracts)\n');

  // This script demonstrates the deployment flow
  const demoChartRegistry = '0x' + '1'.repeat(40);
  const demoAgentReputation = '0x' + '2'.repeat(40);

  console.log('📝 Demo Addresses (not deployed):\n');
  console.log('   ChartRegistry:', demoChartRegistry);
  console.log('   AgentReputation:', demoAgentReputation);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Save deployment info
  const deploymentInfo = {
    network: 'Base Sepolia',
    chainId: 84532,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    note: 'Demo addresses - use deploy-erc8004.ts for actual deployment',
    contracts: {
      ChartRegistry: demoChartRegistry,
      AgentReputation: demoAgentReputation,
    },
  };

  fs.writeFileSync(
    path.join(__dirname, '../deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('💾 Demo info saved to deployment-info.json\n');
  console.log('📝 After actual deployment, add to .env:\n');
  console.log('   CHART_REGISTRY_ADDRESS=<deployed_address>');
  console.log('   ERC8004_REGISTRY_ADDRESS=<deployed_address>\n');

  return deploymentInfo;
}

// For actual Solidity compilation, use:
async function compileSolidity() {
  const solc = await import('solc');
  
  const chartRegistrySource = fs.readFileSync(
    path.join(__dirname, '../contracts/ChartRegistry.sol'),
    'utf8'
  );

  const input = {
    language: 'Solidity',
    sources: {
      'ChartRegistry.sol': { content: chartRegistrySource },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.default.compile(JSON.stringify(input)));
  
  if (output.errors) {
    output.errors.forEach((err: any) => console.error(err.formattedMessage));
  }

  return output.contracts['ChartRegistry.sol']['ChartRegistry'];
}

deployContracts()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });

