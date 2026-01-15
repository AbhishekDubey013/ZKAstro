/**
 * Deploy ERC-8004 Agent Registry to Arbitrum Sepolia
 * Implements standardized agent identity, credentials, and reputation
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arbitrum Sepolia configuration
const ARBITRUM_SEPOLIA_CONFIG = {
  chainId: 421614,
  name: 'Arbitrum Sepolia',
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  explorerUrl: 'https://sepolia.arbiscan.io',
};

async function compileContract() {
  console.log('📦 Compiling ERC8004AgentRegistry.sol...\n');
  
  const solc = (await import('solc')).default;
  
  const contractSource = fs.readFileSync(
    path.join(__dirname, '../contracts/ERC8004AgentRegistry.sol'),
    'utf8'
  );

  const input = {
    language: 'Solidity',
    sources: {
      'ERC8004AgentRegistry.sol': { content: contractSource },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // Check for errors
  if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === 'error');
    if (errors.length > 0) {
      console.error('❌ Compilation errors:');
      errors.forEach((err: any) => console.error(err.formattedMessage));
      throw new Error('Contract compilation failed');
    }
    
    // Show warnings
    const warnings = output.errors.filter((e: any) => e.severity === 'warning');
    if (warnings.length > 0) {
      console.log('⚠️  Compilation warnings:');
      warnings.forEach((warn: any) => console.log(warn.formattedMessage));
    }
  }

  const contract = output.contracts['ERC8004AgentRegistry.sol']['ERC8004AgentRegistry'];
  
  if (!contract) {
    throw new Error('Contract not found in compilation output');
  }

  console.log('✅ Contract compiled successfully');
  console.log(`   Bytecode size: ${contract.evm.bytecode.object.length / 2} bytes\n`);

  return {
    abi: contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object,
  };
}

async function deployContract() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   🚀 DEPLOYING ERC-8004 AGENT REGISTRY                       ║');
  console.log('║      Network: Arbitrum Sepolia                               ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Check environment
  const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ AGENT_DEPLOYER_PRIVATE_KEY not set in environment');
    console.log('\nTo deploy, set your private key:');
    console.log('  export AGENT_DEPLOYER_PRIVATE_KEY=your_private_key');
    process.exit(1);
  }

  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC || ARBITRUM_SEPOLIA_CONFIG.rpcUrl;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📋 Configuration');
  console.log('  Deployer:', wallet.address);
  console.log('  Network:', ARBITRUM_SEPOLIA_CONFIG.name);
  console.log('  Chain ID:', ARBITRUM_SEPOLIA_CONFIG.chainId);
  console.log('  RPC:', rpcUrl);

  // Check network
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== ARBITRUM_SEPOLIA_CONFIG.chainId) {
    throw new Error(`Wrong network! Expected ${ARBITRUM_SEPOLIA_CONFIG.chainId}, got ${network.chainId}`);
  }

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  console.log('  Balance:', balanceEth, 'ETH\n');

  if (parseFloat(balanceEth) < 0.001) {
    console.error('❌ Insufficient balance');
    console.log('\nGet testnet ETH from:');
    console.log('  https://faucet.quicknode.com/arbitrum/sepolia');
    console.log('  https://www.alchemy.com/faucets/arbitrum-sepolia');
    process.exit(1);
  }

  // Compile contract
  const { abi, bytecode } = await compileContract();

  // Deploy
  console.log('🚀 Deploying ERC8004AgentRegistry...\n');
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  // Estimate gas
  const deployTx = await factory.getDeployTransaction();
  const estimatedGas = await provider.estimateGas(deployTx);
  const feeData = await provider.getFeeData();
  
  console.log('⛽ Gas estimate:', estimatedGas.toString());
  console.log('💰 Gas price:', ethers.formatUnits(feeData.gasPrice || 0, 'gwei'), 'gwei\n');

  const contract = await factory.deploy();
  const deployTxHash = contract.deploymentTransaction()?.hash;
  
  console.log('📤 Transaction sent:', deployTxHash);
  console.log('   Explorer:', `${ARBITRUM_SEPOLIA_CONFIG.explorerUrl}/tx/${deployTxHash}\n`);

  console.log('⏳ Waiting for confirmation...');
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log('\n✅ ERC8004AgentRegistry deployed!');
  console.log('   Contract:', contractAddress);
  console.log('   Explorer:', `${ARBITRUM_SEPOLIA_CONFIG.explorerUrl}/address/${contractAddress}\n`);

  // Save deployment info
  const deploymentInfo = {
    network: ARBITRUM_SEPOLIA_CONFIG.name,
    chainId: ARBITRUM_SEPOLIA_CONFIG.chainId,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contract: {
      name: 'ERC8004AgentRegistry',
      address: contractAddress,
      txHash: deployTxHash,
    },
    explorer: {
      contract: `${ARBITRUM_SEPOLIA_CONFIG.explorerUrl}/address/${contractAddress}`,
      tx: `${ARBITRUM_SEPOLIA_CONFIG.explorerUrl}/tx/${deployTxHash}`,
    },
  };

  // Save to file
  const deploymentPath = path.join(__dirname, '../erc8004-deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  // Save ABI for reference
  const abiPath = path.join(__dirname, '../contracts/ERC8004AgentRegistry.abi.json');
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💾 Deployment info saved to erc8004-deployment.json');
  console.log('📄 ABI saved to contracts/ERC8004AgentRegistry.abi.json\n');
  
  console.log('📝 Add to your .env file:\n');
  console.log(`ERC8004_REGISTRY_ADDRESS=${contractAddress}`);
  console.log(`ARBITRUM_SEPOLIA_RPC=${rpcUrl}\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return deploymentInfo;
}

async function registerInitialAgents(contractAddress: string) {
  console.log('🤖 Registering initial agents...\n');
  
  const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC || ARBITRUM_SEPOLIA_CONFIG.rpcUrl;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey!, provider);

  // Load ABI
  const abiPath = path.join(__dirname, '../contracts/ERC8004AgentRegistry.abi.json');
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  // Register @auriga - Aggressive Transit Scoring agent
  console.log('  Registering @auriga...');
  const tx1 = await contract.registerAgent(
    '@auriga',
    '' // Metadata URI can be added later via updateAgentProfile
  );
  await tx1.wait();
  console.log('  ✅ @auriga registered (Agent ID: 1)');

  // Register @nova - Conservative Transit Analysis agent
  console.log('  Registering @nova...');
  const tx2 = await contract.registerAgent(
    '@nova',
    '' // Metadata URI can be added later via updateAgentProfile
  );
  await tx2.wait();
  console.log('  ✅ @nova registered (Agent ID: 2)');

  // Validate both agents
  console.log('\n  Validating agents...');
  await (await contract.validateAgent(1, true, 'Initial validation')).wait();
  await (await contract.validateAgent(2, true, 'Initial validation')).wait();
  console.log('  ✅ Both agents validated\n');

  console.log('✅ Initial agents registered and validated\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--register-agents')) {
    // Just register agents on existing contract
    const address = process.env.ERC8004_REGISTRY_ADDRESS;
    if (!address) {
      console.error('❌ ERC8004_REGISTRY_ADDRESS not set');
      process.exit(1);
    }
    await registerInitialAgents(address);
  } else if (args.includes('--compile-only')) {
    // Just compile
    await compileContract();
    console.log('✅ Compilation complete');
  } else {
    // Full deployment
    const deployment = await deployContract();
    
    if (args.includes('--with-agents')) {
      await registerInitialAgents(deployment.contract.address);
    }
  }
}

main()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });

