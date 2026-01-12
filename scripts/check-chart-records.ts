/**
 * Check if a chart is recorded in database and on-chain
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env before importing anything that needs it
dotenv.config({ path: resolve(__dirname, '../.env') });

// Import after env is loaded
const { storage } = await import('../server/storage.js');

// Chart ID from terminal logs
const CHART_ID = '9f440477-527e-4fc8-8f26-4dc6bf6ac4ec';

async function checkDatabase() {
  console.log('🔍 Checking Database Records...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get the specific chart
    const chart = await storage.getChart(CHART_ID);
    
    if (!chart) {
      console.log('❌ Chart not found in database\n');
      return null;
    }

    console.log('✅ Chart found in database!\n');
    console.log('📋 Chart Details:');
    console.log(`   ID: ${chart.id}`);
    console.log(`   User ID: ${chart.userId || 'Anonymous'}`);
    console.log(`   Created: ${chart.createdAt}`);
    console.log(`   ZK Enabled: ${chart.zkEnabled}`);
    console.log(`   Inputs Hash: ${chart.inputsHash.substring(0, 20)}...`);
    console.log(`   ZK Proof: ${chart.zkProof ? chart.zkProof.substring(0, 20) + '...' : 'Not stored'}`);
    console.log(`   ZK Salt: ${chart.zkSalt ? chart.zkSalt.substring(0, 20) + '...' : 'Not stored'}`);
    console.log(`\n   On-Chain Fields:`);
    console.log(`   Chain: ${chart.chain || 'Not set'}`);
    console.log(`   Chart ID On-Chain: ${chart.chartIdOnChain || 'Not set'}`);
    console.log(`   Transaction Hash: ${chart.txHash || 'Not set'}`);
    
    console.log(`\n   Astro Parameters (Raw Params):`);
    const params = chart.paramsJson as any;
    if (params) {
      console.log(`   - Zodiac: ${params.zodiac}`);
      console.log(`   - House System: ${params.houseSystem}`);
      console.log(`   - Planets:`);
      Object.entries(params.planets || {}).forEach(([planet, deg]: [string, any]) => {
        const sign = Math.floor(deg / 3000);
        const degree = (deg % 3000) / 100;
        console.log(`     ${planet}: ${degree.toFixed(2)}° (${sign}th sign)`);
      });
      console.log(`   - ASC: ${params.asc / 100}°`);
      console.log(`   - MC: ${params.mc / 100}°`);
    }

    return chart;
  } catch (error: any) {
    console.error('❌ Error checking database:', error.message);
    return null;
  }
}

async function checkOnChain(chart: any) {
  console.log('\n\n🔗 Checking On-Chain Records...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check if blockchain is configured
  const baseRpc = process.env.BASE_SEPOLIA_RPC;
  const chartRegistryAddress = process.env.CHART_REGISTRY_ADDRESS;
  const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;

  if (!baseRpc || !chartRegistryAddress) {
    console.log('⚠️  Blockchain not configured');
    console.log(`   BASE_SEPOLIA_RPC: ${baseRpc ? '✅ Set' : '❌ Not set'}`);
    console.log(`   CHART_REGISTRY_ADDRESS: ${chartRegistryAddress ? '✅ Set' : '❌ Not set'}`);
    console.log(`   AGENT_DEPLOYER_PRIVATE_KEY: ${privateKey ? '✅ Set' : '❌ Not set'}`);
    console.log('\n   This is why on-chain recording failed.');
    return;
  }

  if (!privateKey) {
    console.log('❌ AGENT_DEPLOYER_PRIVATE_KEY not set');
    console.log('   Cannot check on-chain records without private key');
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(baseRpc);
    
    // Check if contract exists
    const code = await provider.getCode(chartRegistryAddress);
    if (code === '0x') {
      console.log('❌ Contract not found at address:', chartRegistryAddress);
      return;
    }

    console.log('✅ Contract found on Base Sepolia');
    console.log(`   Address: ${chartRegistryAddress}`);
    console.log(`   Explorer: https://sepolia.basescan.org/address/${chartRegistryAddress}\n`);

    // Try to query the chart
    const contractABI = [
      'function getChart(string chartId) external view returns (tuple(bytes32 chartHash, address user, uint256 timestamp, bool zkVerified, string chartId))',
      'function verifyChart(string chartId, bytes32 chartHash) external view returns (bool)',
    ];

    const contract = new ethers.Contract(chartRegistryAddress, contractABI, provider);

    try {
      const onChainChart = await contract.getChart(chart.id);
      
      if (onChainChart && onChainChart.timestamp.toString() !== '0') {
        console.log('✅ Chart found on-chain!');
        console.log(`   Chart Hash: ${onChainChart.chartHash}`);
        console.log(`   User: ${onChainChart.user}`);
        console.log(`   Timestamp: ${new Date(Number(onChainChart.timestamp) * 1000).toISOString()}`);
        console.log(`   ZK Verified: ${onChainChart.zkVerified}`);
        console.log(`\n   Explorer: https://sepolia.basescan.org/address/${chartRegistryAddress}#readContract`);
      } else {
        console.log('❌ Chart not found on-chain');
        console.log('   The chart was not recorded on-chain.');
      }
    } catch (error: any) {
      if (error.message.includes('execution reverted')) {
        console.log('❌ Chart not found on-chain');
        console.log('   The chart was not recorded on-chain.');
      } else {
        throw error;
      }
    }

    // Check transaction hash if available
    if (chart.txHash) {
      console.log(`\n   Transaction Hash: ${chart.txHash}`);
      console.log(`   Explorer: https://sepolia.basescan.org/tx/${chart.txHash}`);
    }

  } catch (error: any) {
    console.error('❌ Error checking on-chain:', error.message);
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║   📊 Chart Record Verification                           ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`Chart ID: ${CHART_ID}\n`);

  const chart = await checkDatabase();
  
  if (chart) {
    await checkOnChain(chart);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📝 Summary:');
  console.log(`   Database: ${chart ? '✅ Recorded' : '❌ Not found'}`);
  console.log(`   On-Chain: ${chart?.txHash ? '✅ Recorded' : '❌ Not recorded'}`);
  console.log('\n');
}

main().catch(console.error);

