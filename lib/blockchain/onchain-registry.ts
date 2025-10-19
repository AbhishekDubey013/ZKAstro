/**
 * On-Chain Registry Integration
 * Records chart creations and agent reputation updates on Base Sepolia
 */

import { ethers } from 'ethers';
import { getSponsoredTxParams } from '../agents/virtuals-config.js';

// Contract ABIs (simplified)
const CHART_REGISTRY_ABI = [
  'function registerChart(string chartId, bytes32 chartHash, address user, bool zkVerified) external',
  'function verifyChart(string chartId, bytes32 chartHash) external view returns (bool)',
  'function getChart(string chartId) external view returns (tuple(bytes32 chartHash, address user, uint256 timestamp, bool zkVerified, string chartId))',
  'function getUserCharts(address user) external view returns (string[])',
  'function totalCharts() external view returns (uint256)',
  'event ChartCreated(string indexed chartId, bytes32 indexed chartHash, address indexed user, uint256 timestamp, bool zkVerified)',
];

const AGENT_REPUTATION_ABI = [
  'function registerAgent(string agentId, string handle) external',
  'function recordPredictionSelection(string agentId, string predictionId, address user, int256 reputationBonus) external',
  'function recordPrediction(string agentId) external',
  'function getAgent(string agentId) external view returns (tuple(string agentId, string handle, uint256 reputation, uint256 totalPredictions, uint256 totalSelections, bool isActive, uint256 createdAt))',
  'function getAgentStats(string agentId) external view returns (uint256 reputation, uint256 totalPredictions, uint256 totalSelections, uint256 winRate)',
  'function getAllAgents() external view returns (string[])',
  'event PredictionSelected(string indexed agentId, string indexed predictionId, address indexed user, int256 reputationChange, uint256 newReputation, uint256 timestamp)',
];

/**
 * Get contract instances
 */
function getContracts() {
  const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  const chartRegistryAddress = process.env.CHART_REGISTRY_ADDRESS;
  const agentReputationAddress = process.env.AGENT_REPUTATION_ADDRESS;
  const rpcUrl = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

  if (!privateKey) {
    throw new Error('AGENT_DEPLOYER_PRIVATE_KEY not set');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const chartRegistry = chartRegistryAddress 
    ? new ethers.Contract(chartRegistryAddress, CHART_REGISTRY_ABI, wallet)
    : null;

  const agentReputation = agentReputationAddress
    ? new ethers.Contract(agentReputationAddress, AGENT_REPUTATION_ABI, wallet)
    : null;

  return { chartRegistry, agentReputation, wallet, provider };
}

/**
 * Record chart creation on-chain
 */
export async function recordChartOnChain(
  chartId: string,
  chartData: any,
  userId: string | null,
  zkProof: string
): Promise<{ txHash: string; chartHash: string } | null> {
  try {
    const { chartRegistry, wallet } = getContracts();

    if (!chartRegistry) {
      console.log('⚠️  Chart registry not deployed, skipping on-chain record');
      return null;
    }

    console.log(`📝 Recording chart ${chartId} on-chain...`);

    // Create chart hash (commitment)
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

    // Get gas sponsorship
    const sponsoredParams = await getSponsoredTxParams(
      await chartRegistry.getAddress(),
      chartRegistry.interface.encodeFunctionData('registerChart', [
        chartId,
        chartHash,
        userAddress,
        true, // zkVerified
      ]),
      0n
    );

    // Register chart on-chain
    const tx = await chartRegistry.registerChart(
      chartId,
      chartHash,
      userAddress,
      true, // ZK verified
      sponsoredParams ? { ...sponsoredParams } : {}
    );

    console.log(`  Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Chart recorded on-chain (block ${receipt.blockNumber})`);
    console.log(`  ⛽ Gas: ${sponsoredParams ? 'SPONSORED' : 'Self-paid'}`);

    return {
      txHash: tx.hash,
      chartHash,
    };
  } catch (error) {
    console.error('❌ Failed to record chart on-chain:', error);
    return null;
  }
}

/**
 * Record agent prediction selection on-chain
 * This updates the agent's reputation transparently
 */
export async function recordAgentSelectionOnChain(
  agentId: string,
  predictionRequestId: string,
  userId: string | null,
  reputationChange: number
): Promise<string | null> {
  try {
    const { agentReputation, wallet } = getContracts();

    if (!agentReputation) {
      console.log('⚠️  Agent reputation contract not deployed, skipping on-chain record');
      return null;
    }

    console.log(`📊 Recording agent selection for ${agentId} on-chain...`);

    // Determine user address
    const userAddress = userId 
      ? ethers.getAddress(userId)
      : wallet.address;

    // Get gas sponsorship
    const sponsoredParams = await getSponsoredTxParams(
      await agentReputation.getAddress(),
      agentReputation.interface.encodeFunctionData('recordPredictionSelection', [
        agentId,
        predictionRequestId,
        userAddress,
        reputationChange,
      ]),
      0n
    );

    // Record selection on-chain
    const tx = await agentReputation.recordPredictionSelection(
      agentId,
      predictionRequestId,
      userAddress,
      reputationChange,
      sponsoredParams ? { ...sponsoredParams } : {}
    );

    console.log(`  Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Agent selection recorded on-chain (block ${receipt.blockNumber})`);
    console.log(`  Reputation change: ${reputationChange > 0 ? '+' : ''}${reputationChange}`);
    console.log(`  ⛽ Gas: ${sponsoredParams ? 'SPONSORED' : 'Self-paid'}`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to record agent selection on-chain:', error.message);
    return null;
  }
}

/**
 * Register agent on-chain
 */
export async function registerAgentOnChain(
  agentId: string,
  handle: string
): Promise<string | null> {
  try {
    const { agentReputation } = getContracts();

    if (!agentReputation) {
      console.log('⚠️  Agent reputation contract not deployed');
      return null;
    }

    console.log(`🤖 Registering agent ${handle} on-chain...`);

    const tx = await agentReputation.registerAgent(agentId, handle);
    console.log(`  Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Agent registered on-chain (block ${receipt.blockNumber})`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to register agent on-chain:', error.message);
    return null;
  }
}

/**
 * Get agent stats from on-chain
 */
export async function getAgentStatsOnChain(agentId: string) {
  try {
    const { agentReputation } = getContracts();

    if (!agentReputation) {
      return null;
    }

    const [reputation, totalPredictions, totalSelections, winRate] = 
      await agentReputation.getAgentStats(agentId);

    return {
      reputation: Number(reputation),
      totalPredictions: Number(totalPredictions),
      totalSelections: Number(totalSelections),
      winRate: Number(winRate) / 100, // Convert from basis points to percentage
    };
  } catch (error) {
    console.error('Error fetching on-chain agent stats:', error);
    return null;
  }
}

/**
 * Verify a chart on-chain
 */
export async function verifyChartOnChain(
  chartId: string,
  chartData: any,
  zkProof: string
): Promise<boolean> {
  try {
    const { chartRegistry } = getContracts();

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
    console.error('Error verifying chart on-chain:', error);
    return false;
  }
}

/**
 * Check if contracts are deployed
 */
export function areContractsDeployed(): boolean {
  return !!(
    process.env.CHART_REGISTRY_ADDRESS &&
    process.env.AGENT_REPUTATION_ADDRESS
  );
}

export default {
  recordChartOnChain,
  recordAgentSelectionOnChain,
  registerAgentOnChain,
  getAgentStatsOnChain,
  verifyChartOnChain,
  areContractsDeployed,
};

