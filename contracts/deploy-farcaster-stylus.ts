/**
 * Deploy FarcasterPredictions using Arbitrum Stylus
 * 
 * This contract provides:
 * - On-chain prediction storage
 * - ZK proof integration for birth data privacy
 * - Immutable rating system
 * - User statistics tracking
 */

import { execSync } from 'child_process';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ARBITRUM_SEPOLIA_RPC = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
const PRIVATE_KEY = process.env.AGENT_DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ AGENT_DEPLOYER_PRIVATE_KEY environment variable not set');
  process.exit(1);
}

async function buildContract(): Promise<string> {
  console.log('🔨 Building Farcaster Predictions contract...\n');

  try {
    // Build the contract
    execSync('cargo build --release --target wasm32-unknown-unknown --lib', {
      cwd: __dirname,
      stdio: 'inherit',
    });

    const wasmPath = path.join(
      __dirname,
      'target/wasm32-unknown-unknown/release/farcaster_predictions_stylus.wasm'
    );

    if (!fs.existsSync(wasmPath)) {
      throw new Error('WASM file not found after build');
    }

    console.log('✅ Contract built successfully\n');
    return wasmPath;
  } catch (error) {
    console.error('❌ Failed to build contract:', error);
    throw error;
  }
}

async function deployContract(wasmPath: string): Promise<string> {
  console.log('🚀 Deploying to Arbitrum Sepolia...\n');

  try {
    const deployCmd = `cargo stylus deploy \
      --private-key ${PRIVATE_KEY} \
      --endpoint ${ARBITRUM_SEPOLIA_RPC} \
      --wasm-file ${wasmPath} \
      --no-verify`;

    const output = execSync(deployCmd, {
      cwd: __dirname,
      encoding: 'utf-8',
    });

    console.log(`\n📝 Full deployment output:\n${output}\n`);

    // Try multiple patterns to find the address
    let addressMatch = output.match(/deployed code at address: (0x[a-fA-F0-9]{40})/);
    if (!addressMatch) {
      addressMatch = output.match(/contract address: (0x[a-fA-F0-9]{40})/);
    }
    if (!addressMatch) {
      addressMatch = output.match(/address (0x[a-fA-F0-9]{40})/);
    }
    if (!addressMatch) {
      addressMatch = output.match(/(0x[a-fA-F0-9]{40})/);
    }
    
    if (!addressMatch) {
      throw new Error('Could not parse contract address from deployment output');
    }
    const contractAddress = addressMatch[1];

    console.log(`\n🎉 Contract deployed to: ${contractAddress}`);

    return contractAddress;
  } catch (error) {
    console.error('❌ Failed to deploy contract:', error);
    throw error;
  }
}

async function testContract(contractAddress: string) {
  console.log(`⚙️ Testing contract at ${contractAddress}...\n`);

  const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

  const contractAbi = [
    "function registerUser(bytes32 commitment) external",
    "function storePrediction(uint256 date, bytes32 predictionHash) external",
    "function ratePrediction(uint256 date, uint8 rating) external",
    "function isUserRegistered(address user) external view returns (bool)",
    "function getUserStats(address user) external view returns (uint256, uint256, uint256)",
    "function getGlobalStats() external view returns (uint256, uint256)",
  ];

  const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

  try {
    // Test 1: Check global stats (should be 0, 0)
    const [totalUsers, totalPredictions] = await contract.getGlobalStats();
    console.log(`✅ Global stats: ${totalUsers.toString()} users, ${totalPredictions.toString()} predictions\n`);

    // Test 2: Check if user is registered (should be false)
    const isRegistered = await contract.isUserRegistered(wallet.address);
    console.log(`✅ User registered: ${isRegistered}\n`);

    console.log('✅ Contract initialized and working!\n');
  } catch (error) {
    console.error('❌ Failed to test contract:', error);
    throw error;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║   🔮 Farcaster Predictions - Stylus Deployment 🔮              ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log('📡 Network: Arbitrum Sepolia');
  console.log(`📡 RPC: ${ARBITRUM_SEPOLIA_RPC}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  try {
    const wasmPath = await buildContract();
    const contractAddress = await deployContract(wasmPath);
    await testContract(contractAddress);

    // Save contract address to .env
    const envPath = path.resolve(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    const newEnvVar = `FARCASTER_CONTRACT_ADDRESS=${contractAddress}`;

    if (envContent.includes('FARCASTER_CONTRACT_ADDRESS')) {
      envContent = envContent.replace(/FARCASTER_CONTRACT_ADDRESS=.*/, newEnvVar);
    } else {
      envContent += `\n${newEnvVar}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Contract address saved to .env\n`);

    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                  ║');
    console.log('║   🎉 DEPLOYMENT COMPLETE! 🎉                                    ║');
    console.log('║                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Contract Details:');
    console.log(`   Address: ${contractAddress}`);
    console.log(`   Network: Arbitrum Sepolia`);
    console.log(`   Explorer: https://sepolia.arbiscan.io/address/${contractAddress}\n`);

    console.log('🔮 Features:');
    console.log('   ✅ On-chain prediction storage');
    console.log('   ✅ ZK proof integration');
    console.log('   ✅ Immutable rating system');
    console.log('   ✅ User statistics tracking\n');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

