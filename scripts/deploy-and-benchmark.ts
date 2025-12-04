/**
 * Deploy Solidity Contract and Run Real Benchmark
 * 
 * This script:
 * 1. Compiles ChartRegistrySolidity.sol using solc
 * 2. Deploys it to Arbitrum Sepolia
 * 3. Runs identical operations on both Stylus and Solidity contracts
 * 4. Generates a real comparison report
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import solc from 'solc';

// Contract ABIs
const STYLUS_ABI = [
  "function init() external",
  "function registerChart(string chartId, bytes32 chartHash, address user, bool zkVerified) external returns (bool)",
  "function verifyChart(string chartId, bytes32 chartHash) external view returns (bool)",
  "function getChartHash(string chartId) external view returns (bytes32)",
  "function totalCharts() external view returns (uint256)",
  "function markAsVerified(string chartId) external returns (bool)",
  "function chartExists(string chartId) external view returns (bool)"
];

const SOLIDITY_ABI = [
  "constructor()",
  "function init() external",
  "function registerChart(string calldata chartId, bytes32 chartHash, address user, bool zkVerified) external returns (bool)",
  "function verifyChart(string calldata chartId, bytes32 chartHash) external view returns (bool)",
  "function getChartHash(string calldata chartId) external view returns (bytes32)",
  "function totalCharts() external view returns (uint256)",
  "function markAsVerified(string calldata chartId) external returns (bool)",
  "function chartExists(string calldata chartId) external view returns (bool)"
];

interface BenchmarkResult {
  operation: string;
  stylusGas: bigint;
  solidityGas: bigint;
  savings: number;
  stylusTx: string;
  solidityTx: string;
}

function compileSolidity(): { abi: any; bytecode: string } {
  console.log('📦 Compiling Solidity contract...');
  
  const contractPath = path.join(process.cwd(), 'contracts', 'ChartRegistrySolidity.sol');
  const source = fs.readFileSync(contractPath, 'utf-8');
  
  const input = {
    language: 'Solidity',
    sources: {
      'ChartRegistrySolidity.sol': {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:', errors);
      throw new Error('Compilation failed');
    }
  }
  
  const contract = output.contracts['ChartRegistrySolidity.sol']['ChartRegistrySolidity'];
  
  console.log('✅ Compilation successful!\n');
  
  return {
    abi: contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object
  };
}

function generateRandomChartId(): string {
  return `chart_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function generateRandomHash(): string {
  return ethers.keccak256(ethers.toUtf8Bytes(Math.random().toString()));
}

async function main() {
  const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC;
  const PRIVATE_KEY = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  const STYLUS_ADDRESS = process.env.CHART_REGISTRY_ADDRESS;
  
  if (!RPC_URL || !PRIVATE_KEY || !STYLUS_ADDRESS) {
    console.error('Missing environment variables');
    console.error('Required: ARBITRUM_SEPOLIA_RPC, AGENT_DEPLOYER_PRIVATE_KEY, CHART_REGISTRY_ADDRESS');
    process.exit(1);
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('🔥 STYLUS vs SOLIDITY REAL BENCHMARK');
  console.log('═'.repeat(70));
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`\n📍 Network: Arbitrum Sepolia`);
  console.log(`📍 Wallet: ${wallet.address}`);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`📍 Balance: ${ethers.formatEther(balance)} ETH\n`);
  
  // Compile Solidity contract
  const { abi, bytecode } = compileSolidity();
  
  // Check if Solidity contract already deployed
  let solidityAddress = process.env.SOLIDITY_CHART_REGISTRY_ADDRESS;
  
  if (!solidityAddress || solidityAddress === '0x...') {
    console.log('🚀 Deploying Solidity contract...');
    
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    const gasPrice = (await provider.getFeeData()).gasPrice;
    console.log(`   Gas price: ${ethers.formatUnits(gasPrice || 0n, 'gwei')} gwei`);
    
    const deployTx = await factory.deploy({
      gasLimit: 3000000n,
      gasPrice: gasPrice ? gasPrice * 2n : undefined
    });
    
    console.log(`   Deploy TX: ${deployTx.deploymentTransaction()?.hash}`);
    
    await deployTx.waitForDeployment();
    solidityAddress = await deployTx.getAddress();
    
    console.log(`✅ Solidity deployed to: ${solidityAddress}\n`);
    
    // Save to .env
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('SOLIDITY_CHART_REGISTRY_ADDRESS=')) {
      envContent = envContent.replace(/SOLIDITY_CHART_REGISTRY_ADDRESS=.*/, `SOLIDITY_CHART_REGISTRY_ADDRESS=${solidityAddress}`);
    } else {
      envContent += `\nSOLIDITY_CHART_REGISTRY_ADDRESS=${solidityAddress}\n`;
    }
    fs.writeFileSync(envPath, envContent);
  } else {
    console.log(`📍 Using existing Solidity contract: ${solidityAddress}\n`);
  }
  
  // Create contract instances
  const stylusContract = new ethers.Contract(STYLUS_ADDRESS, STYLUS_ABI, wallet);
  const solidityContract = new ethers.Contract(solidityAddress, abi, wallet);
  
  console.log('═'.repeat(70));
  console.log('📊 RUNNING BENCHMARKS');
  console.log('═'.repeat(70));
  
  const results: BenchmarkResult[] = [];
  
  // ============================================
  // TEST 1: Register Chart
  // ============================================
  console.log('\n🧪 Test 1: Register Chart');
  console.log('─'.repeat(50));
  
  try {
    const chartId1 = generateRandomChartId();
    const chartId2 = generateRandomChartId();
    const chartHash = generateRandomHash();
    
    // Stylus
    console.log('   Running Stylus...');
    const stylusTx = await stylusContract.registerChart(chartId1, chartHash, wallet.address, true);
    const stylusReceipt = await stylusTx.wait();
    const stylusGas = stylusReceipt.gasUsed;
    
    // Solidity
    console.log('   Running Solidity...');
    const solidityTx = await solidityContract.registerChart(chartId2, chartHash, wallet.address, true);
    const solidityReceipt = await solidityTx.wait();
    const solidityGas = solidityReceipt.gasUsed;
    
    const savings = Number((solidityGas - stylusGas) * 100n / solidityGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusGas.toLocaleString()} gas`);
    console.log(`   🔷 Solidity: ${solidityGas.toLocaleString()} gas`);
    console.log(`   💰 Savings:  ${savings.toFixed(1)}% ${savings > 0 ? '✅' : '⚠️'}`);
    
    results.push({
      operation: 'registerChart',
      stylusGas,
      solidityGas,
      savings,
      stylusTx: stylusReceipt.hash,
      solidityTx: solidityReceipt.hash
    });
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}`);
  }
  
  // ============================================
  // TEST 2: Verify Chart (View)
  // ============================================
  console.log('\n🧪 Test 2: Verify Chart (View Call)');
  console.log('─'.repeat(50));
  
  try {
    // Register charts first
    const chartId1 = generateRandomChartId();
    const chartId2 = generateRandomChartId();
    const chartHash = generateRandomHash();
    
    await (await stylusContract.registerChart(chartId1, chartHash, wallet.address, true)).wait();
    await (await solidityContract.registerChart(chartId2, chartHash, wallet.address, true)).wait();
    
    // Estimate gas for view calls
    console.log('   Estimating gas...');
    const stylusGas = await stylusContract.verifyChart.estimateGas(chartId1, chartHash);
    const solidityGas = await solidityContract.verifyChart.estimateGas(chartId2, chartHash);
    
    const savings = Number((solidityGas - stylusGas) * 100n / solidityGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusGas.toLocaleString()} gas`);
    console.log(`   🔷 Solidity: ${solidityGas.toLocaleString()} gas`);
    console.log(`   💰 Savings:  ${savings.toFixed(1)}% ${savings > 0 ? '✅' : '⚠️'}`);
    
    results.push({
      operation: 'verifyChart (view)',
      stylusGas,
      solidityGas,
      savings,
      stylusTx: 'view-call',
      solidityTx: 'view-call'
    });
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}`);
  }
  
  // ============================================
  // TEST 3: Get Chart Hash (View)
  // ============================================
  console.log('\n🧪 Test 3: Get Chart Hash (View Call)');
  console.log('─'.repeat(50));
  
  try {
    const chartId1 = generateRandomChartId();
    const chartId2 = generateRandomChartId();
    const chartHash = generateRandomHash();
    
    await (await stylusContract.registerChart(chartId1, chartHash, wallet.address, true)).wait();
    await (await solidityContract.registerChart(chartId2, chartHash, wallet.address, true)).wait();
    
    console.log('   Estimating gas...');
    const stylusGas = await stylusContract.getChartHash.estimateGas(chartId1);
    const solidityGas = await solidityContract.getChartHash.estimateGas(chartId2);
    
    const savings = Number((solidityGas - stylusGas) * 100n / solidityGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusGas.toLocaleString()} gas`);
    console.log(`   🔷 Solidity: ${solidityGas.toLocaleString()} gas`);
    console.log(`   💰 Savings:  ${savings.toFixed(1)}% ${savings > 0 ? '✅' : '⚠️'}`);
    
    results.push({
      operation: 'getChartHash (view)',
      stylusGas,
      solidityGas,
      savings,
      stylusTx: 'view-call',
      solidityTx: 'view-call'
    });
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}`);
  }
  
  // ============================================
  // TEST 4: Batch Registration (5 charts)
  // ============================================
  console.log('\n🧪 Test 4: Batch Registration (5 charts)');
  console.log('─'.repeat(50));
  
  try {
    let stylusTotalGas = 0n;
    let solidityTotalGas = 0n;
    let firstStylusTx = '';
    let firstSolidityTx = '';
    
    for (let i = 0; i < 5; i++) {
      const chartHash = generateRandomHash();
      
      // Stylus
      const stylusTx = await stylusContract.registerChart(
        generateRandomChartId(), chartHash, wallet.address, true
      );
      const stylusReceipt = await stylusTx.wait();
      stylusTotalGas += stylusReceipt.gasUsed;
      if (i === 0) firstStylusTx = stylusReceipt.hash;
      
      // Solidity
      const solidityTx = await solidityContract.registerChart(
        generateRandomChartId(), chartHash, wallet.address, true
      );
      const solidityReceipt = await solidityTx.wait();
      solidityTotalGas += solidityReceipt.gasUsed;
      if (i === 0) firstSolidityTx = solidityReceipt.hash;
      
      process.stdout.write(`   Progress: ${i + 1}/5\r`);
    }
    console.log('');
    
    const savings = Number((solidityTotalGas - stylusTotalGas) * 100n / solidityTotalGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusTotalGas.toLocaleString()} gas (total)`);
    console.log(`   🔷 Solidity: ${solidityTotalGas.toLocaleString()} gas (total)`);
    console.log(`   💰 Savings:  ${savings.toFixed(1)}% ${savings > 0 ? '✅' : '⚠️'}`);
    
    results.push({
      operation: 'registerChart (5x batch)',
      stylusGas: stylusTotalGas,
      solidityGas: solidityTotalGas,
      savings,
      stylusTx: firstStylusTx,
      solidityTx: firstSolidityTx
    });
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}`);
  }
  
  // ============================================
  // TEST 5: Mark as Verified
  // ============================================
  console.log('\n🧪 Test 5: Mark as Verified');
  console.log('─'.repeat(50));
  
  try {
    const chartId1 = generateRandomChartId();
    const chartId2 = generateRandomChartId();
    const chartHash = generateRandomHash();
    
    // Register first (not verified)
    await (await stylusContract.registerChart(chartId1, chartHash, wallet.address, false)).wait();
    await (await solidityContract.registerChart(chartId2, chartHash, wallet.address, false)).wait();
    
    // Mark as verified
    console.log('   Running markAsVerified...');
    const stylusTx = await stylusContract.markAsVerified(chartId1);
    const stylusReceipt = await stylusTx.wait();
    const stylusGas = stylusReceipt.gasUsed;
    
    const solidityTx = await solidityContract.markAsVerified(chartId2);
    const solidityReceipt = await solidityTx.wait();
    const solidityGas = solidityReceipt.gasUsed;
    
    const savings = Number((solidityGas - stylusGas) * 100n / solidityGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusGas.toLocaleString()} gas`);
    console.log(`   🔷 Solidity: ${solidityGas.toLocaleString()} gas`);
    console.log(`   💰 Savings:  ${savings.toFixed(1)}% ${savings > 0 ? '✅' : '⚠️'}`);
    
    results.push({
      operation: 'markAsVerified',
      stylusGas,
      solidityGas,
      savings,
      stylusTx: stylusReceipt.hash,
      solidityTx: solidityReceipt.hash
    });
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}`);
  }
  
  // ============================================
  // SUMMARY
  // ============================================
  if (results.length === 0) {
    console.error('\n❌ No results collected');
    return;
  }
  
  const totalStylusGas = results.reduce((sum, r) => sum + r.stylusGas, 0n);
  const totalSolidityGas = results.reduce((sum, r) => sum + r.solidityGas, 0n);
  const overallSavings = Number((totalSolidityGas - totalStylusGas) * 100n / totalSolidityGas);
  const avgSavings = results.reduce((sum, r) => sum + r.savings, 0) / results.length;
  
  console.log('\n' + '═'.repeat(70));
  console.log('📈 BENCHMARK SUMMARY (REAL DATA)');
  console.log('═'.repeat(70));
  
  console.log(`\n📊 Total Gas Comparison:`);
  console.log(`   ⚡ Stylus:   ${totalStylusGas.toLocaleString()} gas`);
  console.log(`   🔷 Solidity: ${totalSolidityGas.toLocaleString()} gas`);
  console.log(`   📉 Saved:    ${(totalSolidityGas - totalStylusGas).toLocaleString()} gas`);
  
  console.log(`\n💰 Savings:`);
  console.log(`   Overall:    ${overallSavings.toFixed(1)}%`);
  console.log(`   Average:    ${avgSavings.toFixed(1)}%`);
  console.log(`   Best:       ${Math.max(...results.map(r => r.savings)).toFixed(1)}%`);
  console.log(`   Worst:      ${Math.min(...results.map(r => r.savings)).toFixed(1)}%`);
  
  // Cost projection
  const gasPrice = (await provider.getFeeData()).gasPrice || 100000000n;
  const ethPrice = 3500;
  
  const stylusCost = Number(ethers.formatEther(totalStylusGas * gasPrice)) * ethPrice;
  const solidityCost = Number(ethers.formatEther(totalSolidityGas * gasPrice)) * ethPrice;
  
  console.log(`\n💵 Cost at ${ethers.formatUnits(gasPrice, 'gwei')} gwei (~$${ethPrice} ETH):`);
  console.log(`   Stylus:     $${stylusCost.toFixed(6)}`);
  console.log(`   Solidity:   $${solidityCost.toFixed(6)}`);
  console.log(`   Saved:      $${(solidityCost - stylusCost).toFixed(6)}`);
  
  // Scale projection
  const perOpSaving = (solidityCost - stylusCost) / results.length;
  console.log(`\n🚀 At Scale (1M operations):`);
  console.log(`   Projected savings: $${(perOpSaving * 1000000).toFixed(2)}`);
  
  console.log('\n' + '═'.repeat(70));
  
  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    network: 'Arbitrum Sepolia',
    stylusAddress: STYLUS_ADDRESS,
    solidityAddress: solidityAddress,
    methodology: 'Real transactions on both Stylus and Solidity contracts',
    results: results.map(r => ({
      ...r,
      stylusGas: r.stylusGas.toString(),
      solidityGas: r.solidityGas.toString()
    })),
    summary: {
      totalStylusGas: totalStylusGas.toString(),
      totalSolidityGas: totalSolidityGas.toString(),
      overallSavings,
      averageSavings: avgSavings,
      maxSavings: Math.max(...results.map(r => r.savings)),
      minSavings: Math.min(...results.map(r => r.savings)),
      gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei')
    }
  };
  
  const reportPath = path.join(process.cwd(), 'benchmark-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Results saved to: ${reportPath}`);
  
  // Generate markdown
  const md = `# 🔥 Stylus vs Solidity REAL Benchmark Results

## Overview

| Property | Value |
|----------|-------|
| **Date** | ${new Date().toLocaleString()} |
| **Network** | Arbitrum Sepolia |
| **Stylus Contract** | \`${STYLUS_ADDRESS}\` |
| **Solidity Contract** | \`${solidityAddress}\` |
| **Methodology** | Real transactions on both contracts |

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| **Overall Gas Savings** | **${overallSavings.toFixed(1)}%** |
| **Average per Operation** | ${avgSavings.toFixed(1)}% |
| **Best Case** | ${Math.max(...results.map(r => r.savings)).toFixed(1)}% |
| **Worst Case** | ${Math.min(...results.map(r => r.savings)).toFixed(1)}% |
| **Total Stylus Gas** | ${totalStylusGas.toLocaleString()} |
| **Total Solidity Gas** | ${totalSolidityGas.toLocaleString()} |

## 📈 Detailed Results

| Operation | Stylus Gas | Solidity Gas | Savings | Stylus TX | Solidity TX |
|-----------|------------|--------------|---------|-----------|-------------|
${results.map(r => `| ${r.operation} | ${r.stylusGas.toLocaleString()} | ${r.solidityGas.toLocaleString()} | **${r.savings.toFixed(1)}%** | ${r.stylusTx === 'view-call' ? 'view' : `[tx](https://sepolia.arbiscan.io/tx/${r.stylusTx})`} | ${r.solidityTx === 'view-call' ? 'view' : `[tx](https://sepolia.arbiscan.io/tx/${r.solidityTx})`} |`).join('\n')}

## 💰 Cost Analysis

At current gas price (${ethers.formatUnits(gasPrice, 'gwei')} gwei) and ~$${ethPrice} ETH:

| Metric | Cost |
|--------|------|
| Stylus Total | $${stylusCost.toFixed(6)} |
| Solidity Total | $${solidityCost.toFixed(6)} |
| **Savings** | **$${(solidityCost - stylusCost).toFixed(6)}** |
| **1M Operations** | **~$${(perOpSaving * 1000000).toFixed(2)}** |

## 🔗 Verify On-Chain

- [Stylus Contract](https://sepolia.arbiscan.io/address/${STYLUS_ADDRESS})
- [Solidity Contract](https://sepolia.arbiscan.io/address/${solidityAddress})

---

*Real benchmark data from Arbitrum Sepolia*
`;
  
  const mdPath = path.join(process.cwd(), 'BENCHMARK_RESULTS.md');
  fs.writeFileSync(mdPath, md);
  console.log(`📄 Markdown report: ${mdPath}\n`);
}

main().catch(console.error);

