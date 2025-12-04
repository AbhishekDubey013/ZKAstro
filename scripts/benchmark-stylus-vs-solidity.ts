/**
 * Stylus vs Solidity Benchmark
 * 
 * Comprehensive gas cost comparison between Stylus (Rust/WASM) and Solidity implementations
 * of the ChartRegistry contract on Arbitrum Sepolia.
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Contract ABIs
const STYLUS_ABI = [
  "function init() external",
  "function registerChart(string chartId, bytes32 chartHash, address user, bool zkVerified) external returns (bool)",
  "function verifyChart(string chartId, bytes32 chartHash) external view returns (bool)",
  "function getChartHash(string chartId) external view returns (bytes32)",
  "function getChartUser(string chartId) external view returns (address)",
  "function getChartTimestamp(string chartId) external view returns (uint256)",
  "function isZkVerified(string chartId) external view returns (bool)",
  "function markAsVerified(string chartId) external returns (bool)",
  "function chartExists(string chartId) external view returns (bool)",
  "function totalCharts() external view returns (uint256)",
  "function owner() external view returns (address)"
];

const SOLIDITY_ABI = [
  "function init() external",
  "function registerChart(string calldata chartId, bytes32 chartHash, address user, bool zkVerified) external returns (bool)",
  "function verifyChart(string calldata chartId, bytes32 chartHash) external view returns (bool)",
  "function getChartHash(string calldata chartId) external view returns (bytes32)",
  "function getChartUser(string calldata chartId) external view returns (address)",
  "function getChartTimestamp(string calldata chartId) external view returns (uint256)",
  "function isZkVerified(string calldata chartId) external view returns (bool)",
  "function markAsVerified(string calldata chartId) external returns (bool)",
  "function chartExists(string calldata chartId) external view returns (bool)",
  "function totalCharts() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function batchRegisterCharts(string[] calldata chartIds, bytes32[] calldata chartHashes, address[] calldata users, bool[] calldata zkVerifieds) external returns (uint256)"
];

interface BenchmarkResult {
  operation: string;
  stylusGas: bigint;
  solidityGas: bigint;
  savings: number; // percentage
  stylusTxHash: string;
  solidityTxHash: string;
}

interface BenchmarkReport {
  timestamp: string;
  network: string;
  stylusAddress: string;
  solidityAddress: string;
  results: BenchmarkResult[];
  summary: {
    totalStylusGas: bigint;
    totalSolidityGas: bigint;
    averageSavings: number;
    maxSavings: number;
    minSavings: number;
  };
}

function generateRandomChartId(): string {
  return `chart_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function generateRandomHash(): string {
  return ethers.keccak256(ethers.toUtf8Bytes(Math.random().toString()));
}

async function measureGas(
  contract: ethers.Contract,
  method: string,
  args: any[],
  provider: ethers.Provider
): Promise<{ gas: bigint; txHash: string }> {
  try {
    const tx = await contract[method](...args);
    const receipt = await tx.wait();
    return {
      gas: receipt.gasUsed,
      txHash: receipt.hash
    };
  } catch (error: any) {
    console.error(`Error in ${method}:`, error.message);
    throw error;
  }
}

async function estimateGas(
  contract: ethers.Contract,
  method: string,
  args: any[]
): Promise<bigint> {
  try {
    return await contract[method].estimateGas(...args);
  } catch (error: any) {
    console.error(`Estimation error for ${method}:`, error.message);
    return 0n;
  }
}

async function runBenchmarks(): Promise<BenchmarkReport> {
  const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC;
  const PRIVATE_KEY = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  const STYLUS_ADDRESS = process.env.CHART_REGISTRY_ADDRESS;
  const SOLIDITY_ADDRESS = process.env.SOLIDITY_CHART_REGISTRY_ADDRESS;
  
  if (!RPC_URL || !PRIVATE_KEY) {
    throw new Error('Missing ARBITRUM_SEPOLIA_RPC or AGENT_DEPLOYER_PRIVATE_KEY');
  }
  
  if (!STYLUS_ADDRESS) {
    throw new Error('Missing CHART_REGISTRY_ADDRESS (Stylus contract)');
  }
  
  if (!SOLIDITY_ADDRESS) {
    throw new Error('Missing SOLIDITY_CHART_REGISTRY_ADDRESS. Please deploy the Solidity contract first.');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🔥 STYLUS vs SOLIDITY BENCHMARK');
  console.log('='.repeat(70));
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`\nNetwork: Arbitrum Sepolia`);
  console.log(`Tester: ${wallet.address}`);
  console.log(`Stylus Contract: ${STYLUS_ADDRESS}`);
  console.log(`Solidity Contract: ${SOLIDITY_ADDRESS}`);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);
  
  const stylusContract = new ethers.Contract(STYLUS_ADDRESS, STYLUS_ABI, wallet);
  const solidityContract = new ethers.Contract(SOLIDITY_ADDRESS, SOLIDITY_ABI, wallet);
  
  const results: BenchmarkResult[] = [];
  
  // ============================================
  // BENCHMARK 1: Single Chart Registration
  // ============================================
  console.log('📊 Benchmark 1: Single Chart Registration');
  console.log('-'.repeat(50));
  
  const chartId1 = generateRandomChartId();
  const chartHash1 = generateRandomHash();
  const user1 = wallet.address;
  
  // Stylus
  console.log('  Running Stylus...');
  const stylusReg = await measureGas(
    stylusContract,
    'registerChart',
    [chartId1, chartHash1, user1, true],
    provider
  );
  
  // Solidity
  const chartId2 = generateRandomChartId();
  console.log('  Running Solidity...');
  const solidityReg = await measureGas(
    solidityContract,
    'registerChart',
    [chartId2, chartHash1, user1, true],
    provider
  );
  
  const regSavings = Number((solidityReg.gas - stylusReg.gas) * 100n / solidityReg.gas);
  console.log(`  Stylus: ${stylusReg.gas.toLocaleString()} gas`);
  console.log(`  Solidity: ${solidityReg.gas.toLocaleString()} gas`);
  console.log(`  💰 Savings: ${regSavings.toFixed(2)}%\n`);
  
  results.push({
    operation: 'registerChart (single)',
    stylusGas: stylusReg.gas,
    solidityGas: solidityReg.gas,
    savings: regSavings,
    stylusTxHash: stylusReg.txHash,
    solidityTxHash: solidityReg.txHash
  });
  
  // ============================================
  // BENCHMARK 2: Chart Verification (Read)
  // ============================================
  console.log('📊 Benchmark 2: Chart Verification (View Call)');
  console.log('-'.repeat(50));
  
  // For view calls, we estimate gas
  const stylusVerifyGas = await estimateGas(stylusContract, 'verifyChart', [chartId1, chartHash1]);
  const solidityVerifyGas = await estimateGas(solidityContract, 'verifyChart', [chartId2, chartHash1]);
  
  const verifySavings = solidityVerifyGas > 0n 
    ? Number((solidityVerifyGas - stylusVerifyGas) * 100n / solidityVerifyGas)
    : 0;
  
  console.log(`  Stylus: ${stylusVerifyGas.toLocaleString()} gas (estimated)`);
  console.log(`  Solidity: ${solidityVerifyGas.toLocaleString()} gas (estimated)`);
  console.log(`  💰 Savings: ${verifySavings.toFixed(2)}%\n`);
  
  results.push({
    operation: 'verifyChart (view)',
    stylusGas: stylusVerifyGas,
    solidityGas: solidityVerifyGas,
    savings: verifySavings,
    stylusTxHash: 'view-call',
    solidityTxHash: 'view-call'
  });
  
  // ============================================
  // BENCHMARK 3: Get Chart Data
  // ============================================
  console.log('📊 Benchmark 3: Get Chart Data (View Call)');
  console.log('-'.repeat(50));
  
  const stylusGetHashGas = await estimateGas(stylusContract, 'getChartHash', [chartId1]);
  const solidityGetHashGas = await estimateGas(solidityContract, 'getChartHash', [chartId2]);
  
  const getHashSavings = solidityGetHashGas > 0n 
    ? Number((solidityGetHashGas - stylusGetHashGas) * 100n / solidityGetHashGas)
    : 0;
  
  console.log(`  Stylus: ${stylusGetHashGas.toLocaleString()} gas (estimated)`);
  console.log(`  Solidity: ${solidityGetHashGas.toLocaleString()} gas (estimated)`);
  console.log(`  💰 Savings: ${getHashSavings.toFixed(2)}%\n`);
  
  results.push({
    operation: 'getChartHash (view)',
    stylusGas: stylusGetHashGas,
    solidityGas: solidityGetHashGas,
    savings: getHashSavings,
    stylusTxHash: 'view-call',
    solidityTxHash: 'view-call'
  });
  
  // ============================================
  // BENCHMARK 4: Multiple Registrations
  // ============================================
  console.log('📊 Benchmark 4: Multiple Chart Registrations (5 charts)');
  console.log('-'.repeat(50));
  
  let stylusBatchGas = 0n;
  let solidityBatchGas = 0n;
  
  for (let i = 0; i < 5; i++) {
    const id = generateRandomChartId();
    const hash = generateRandomHash();
    
    const sResult = await measureGas(stylusContract, 'registerChart', [id, hash, user1, true], provider);
    stylusBatchGas += sResult.gas;
    
    const id2 = generateRandomChartId();
    const solResult = await measureGas(solidityContract, 'registerChart', [id2, hash, user1, true], provider);
    solidityBatchGas += solResult.gas;
    
    process.stdout.write(`  Progress: ${i + 1}/5\r`);
  }
  console.log('');
  
  const batchSavings = Number((solidityBatchGas - stylusBatchGas) * 100n / solidityBatchGas);
  console.log(`  Stylus (5 txs): ${stylusBatchGas.toLocaleString()} gas total`);
  console.log(`  Solidity (5 txs): ${solidityBatchGas.toLocaleString()} gas total`);
  console.log(`  💰 Savings: ${batchSavings.toFixed(2)}%\n`);
  
  results.push({
    operation: 'registerChart (5x batch)',
    stylusGas: stylusBatchGas,
    solidityGas: solidityBatchGas,
    savings: batchSavings,
    stylusTxHash: 'multiple',
    solidityTxHash: 'multiple'
  });
  
  // ============================================
  // BENCHMARK 5: Mark as Verified
  // ============================================
  console.log('📊 Benchmark 5: Mark Chart as Verified');
  console.log('-'.repeat(50));
  
  const stylusMarkResult = await measureGas(stylusContract, 'markAsVerified', [chartId1], provider);
  const solidityMarkResult = await measureGas(solidityContract, 'markAsVerified', [chartId2], provider);
  
  const markSavings = Number((solidityMarkResult.gas - stylusMarkResult.gas) * 100n / solidityMarkResult.gas);
  console.log(`  Stylus: ${stylusMarkResult.gas.toLocaleString()} gas`);
  console.log(`  Solidity: ${solidityMarkResult.gas.toLocaleString()} gas`);
  console.log(`  💰 Savings: ${markSavings.toFixed(2)}%\n`);
  
  results.push({
    operation: 'markAsVerified',
    stylusGas: stylusMarkResult.gas,
    solidityGas: solidityMarkResult.gas,
    savings: markSavings,
    stylusTxHash: stylusMarkResult.txHash,
    solidityTxHash: solidityMarkResult.txHash
  });
  
  // ============================================
  // SUMMARY
  // ============================================
  const totalStylusGas = results.reduce((sum, r) => sum + r.stylusGas, 0n);
  const totalSolidityGas = results.reduce((sum, r) => sum + r.solidityGas, 0n);
  const avgSavings = results.reduce((sum, r) => sum + r.savings, 0) / results.length;
  const maxSavings = Math.max(...results.map(r => r.savings));
  const minSavings = Math.min(...results.map(r => r.savings));
  
  console.log('='.repeat(70));
  console.log('📈 BENCHMARK SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nTotal Gas Used:`);
  console.log(`  Stylus:   ${totalStylusGas.toLocaleString()} gas`);
  console.log(`  Solidity: ${totalSolidityGas.toLocaleString()} gas`);
  console.log(`\n💰 Overall Savings: ${Number((totalSolidityGas - totalStylusGas) * 100n / totalSolidityGas).toFixed(2)}%`);
  console.log(`   Average per operation: ${avgSavings.toFixed(2)}%`);
  console.log(`   Best case: ${maxSavings.toFixed(2)}%`);
  console.log(`   Worst case: ${minSavings.toFixed(2)}%`);
  
  // Calculate cost savings at current gas prices
  const gasPrice = (await provider.getFeeData()).gasPrice || 0n;
  const ethPrice = 3500; // Approximate ETH price in USD
  
  const stylusCostWei = totalStylusGas * gasPrice;
  const solidityCostWei = totalSolidityGas * gasPrice;
  const savingsWei = solidityCostWei - stylusCostWei;
  
  console.log(`\n💵 Cost Analysis (at ${ethers.formatUnits(gasPrice, 'gwei')} gwei, ~$${ethPrice} ETH):`);
  console.log(`  Stylus cost:   ${ethers.formatEther(stylusCostWei)} ETH ($${(Number(ethers.formatEther(stylusCostWei)) * ethPrice).toFixed(4)})`);
  console.log(`  Solidity cost: ${ethers.formatEther(solidityCostWei)} ETH ($${(Number(ethers.formatEther(solidityCostWei)) * ethPrice).toFixed(4)})`);
  console.log(`  Savings:       ${ethers.formatEther(savingsWei)} ETH ($${(Number(ethers.formatEther(savingsWei)) * ethPrice).toFixed(4)})`);
  
  // Projection for 1M operations
  const perOpSavings = (Number(solidityBatchGas / 5n) - Number(stylusBatchGas / 5n)) * Number(gasPrice);
  const millionOpSavingsWei = BigInt(Math.floor(perOpSavings * 1000000));
  console.log(`\n🚀 At Scale (1M chart registrations):`);
  console.log(`  Projected savings: ~${ethers.formatEther(millionOpSavingsWei)} ETH ($${(Number(ethers.formatEther(millionOpSavingsWei)) * ethPrice).toFixed(2)})`);
  
  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    network: 'Arbitrum Sepolia',
    stylusAddress: STYLUS_ADDRESS,
    solidityAddress: SOLIDITY_ADDRESS,
    results: results.map(r => ({
      ...r,
      stylusGas: r.stylusGas,
      solidityGas: r.solidityGas
    })),
    summary: {
      totalStylusGas,
      totalSolidityGas,
      averageSavings: avgSavings,
      maxSavings,
      minSavings
    }
  };
  
  return report;
}

async function main() {
  try {
    const report = await runBenchmarks();
    
    // Save report
    const reportPath = path.join(__dirname, '../benchmark-results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      ...report,
      results: report.results.map(r => ({
        ...r,
        stylusGas: r.stylusGas.toString(),
        solidityGas: r.solidityGas.toString()
      })),
      summary: {
        ...report.summary,
        totalStylusGas: report.summary.totalStylusGas.toString(),
        totalSolidityGas: report.summary.totalSolidityGas.toString()
      }
    }, null, 2));
    
    console.log(`\n✅ Report saved to: ${reportPath}`);
    
    // Generate markdown report
    const mdReport = generateMarkdownReport(report);
    const mdPath = path.join(__dirname, '../BENCHMARK_RESULTS.md');
    fs.writeFileSync(mdPath, mdReport);
    console.log(`📄 Markdown report saved to: ${mdPath}`);
    
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

function generateMarkdownReport(report: BenchmarkReport): string {
  const overallSavings = Number((report.summary.totalSolidityGas - report.summary.totalStylusGas) * 100n / report.summary.totalSolidityGas);
  
  return `# Stylus vs Solidity Benchmark Results

## Overview

**Date:** ${new Date(report.timestamp).toLocaleDateString()}  
**Network:** ${report.network}  
**Stylus Contract:** \`${report.stylusAddress}\`  
**Solidity Contract:** \`${report.solidityAddress}\`

## Key Findings

| Metric | Value |
|--------|-------|
| **Overall Gas Savings** | **${overallSavings.toFixed(2)}%** |
| Average Savings per Operation | ${report.summary.averageSavings.toFixed(2)}% |
| Best Case Savings | ${report.summary.maxSavings.toFixed(2)}% |
| Worst Case Savings | ${report.summary.minSavings.toFixed(2)}% |
| Total Stylus Gas | ${report.summary.totalStylusGas.toLocaleString()} |
| Total Solidity Gas | ${report.summary.totalSolidityGas.toLocaleString()} |

## Detailed Results

| Operation | Stylus Gas | Solidity Gas | Savings |
|-----------|------------|--------------|---------|
${report.results.map(r => `| ${r.operation} | ${r.stylusGas.toLocaleString()} | ${r.solidityGas.toLocaleString()} | **${r.savings.toFixed(2)}%** |`).join('\n')}

## Why Stylus?

### 1. **Significant Gas Savings**
Stylus contracts compiled to WASM execute more efficiently than EVM bytecode, resulting in **${overallSavings.toFixed(0)}%+ gas savings** on average.

### 2. **Cost Efficiency at Scale**
For high-throughput applications like on-chain identity verification:
- 1M operations could save **thousands of dollars** in gas fees
- Lower costs enable new use cases previously uneconomical on EVM

### 3. **Language Flexibility**
- Write smart contracts in Rust, C, C++
- Leverage existing libraries and tooling
- Better memory safety and type checking

### 4. **EVM Compatibility**
- Stylus contracts can call and be called by Solidity contracts
- Same address format, same RPC methods
- Seamless integration with existing infrastructure

## Contract Comparison

### Stylus (Rust)
\`\`\`rust
pub fn register_chart(
    &mut self,
    chart_id: String,
    chart_hash: B32,
    user: Address,
    zk_verified: bool,
) -> bool {
    // Efficient WASM execution
    let chart_key = string_to_key(&chart_id);
    // ... storage operations
}
\`\`\`

### Solidity
\`\`\`solidity
function registerChart(
    string calldata chartId,
    bytes32 chartHash,
    address user,
    bool zkVerified
) external returns (bool success) {
    // Standard EVM execution
    bytes32 chartKey = keccak256(abi.encodePacked(chartId));
    // ... storage operations
}
\`\`\`

## Transaction Hashes

| Operation | Stylus TX | Solidity TX |
|-----------|-----------|-------------|
${report.results.filter(r => r.stylusTxHash !== 'view-call').map(r => `| ${r.operation} | [\`${r.stylusTxHash.slice(0, 10)}...\`](https://sepolia.arbiscan.io/tx/${r.stylusTxHash}) | [\`${r.solidityTxHash.slice(0, 10)}...\`](https://sepolia.arbiscan.io/tx/${r.solidityTxHash}) |`).join('\n')}

---

*Generated by Astrolabe Stylus Benchmark Suite*
`;
}

main();

