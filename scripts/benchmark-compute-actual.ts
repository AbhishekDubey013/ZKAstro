/**
 * Actual Compute Benchmark: Stylus vs Solidity
 * 
 * Real gas measurements from both deployed contracts
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Optimized Stylus contract with compute functions (no runtime string parsing)
const STYLUS_ZK_ADDRESS = '0x78b8a99c378f5daa19497852f3192fec9998cc88';

// Solidity ZK Verifier
const SOLIDITY_ZK_ADDRESS = process.env.SOLIDITY_ZK_VERIFIER_ADDRESS || '0xB888C503621f7654B34BF2373de71841d014aa8b';

const STYLUS_ABI = [
  "function init()",
  "function computeHash(uint256 input0, uint256 input1, uint256 input2) view returns (bytes32)",
  "function computeMultipleHashes(uint32 iterations) view returns (bytes32)",
  "function fieldMulBenchmark(uint256 a, uint256 b, uint32 iterations) view returns (uint256)",
  "function verifyZkProof(bytes32 commitment, bytes32 proof, uint256 nonce, uint256 publicInput0, uint256 publicInput1, uint256 publicInput2) view returns (bool)",
  "function totalCharts() view returns (uint256)",
  "function owner() view returns (address)"
];

const SOLIDITY_ABI = [
  "function computePoseidonHash(uint256[] memory inputs) public pure returns (bytes32)",
  "function computeMultipleHashes(uint256 iterations) public pure returns (bytes32)",
  "function fieldMultiplicationBenchmark(uint256 a, uint256 b, uint256 iterations) public pure returns (uint256)",
  "function verifyZKProof(bytes32 commitment, bytes32 proof, uint256 nonce, uint256[] memory publicInputs) public returns (bool)",
];

interface BenchmarkResult {
  operation: string;
  stylusGas: bigint;
  solidityGas: bigint;
  savings: number;
  stylusTx: string;
  solidityTx: string;
}

async function main() {
  const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC;
  const PRIVATE_KEY = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  
  if (!RPC_URL || !PRIVATE_KEY) {
    console.error('Missing environment variables');
    process.exit(1);
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('🔐 ACTUAL COMPUTE BENCHMARK: Stylus vs Solidity');
  console.log('   Real gas measurements from deployed contracts');
  console.log('═'.repeat(70));
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`\n📍 Network: Arbitrum Sepolia`);
  console.log(`📍 Stylus Contract: ${STYLUS_ZK_ADDRESS}`);
  console.log(`📍 Solidity Contract: ${SOLIDITY_ZK_ADDRESS}`);
  
  const stylusContract = new ethers.Contract(STYLUS_ZK_ADDRESS, STYLUS_ABI, wallet);
  const solidityContract = new ethers.Contract(SOLIDITY_ZK_ADDRESS, SOLIDITY_ABI, wallet);
  
  // Initialize stylus contract
  try {
    console.log('\n🔧 Initializing Stylus contract...');
    const initTx = await stylusContract.init();
    await initTx.wait();
    console.log('✅ Stylus contract initialized');
  } catch (e: any) {
    console.log('ℹ️ Contract already initialized or init not needed');
  }
  
  const results: BenchmarkResult[] = [];
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RUNNING COMPUTE BENCHMARKS');
  console.log('═'.repeat(70));
  
  // ============================================
  // TEST 1: Single Hash Computation
  // ============================================
  console.log('\n🧪 Test 1: Single Hash Computation');
  console.log('─'.repeat(50));
  
  try {
    const input0 = ethers.toBigInt(ethers.randomBytes(32));
    const input1 = ethers.toBigInt(ethers.randomBytes(32));
    const input2 = ethers.toBigInt(ethers.randomBytes(32));
    
    // Stylus - estimate gas
    console.log('   Estimating Stylus gas...');
    const stylusGas = await stylusContract.computeHash.estimateGas(input0, input1, input2);
    
    // Solidity - estimate gas
    console.log('   Estimating Solidity gas...');
    const solidityGas = await solidityContract.computePoseidonHash.estimateGas([input0, input1, input2]);
    
    const savings = Number((solidityGas - stylusGas) * 100n / solidityGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusGas.toLocaleString()} gas`);
    console.log(`   🔷 Solidity: ${solidityGas.toLocaleString()} gas`);
    console.log(`   📉 Savings:  ${savings.toFixed(1)}%`);
    
    results.push({
      operation: 'computeHash',
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
  // TEST 2: Multiple Hash Iterations
  // ============================================
  console.log('\n🧪 Test 2: Multiple Hash Iterations (5 rounds)');
  console.log('─'.repeat(50));
  
  try {
    const iterations = 5;
    
    // Stylus
    console.log('   Estimating Stylus gas...');
    const stylusGas = await stylusContract.computeMultipleHashes.estimateGas(iterations);
    
    // Solidity
    console.log('   Estimating Solidity gas...');
    const solidityGas = await solidityContract.computeMultipleHashes.estimateGas(iterations);
    
    const savings = Number((solidityGas - stylusGas) * 100n / solidityGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusGas.toLocaleString()} gas`);
    console.log(`   🔷 Solidity: ${solidityGas.toLocaleString()} gas`);
    console.log(`   📉 Savings:  ${savings.toFixed(1)}%`);
    
    results.push({
      operation: 'computeMultipleHashes (5x)',
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
  // TEST 3: Field Multiplication Benchmark
  // ============================================
  console.log('\n🧪 Test 3: Field Multiplications (50 iterations)');
  console.log('─'.repeat(50));
  
  try {
    const a = ethers.toBigInt(ethers.randomBytes(32));
    const b = ethers.toBigInt(ethers.randomBytes(32));
    const iterations = 50;
    
    // Stylus
    console.log('   Estimating Stylus gas...');
    const stylusGas = await stylusContract.fieldMulBenchmark.estimateGas(a, b, iterations);
    
    // Solidity
    console.log('   Estimating Solidity gas...');
    const solidityGas = await solidityContract.fieldMultiplicationBenchmark.estimateGas(a, b, iterations);
    
    const savings = Number((solidityGas - stylusGas) * 100n / solidityGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusGas.toLocaleString()} gas`);
    console.log(`   🔷 Solidity: ${solidityGas.toLocaleString()} gas`);
    console.log(`   📉 Savings:  ${savings.toFixed(1)}%`);
    
    results.push({
      operation: 'fieldMultiplication (50x)',
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
  // TEST 4: ZK Proof Verification (state-changing for gas measurement)
  // ============================================
  console.log('\n🧪 Test 4: ZK Proof Verification');
  console.log('─'.repeat(50));
  
  try {
    const commitment = ethers.randomBytes(32);
    const proof = ethers.randomBytes(32);
    const nonce = ethers.toBigInt(ethers.randomBytes(32));
    const publicInput0 = ethers.toBigInt(ethers.randomBytes(32));
    const publicInput1 = ethers.toBigInt(ethers.randomBytes(32));
    const publicInput2 = ethers.toBigInt(ethers.randomBytes(32));
    
    // Stylus - estimate gas
    console.log('   Estimating Stylus gas...');
    const stylusGas = await stylusContract.verifyZkProof.estimateGas(
      commitment, proof, nonce, publicInput0, publicInput1, publicInput2
    );
    
    // Solidity - run actual tx to get gas
    console.log('   Running Solidity verifyZKProof...');
    const tx = await solidityContract.verifyZKProof(commitment, proof, nonce, [publicInput0, publicInput1, publicInput2]);
    const receipt = await tx.wait();
    const solidityGas = receipt.gasUsed;
    
    const savings = Number((solidityGas - stylusGas) * 100n / solidityGas);
    
    console.log(`\n   ⚡ Stylus:   ${stylusGas.toLocaleString()} gas`);
    console.log(`   🔷 Solidity: ${solidityGas.toLocaleString()} gas`);
    console.log(`   📉 Savings:  ${savings.toFixed(1)}%`);
    
    results.push({
      operation: 'verifyZKProof',
      stylusGas,
      solidityGas,
      savings,
      stylusTx: 'view-call',
      solidityTx: receipt.hash
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
  console.log('📈 ACTUAL COMPUTE BENCHMARK RESULTS');
  console.log('═'.repeat(70));
  
  console.log(`\n📊 Total Gas Comparison:`);
  console.log(`   ⚡ Stylus:   ${totalStylusGas.toLocaleString()} gas`);
  console.log(`   🔷 Solidity: ${totalSolidityGas.toLocaleString()} gas`);
  console.log(`   📉 Savings:  ${overallSavings.toFixed(1)}%`);
  
  console.log(`\n📋 Per-Operation Results:`);
  for (const r of results) {
    const icon = r.savings > 0 ? '✅' : '❌';
    console.log(`   ${icon} ${r.operation}: ${r.savings > 0 ? r.savings.toFixed(1) + '% savings' : Math.abs(r.savings).toFixed(1) + '% more expensive'}`);
    console.log(`      Stylus: ${Number(r.stylusGas).toLocaleString()} | Solidity: ${Number(r.solidityGas).toLocaleString()}`);
  }
  
  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    network: 'Arbitrum Sepolia',
    type: 'Compute-Intensive Operations (ACTUAL MEASUREMENTS)',
    stylusAddress: STYLUS_ZK_ADDRESS,
    solidityAddress: SOLIDITY_ZK_ADDRESS,
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
    }
  };
  
  const reportPath = path.join(process.cwd(), 'benchmark-compute-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Results saved to: ${reportPath}`);
  
  console.log('\n' + '═'.repeat(70));
  if (overallSavings > 0) {
    console.log(`🎉 STYLUS WINS: ${overallSavings.toFixed(1)}% gas savings for compute operations!`);
  } else {
    console.log(`📊 SOLIDITY WINS: ${Math.abs(overallSavings).toFixed(1)}% more efficient for these operations`);
  }
  console.log('═'.repeat(70));
}

main().catch(console.error);

