/**
 * Check the latest chart creation and on-chain status
 */

import { config } from 'dotenv';
config();
import { storage } from '../server/storage';
import { ethers } from 'ethers';

async function checkLatestChart() {
  console.log('🔍 Checking latest chart creation...\n');

  try {
    // Get all charts from database
    const charts = await storage.getAllCharts();
    
    if (charts.length === 0) {
      console.log('❌ No charts found in database');
      return;
    }

    // Sort by creation date (newest first)
    const sortedCharts = charts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const latestChart = sortedCharts[0];
    
    console.log('📊 Latest Chart:');
    console.log('   ID:', latestChart.id);
    console.log('   Created:', new Date(latestChart.createdAt).toLocaleString());
    console.log('   User ID:', latestChart.userId || 'Anonymous');
    console.log('   On-Chain TX:', latestChart.onChainTxHash || 'Not recorded');
    console.log('   Chart Hash:', latestChart.chartHash || 'N/A');
    console.log('');

    // Check on-chain status
    const contractAddress = process.env.CHART_REGISTRY_ADDRESS;
    if (!contractAddress) {
      console.log('⚠️  CHART_REGISTRY_ADDRESS not set, skipping on-chain check');
      return;
    }

    console.log('🔗 Checking on-chain status...');
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    
    const abi = [
      'function chartExists(string chartId) external view returns (bool)',
      'function getChartHash(string chartId) external view returns (bytes32)',
      'function getChartUser(string chartId) external view returns (address)',
      'function getChartTimestamp(string chartId) external view returns (uint256)',
      'function isZkVerified(string chartId) external view returns (bool)',
      'function totalCharts() external view returns (uint256)',
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Check if chart exists on-chain
    const exists = await contract.chartExists(latestChart.id);
    
    if (exists) {
      console.log('✅ Chart exists on-chain!');
      
      const [hash, user, timestamp, zkVerified] = await Promise.all([
        contract.getChartHash(latestChart.id),
        contract.getChartUser(latestChart.id),
        contract.getChartTimestamp(latestChart.id),
        contract.isZkVerified(latestChart.id),
      ]);

      console.log('   On-Chain Hash:', hash);
      console.log('   User:', user);
      console.log('   Timestamp:', new Date(Number(timestamp) * 1000).toLocaleString());
      console.log('   ZK Verified:', zkVerified);
      
      // Compare hashes
      if (latestChart.chartHash && latestChart.chartHash.toLowerCase() === hash.toLowerCase()) {
        console.log('   ✅ Hash matches database!');
      } else {
        console.log('   ⚠️  Hash mismatch (database vs on-chain)');
      }
    } else {
      console.log('❌ Chart NOT found on-chain');
      console.log('   This chart was created but not recorded on-chain');
    }

    // Get total charts
    const totalCharts = await contract.totalCharts();
    console.log('\n📈 Contract Stats:');
    console.log('   Total Charts on-chain:', totalCharts.toString());
    console.log('   Total Charts in DB:', charts.length);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkLatestChart().catch(console.error);

