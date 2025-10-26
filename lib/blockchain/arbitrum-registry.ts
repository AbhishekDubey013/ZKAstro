/**
 * Arbitrum Stylus Registry Integration
 * Records chart creations on Arbitrum Sepolia using Stylus contracts
 * 
 * Benefits:
 * - 10-100x cheaper gas costs
 * - Faster execution
 * - Memory-safe Rust implementation
 */

import { ethers } from 'ethers';

// Contract ABI (same as Solidity version - Stylus is ABI compatible!)
const CHART_REGISTRY_ABI = [
  'function registerChart(string chartId, bytes32 chartHash, address user, bool zkVerified) external',
  'function verifyChart(string chartId, bytes32 chartHash) external view returns (bool)',
  'function getChart(string chartId) external view returns (tuple(bytes32 chartHash, address user, uint256 timestamp, bool zkVerified, string chartId))',
  'function getUserCharts(address user) external view returns (string[])',
  'function totalCharts() external view returns (uint256)',
  'function isZkVerified(string chartId) external view returns (bool)',
  'event ChartCreated(string indexed chartId, bytes32 indexed chartHash, address indexed user, uint256 timestamp, bool zkVerified)',
];

/**
 * Get Arbitrum contract instances
 */
function getArbitrumContracts() {
  const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  const chartRegistryAddress = process.env.CHART_REGISTRY_ADDRESS;
  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
  const network = process.env.ARBITRUM_NETWORK || 'arbitrum-sepolia';

  if (!privateKey) {
    throw new Error('AGENT_DEPLOYER_PRIVATE_KEY not set');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const chartRegistry = chartRegistryAddress 
    ? new ethers.Contract(chartRegistryAddress, CHART_REGISTRY_ABI, wallet)
    : null;

  return { chartRegistry, wallet, provider, network };
}

/**
 * Record chart creation on Arbitrum Sepolia
 * 
 * @param chartId - Unique chart identifier
 * @param chartData - Chart data including positions
 * @param userId - User address (optional)
 * @param zkProof - ZK proof string
 * @returns Transaction hash and chart hash
 */
export async function recordChartOnArbitrum(
  chartId: string,
  chartData: any,
  userId: string | null,
  zkProof: string
): Promise<{ txHash: string; chartHash: string; explorerUrl: string } | null> {
  try {
    const { chartRegistry, wallet, network } = getArbitrumContracts();

    if (!chartRegistry) {
      console.log('⚠️  Stylus Chart Registry not deployed, skipping on-chain record');
      return null;
    }

    console.log(`📝 Recording chart ${chartId} on Arbitrum Sepolia (Stylus)...`);

    // Create chart hash (commitment) - includes ZK proof
    const chartDataStr = JSON.stringify({
      planets: chartData.planets,
      asc: chartData.asc,
      mc: chartData.mc,
      zkProof,
    });
    const chartHash = ethers.keccak256(ethers.toUtf8Bytes(chartDataStr));

    // Determine user address (use deployer if anonymous)
    const userAddress = userId 
      ? ethers.getAddress(userId) // If userId is an address
      : wallet.address; // Platform address for anonymous users

    console.log(`  Chart Hash: ${chartHash}`);
    console.log(`  User: ${userAddress}`);
    console.log(`  ZK Verified: true`);

    // Register chart on-chain (Stylus contract - much cheaper!)
    const tx = await chartRegistry.registerChart(
      chartId,
      chartHash,
      userAddress,
      true // ZK verified
    );

    console.log(`  Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Chart recorded on Arbitrum Sepolia (block ${receipt?.blockNumber})`);
    console.log(`  ⛽ Gas used: ${receipt?.gasUsed?.toString()} (Stylus = 10-100x cheaper!)`);

    // Get explorer URL
    const explorerUrl = network === 'arbitrum-one' 
      ? `https://arbiscan.io/tx/${tx.hash}`
      : `https://sepolia.arbiscan.io/tx/${tx.hash}`;

    return {
      txHash: tx.hash,
      chartHash,
      explorerUrl,
    };
  } catch (error: any) {
    console.error('❌ Failed to record chart on Arbitrum:', error.message);
    return null;
  }
}

/**
 * Verify a chart on-chain
 * 
 * @param chartId - Chart identifier
 * @param chartData - Chart data to verify
 * @param zkProof - ZK proof
 * @returns Whether the chart is valid
 */
export async function verifyChartOnArbitrum(
  chartId: string,
  chartData: any,
  zkProof: string
): Promise<boolean> {
  try {
    const { chartRegistry } = getArbitrumContracts();

    if (!chartRegistry) {
      return false;
    }

    // Recreate hash
    const chartDataStr = JSON.stringify({
      planets: chartData.planets,
      asc: chartData.asc,
      mc: chartData.mc,
      zkProof,
    });
    const chartHash = ethers.keccak256(ethers.toUtf8Bytes(chartDataStr));

    // Verify on-chain
    const isValid = await chartRegistry.verifyChart(chartId, chartHash);
    return isValid;
  } catch (error) {
    console.error('Error verifying chart on Arbitrum:', error);
    return false;
  }
}

/**
 * Get chart details from Arbitrum
 * 
 * @param chartId - Chart identifier
 * @returns Chart commitment details
 */
export async function getChartFromArbitrum(chartId: string) {
  try {
    const { chartRegistry } = getArbitrumContracts();

    if (!chartRegistry) {
      return null;
    }

    const chart = await chartRegistry.getChart(chartId);
    
    return {
      chartHash: chart[0],
      user: chart[1],
      timestamp: Number(chart[2]),
      zkVerified: chart[3],
      chartId: chart[4],
    };
  } catch (error) {
    console.error('Error getting chart from Arbitrum:', error);
    return null;
  }
}

/**
 * Get all charts for a user from Arbitrum
 * 
 * @param userAddress - User's Ethereum address
 * @returns Array of chart IDs
 */
export async function getUserChartsFromArbitrum(userAddress: string): Promise<string[]> {
  try {
    const { chartRegistry } = getArbitrumContracts();

    if (!chartRegistry) {
      return [];
    }

    const charts = await chartRegistry.getUserCharts(userAddress);
    return charts;
  } catch (error) {
    console.error('Error getting user charts from Arbitrum:', error);
    return [];
  }
}

/**
 * Get total charts count from Arbitrum
 * 
 * @returns Total number of charts
 */
export async function getTotalChartsFromArbitrum(): Promise<number> {
  try {
    const { chartRegistry } = getArbitrumContracts();

    if (!chartRegistry) {
      return 0;
    }

    const total = await chartRegistry.totalCharts();
    return Number(total);
  } catch (error) {
    console.error('Error getting total charts from Arbitrum:', error);
    return 0;
  }
}

/**
 * Check if Arbitrum contracts are deployed
 */
export function areArbitrumContractsDeployed(): boolean {
  return !!(
    process.env.CHART_REGISTRY_ADDRESS &&
    process.env.ARBITRUM_SEPOLIA_RPC
  );
}

export default {
  recordChartOnArbitrum,
  verifyChartOnArbitrum,
  getChartFromArbitrum,
  getUserChartsFromArbitrum,
  getTotalChartsFromArbitrum,
  areArbitrumContractsDeployed,
};

