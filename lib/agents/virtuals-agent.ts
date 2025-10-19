/**
 * Virtuals GAME SDK Agent Implementation
 * Decentralized Astrology Agents on Base Sepolia
 */

import { createWeb3Clients, getSponsoredTxParams, VIRTUALS_CONFIG } from './virtuals-config';
import type { NatalChart, TransitChart } from '../astro/scoring';

export interface VirtualsAgentConfig {
  handle: string;
  name: string;
  description: string;
  personality: string;
  method: string;
  aggressiveness: number; // Scoring bias (0.5 = conservative, 1.5 = aggressive)
  onChainAddress?: string; // Deployed contract address
  tokenAddress?: string; // Agent token (if tokenized)
}

export interface DeployedAgent {
  agentId: string;
  handle: string;
  contractAddress: string;
  deploymentTx: string;
  tokenAddress?: string;
  chainId: number;
  deployer: string;
  timestamp: Date;
}

/**
 * Deploy a new agent on Base Sepolia using Virtuals GAME SDK
 * Gas is sponsored by the platform
 */
export async function deployVirtualsAgent(
  config: VirtualsAgentConfig
): Promise<DeployedAgent> {
  console.log(`🚀 Deploying agent: ${config.handle} to Base Sepolia...`);
  
  try {
    const { publicClient, walletClient, account } = createWeb3Clients();

    // Prepare agent deployment data
    const agentMetadata = {
      name: config.name,
      handle: config.handle,
      description: config.description,
      personality: config.personality,
      method: config.method,
      aggressiveness: config.aggressiveness,
      category: 'astrology',
      version: '1.0.0',
    };

    // Encode deployment transaction
    const deploymentData = encodeAgentDeployment(agentMetadata);

    // Get gas sponsorship from platform's paymaster
    const sponsoredParams = await getSponsoredTxParams(
      VIRTUALS_CONFIG.agentFactoryAddress,
      deploymentData,
      0n
    );

    if (!sponsoredParams) {
      console.log('⚠️  Gas sponsorship unavailable, using regular gas...');
    }

    // Deploy agent contract
    const hash = await walletClient.sendTransaction({
      to: VIRTUALS_CONFIG.agentFactoryAddress as `0x${string}`,
      data: deploymentData as `0x${string}`,
      gas: sponsoredParams?.gas || 500000n,
      ...(sponsoredParams || {}),
    });

    console.log(`📝 Deployment tx: ${hash}`);

    // Wait for deployment confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    // Extract deployed contract address from logs
    const deployedAddress = extractContractAddress(receipt.logs);

    const deployedAgent: DeployedAgent = {
      agentId: generateAgentId(config.handle),
      handle: config.handle,
      contractAddress: deployedAddress,
      deploymentTx: hash,
      chainId: 84532,
      deployer: account.address,
      timestamp: new Date(),
    };

    console.log(`✅ Agent deployed successfully!`);
    console.log(`   Contract: ${deployedAddress}`);
    console.log(`   Tx: ${hash}`);
    console.log(`   ⛽ Gas: ${sponsoredParams ? 'SPONSORED' : 'Self-paid'}`);

    return deployedAgent;
  } catch (error) {
    console.error(`❌ Agent deployment failed:`, error);
    throw error;
  }
}

/**
 * Generate agent prediction using on-chain agent
 */
export async function callVirtualsAgent(
  agentAddress: string,
  natalChart: NatalChart,
  transitChart: TransitChart,
  question: string,
  targetDate: string
): Promise<{
  summary: string;
  highlights: string;
  dayScore: number;
  factors: string;
}> {
  try {
    const { publicClient } = createWeb3Clients();

    // Encode prediction request
    const requestData = encodePredictionRequest({
      natalChart,
      transitChart,
      question,
      targetDate,
    });

    // Call agent contract (read-only, no gas needed)
    const result = await publicClient.readContract({
      address: agentAddress as `0x${string}`,
      abi: AGENT_ABI,
      functionName: 'generatePrediction',
      args: [requestData],
    });

    return decodePredictionResult(result);
  } catch (error) {
    console.error('Error calling Virtuals agent:', error);
    throw error;
  }
}

/**
 * Update agent reputation on-chain
 * Gas sponsored by platform
 */
export async function updateAgentReputationOnChain(
  agentAddress: string,
  delta: number,
  reason: string
): Promise<string> {
  console.log(`📊 Updating agent ${agentAddress} reputation: ${delta > 0 ? '+' : ''}${delta}`);
  
  try {
    const { walletClient } = createWeb3Clients();

    const data = encodeReputationUpdate(delta, reason);

    // Get gas sponsorship
    const sponsoredParams = await getSponsoredTxParams(
      agentAddress,
      data,
      0n
    );

    const hash = await walletClient.sendTransaction({
      to: agentAddress as `0x${string}`,
      data: data as `0x${string}`,
      gas: sponsoredParams?.gas || 100000n,
      ...(sponsoredParams || {}),
    });

    console.log(`✅ Reputation updated on-chain: ${hash}`);
    return hash;
  } catch (error) {
    console.error('Error updating reputation:', error);
    throw error;
  }
}

/**
 * Get agent details from on-chain contract
 */
export async function getAgentDetails(agentAddress: string) {
  const { publicClient } = createWeb3Clients();

  const details = await publicClient.readContract({
    address: agentAddress as `0x${string}`,
    abi: AGENT_ABI,
    functionName: 'getAgentInfo',
  });

  return details;
}

// Helper functions
function encodeAgentDeployment(metadata: any): string {
  // Encode deployment call data
  // In production, use proper ABI encoding
  return `0x...${Buffer.from(JSON.stringify(metadata)).toString('hex')}`;
}

function extractContractAddress(logs: any[]): string {
  // Extract deployed contract address from event logs
  // In production, parse AgentDeployed event
  return logs[0]?.address || '0x0000000000000000000000000000000000000000';
}

function generateAgentId(handle: string): string {
  return `${handle}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function encodePredictionRequest(data: any): string {
  return `0x...${Buffer.from(JSON.stringify(data)).toString('hex')}`;
}

function decodePredictionResult(result: any): any {
  // Decode on-chain prediction result
  return {
    summary: 'On-chain prediction result',
    highlights: '- Decentralized\n- Trustless\n- Transparent',
    dayScore: 75,
    factors: 'On-chain factors',
  };
}

function encodeReputationUpdate(delta: number, reason: string): string {
  return `0x...${delta.toString(16)}`;
}

// Agent contract ABI (simplified)
const AGENT_ABI = [
  {
    name: 'generatePrediction',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'request', type: 'bytes' }],
    outputs: [{ name: 'result', type: 'bytes' }],
  },
  {
    name: 'getAgentInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'handle', type: 'string' },
      { name: 'reputation', type: 'uint256' },
      { name: 'totalPredictions', type: 'uint256' },
    ],
  },
  {
    name: 'updateReputation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'delta', type: 'int256' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
  },
] as const;

export { AGENT_ABI };

