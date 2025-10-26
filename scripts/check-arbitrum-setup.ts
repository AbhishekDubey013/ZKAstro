/**
 * Check Arbitrum Sepolia Setup
 * Verifies that everything is ready for Stylus deployment
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const checks: CheckResult[] = [];

async function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');

  // Check private key
  if (process.env.AGENT_DEPLOYER_PRIVATE_KEY) {
    checks.push({
      name: 'Private Key',
      status: 'pass',
      message: 'AGENT_DEPLOYER_PRIVATE_KEY is set',
    });
  } else {
    checks.push({
      name: 'Private Key',
      status: 'fail',
      message: 'AGENT_DEPLOYER_PRIVATE_KEY is not set',
    });
  }

  // Check RPC URL
  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
  checks.push({
    name: 'RPC URL',
    status: 'pass',
    message: `Using: ${rpcUrl}`,
  });

  // Check contract address (optional for first deployment)
  if (process.env.CHART_REGISTRY_ADDRESS) {
    checks.push({
      name: 'Contract Address',
      status: 'warning',
      message: 'Already deployed - will skip deployment',
    });
  } else {
    checks.push({
      name: 'Contract Address',
      status: 'pass',
      message: 'Not set - ready for fresh deployment',
    });
  }
}

async function checkWalletBalance() {
  console.log('💰 Checking wallet balance...\n');

  try {
    const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      checks.push({
        name: 'Wallet Balance',
        status: 'fail',
        message: 'Cannot check - private key not set',
      });
      return;
    }

    const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);

    console.log(`  Address: ${wallet.address}`);
    console.log(`  Balance: ${balanceEth} ETH\n`);

    if (parseFloat(balanceEth) >= 0.01) {
      checks.push({
        name: 'Wallet Balance',
        status: 'pass',
        message: `${balanceEth} ETH - sufficient for deployment`,
      });
    } else if (parseFloat(balanceEth) > 0) {
      checks.push({
        name: 'Wallet Balance',
        status: 'warning',
        message: `${balanceEth} ETH - might be low for deployment`,
      });
    } else {
      checks.push({
        name: 'Wallet Balance',
        status: 'fail',
        message: 'No ETH - get funds from faucet',
      });
    }
  } catch (error: any) {
    checks.push({
      name: 'Wallet Balance',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
  }
}

async function checkRustToolchain() {
  console.log('🦀 Checking Rust toolchain...\n');

  try {
    const { execSync } = await import('child_process');

    // Check rustc
    try {
      const rustVersion = execSync('rustc --version', { encoding: 'utf-8' });
      checks.push({
        name: 'Rust Compiler',
        status: 'pass',
        message: rustVersion.trim(),
      });
    } catch {
      checks.push({
        name: 'Rust Compiler',
        status: 'fail',
        message: 'Not installed - run: curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      });
    }

    // Check cargo
    try {
      const cargoVersion = execSync('cargo --version', { encoding: 'utf-8' });
      checks.push({
        name: 'Cargo',
        status: 'pass',
        message: cargoVersion.trim(),
      });
    } catch {
      checks.push({
        name: 'Cargo',
        status: 'fail',
        message: 'Not installed',
      });
    }

    // Check WASM target
    try {
      const targets = execSync('rustup target list --installed', { encoding: 'utf-8' });
      if (targets.includes('wasm32-unknown-unknown')) {
        checks.push({
          name: 'WASM Target',
          status: 'pass',
          message: 'wasm32-unknown-unknown installed',
        });
      } else {
        checks.push({
          name: 'WASM Target',
          status: 'fail',
          message: 'Not installed - run: rustup target add wasm32-unknown-unknown',
        });
      }
    } catch {
      checks.push({
        name: 'WASM Target',
        status: 'fail',
        message: 'Cannot check - rustup not available',
      });
    }

    // Check cargo-stylus
    try {
      const stylusVersion = execSync('cargo stylus --version', { encoding: 'utf-8' });
      checks.push({
        name: 'cargo-stylus',
        status: 'pass',
        message: stylusVersion.trim(),
      });
    } catch {
      checks.push({
        name: 'cargo-stylus',
        status: 'fail',
        message: 'Not installed - run: cargo install --force cargo-stylus',
      });
    }
  } catch (error: any) {
    checks.push({
      name: 'Rust Toolchain',
      status: 'fail',
      message: `Error checking: ${error.message}`,
    });
  }
}

async function checkContractFiles() {
  console.log('📁 Checking contract files...\n');

  // Check Rust contract
  const rustContractPath = path.join(process.cwd(), 'contracts/ChartRegistry.rs');
  if (fs.existsSync(rustContractPath)) {
    checks.push({
      name: 'Rust Contract',
      status: 'pass',
      message: 'ChartRegistry.rs exists',
    });
  } else {
    checks.push({
      name: 'Rust Contract',
      status: 'fail',
      message: 'ChartRegistry.rs not found',
    });
  }

  // Check Cargo.toml
  const cargoTomlPath = path.join(process.cwd(), 'contracts/Cargo.toml');
  if (fs.existsSync(cargoTomlPath)) {
    checks.push({
      name: 'Cargo Config',
      status: 'pass',
      message: 'Cargo.toml exists',
    });
  } else {
    checks.push({
      name: 'Cargo Config',
      status: 'fail',
      message: 'Cargo.toml not found',
    });
  }

  // Check deployment script
  const deployScriptPath = path.join(process.cwd(), 'contracts/deploy-stylus.ts');
  if (fs.existsSync(deployScriptPath)) {
    checks.push({
      name: 'Deploy Script',
      status: 'pass',
      message: 'deploy-stylus.ts exists',
    });
  } else {
    checks.push({
      name: 'Deploy Script',
      status: 'fail',
      message: 'deploy-stylus.ts not found',
    });
  }
}

async function checkNetworkConnection() {
  console.log('🌐 Checking network connection...\n');

  try {
    const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const blockNumber = await provider.getBlockNumber();

    checks.push({
      name: 'Network Connection',
      status: 'pass',
      message: `Connected to Arbitrum Sepolia (block ${blockNumber})`,
    });
  } catch (error: any) {
    checks.push({
      name: 'Network Connection',
      status: 'fail',
      message: `Cannot connect: ${error.message}`,
    });
  }
}

function printResults() {
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Setup Check Results');
  console.log('═══════════════════════════════════════\n');

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}\n`);

    if (check.status === 'pass') passCount++;
    else if (check.status === 'fail') failCount++;
    else warningCount++;
  });

  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('═══════════════════════════════════════\n');

  if (failCount === 0) {
    console.log('🎉 All checks passed! Ready to deploy to Arbitrum Sepolia!\n');
    console.log('Next steps:');
    console.log('  1. npm run stylus:build');
    console.log('  2. npm run deploy:stylus:testnet\n');
    return true;
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above before deploying.\n');
    console.log('Need help? Check DEPLOYMENT_CHECKLIST.md\n');
    return false;
  }
}

async function main() {
  console.log('🎨 Arbitrum Stylus Setup Checker');
  console.log('═══════════════════════════════════════\n');

  await checkEnvironmentVariables();
  await checkWalletBalance();
  await checkRustToolchain();
  await checkContractFiles();
  await checkNetworkConnection();

  const ready = printResults();
  process.exit(ready ? 0 : 1);
}

main().catch(console.error);

