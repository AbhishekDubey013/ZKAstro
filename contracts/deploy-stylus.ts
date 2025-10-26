/**
 * Deploy ChartRegistry using Arbitrum Stylus
 * 
 * Stylus provides:
 * - 10-100x cheaper gas costs
 * - Better performance for cryptographic operations
 * - Memory-safe Rust implementation
 */

import { execSync } from 'child_process';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const ARBITRUM_SEPOLIA_RPC = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
const ARBITRUM_ONE_RPC = process.env.ARBITRUM_ONE_RPC || 'https://arb1.arbitrum.io/rpc';
const PRIVATE_KEY = process.env.AGENT_DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ AGENT_DEPLOYER_PRIVATE_KEY environment variable not set');
  process.exit(1);
}

interface DeploymentConfig {
  network: 'arbitrum-sepolia' | 'arbitrum-one';
  rpcUrl: string;
}

async function buildStylusContract(): Promise<string> {
  console.log('🔨 Building Stylus contract...');
  
  try {
    // Build the contract with optimizations
    execSync('cargo build --release --target wasm32-unknown-unknown', {
      cwd: path.join(__dirname),
      stdio: 'inherit',
    });

    // Get the WASM file path
    const wasmPath = path.join(
      __dirname,
      '../target/wasm32-unknown-unknown/release/chart_registry_stylus.wasm'
    );

    if (!fs.existsSync(wasmPath)) {
      throw new Error('WASM file not found after build');
    }

    console.log('✅ Contract built successfully');
    return wasmPath;
  } catch (error) {
    console.error('❌ Failed to build contract:', error);
    throw error;
  }
}

async function deployStylusContract(
  wasmPath: string,
  config: DeploymentConfig
): Promise<string> {
  console.log(`🚀 Deploying to ${config.network}...`);

  try {
    // Use cargo-stylus CLI for deployment
    const deployCmd = `cargo stylus deploy \
      --private-key ${PRIVATE_KEY} \
      --endpoint ${config.rpcUrl} \
      --wasm-file ${wasmPath}`;

    const output = execSync(deployCmd, {
      cwd: path.join(__dirname),
      encoding: 'utf-8',
    });

    // Parse contract address from output
    const addressMatch = output.match(/deployed at: (0x[a-fA-F0-9]{40})/);
    if (!addressMatch) {
      throw new Error('Could not parse contract address from deployment output');
    }

    const contractAddress = addressMatch[1];
    console.log(`✅ Contract deployed at: ${contractAddress}`);

    return contractAddress;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

async function initializeContract(
  contractAddress: string,
  config: DeploymentConfig
): Promise<void> {
  console.log('🔧 Initializing contract...');

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // ABI for the init function
  const abi = [
    'function init() external',
  ];

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  try {
    const tx = await contract.init();
    console.log(`  Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Contract initialized (block ${receipt.blockNumber})`);
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    throw error;
  }
}

async function verifyDeployment(
  contractAddress: string,
  config: DeploymentConfig
): Promise<void> {
  console.log('🔍 Verifying deployment...');

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  // Check if contract exists
  const code = await provider.getCode(contractAddress);
  if (code === '0x') {
    throw new Error('No code at contract address');
  }

  console.log(`✅ Contract verified at ${contractAddress}`);
  console.log(`  Code size: ${(code.length - 2) / 2} bytes`);
}

async function saveDeploymentInfo(
  contractAddress: string,
  network: string
): Promise<void> {
  const deploymentInfo = {
    network,
    contractAddress,
    deployedAt: new Date().toISOString(),
    contractType: 'ChartRegistry',
    implementation: 'Arbitrum Stylus (Rust/WASM)',
  };

  const outputPath = path.join(__dirname, `deployment-${network}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`📝 Deployment info saved to ${outputPath}`);
  console.log('\n📋 Add this to your .env file:');
  console.log(`CHART_REGISTRY_ADDRESS=${contractAddress}`);
  console.log(`ARBITRUM_NETWORK=${network}`);
}

async function main() {
  const network = process.argv[2] as 'arbitrum-sepolia' | 'arbitrum-one' || 'arbitrum-sepolia';
  
  const config: DeploymentConfig = {
    network,
    rpcUrl: network === 'arbitrum-one' ? ARBITRUM_ONE_RPC : ARBITRUM_SEPOLIA_RPC,
  };

  console.log('🎨 Arbitrum Stylus Deployment');
  console.log('═══════════════════════════════════════');
  console.log(`Network: ${config.network}`);
  console.log(`RPC: ${config.rpcUrl}`);
  console.log('═══════════════════════════════════════\n');

  try {
    // Step 1: Build the contract
    const wasmPath = await buildStylusContract();

    // Step 2: Deploy the contract
    const contractAddress = await deployStylusContract(wasmPath, config);

    // Step 3: Initialize the contract
    await initializeContract(contractAddress, config);

    // Step 4: Verify deployment
    await verifyDeployment(contractAddress, config);

    // Step 5: Save deployment info
    await saveDeploymentInfo(contractAddress, network);

    console.log('\n✨ Deployment complete!');
    console.log('\n🎯 Benefits of Stylus:');
    console.log('  • 10-100x cheaper gas costs');
    console.log('  • Faster execution for ZK operations');
    console.log('  • Memory-safe Rust implementation');
    console.log('  • Better performance overall');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
main().catch(console.error);

