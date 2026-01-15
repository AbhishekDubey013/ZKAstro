/**
 * On-Chain Registry Integration
 * Records chart creations and agent reputation updates
 * Supports both Base Sepolia (legacy) and Arbitrum Sepolia (ERC-8004)
 */

import { ethers } from 'ethers';
import { getSponsoredTxParams } from '../agents/virtuals-config.js';

// ═══════════════════════════════════════════════════════════════════════
// ERC-8004 Agent Registry ABI (Arbitrum Sepolia)
// ═══════════════════════════════════════════════════════════════════════

const ERC8004_AGENT_REGISTRY_ABI = [
  // Agent Registration
  'function registerAgent(string handle, string metadataURI) external returns (uint256)',
  'function updateAgentProfile(uint256 agentId, string metadataURI) external',
  'function getAgentProfile(uint256 agentId) external view returns (tuple(uint256 agentId, string handle, string metadataURI, address owner, uint256 reputation, uint256 totalPredictions, uint256 totalSelections, bool isValidated, bool isActive, uint256 createdAt, uint256 lastActionAt))',
  'function getAgentByHandle(string handle) external view returns (uint256)',
  
  // Credentials
  'function issueCredential(uint256 agentId, bytes32 credentialType, uint256 value, uint256 expiresAt, string proofURI) external',
  'function revokeCredential(uint256 agentId, bytes32 credentialType) external',
  'function getAgentCredentials(uint256 agentId) external view returns (tuple(bytes32 credentialType, uint256 value, uint256 issuedAt, uint256 expiresAt, address issuer, string proofURI, bool revoked)[])',
  'function hasValidCredential(uint256 agentId, bytes32 credentialType) external view returns (bool hasCredential, uint256 value)',
  
  // Validation
  'function validateAgent(uint256 agentId, bool isValid, string reason) external',
  'function validateAction(uint256 agentId, bytes32 actionHash, bool isValid, string reason) external',
  'function isAgentValidated(uint256 agentId) external view returns (bool)',
  'function getValidationHistory(uint256 agentId) external view returns (tuple(bytes32 actionHash, bool isValid, uint256 validatedAt, address validator, string reason)[])',
  
  // Reputation
  'function recordPrediction(uint256 agentId, bytes32 predictionId) external',
  'function recordSelection(uint256 agentId, bytes32 predictionId, address user, uint256 reputationDelta) external',
  'function updateReputation(uint256 agentId, int256 delta, string reason) external',
  'function getAgentStats(uint256 agentId) external view returns (uint256 reputation, uint256 totalPredictions, uint256 totalSelections, uint256 winRate, bool isValidated)',
  'function getReputationHistory(uint256 agentId) external view returns (tuple(uint256 agentId, int256 delta, string reason, address triggeredBy, uint256 timestamp)[])',
  
  // Admin
  'function setValidator(address validator, bool isValidator) external',
  'function setCredentialIssuer(address issuer, bool isIssuer) external',
  'function setAgentActive(uint256 agentId, bool isActive) external',
  
  // View Helpers
  'function getAgentsByOwner(address owner) external view returns (uint256[])',
  'function getTotalAgents() external view returns (uint256)',
  'function isValidator(address addr) external view returns (bool)',
  'function isCredentialIssuer(address addr) external view returns (bool)',
  
  // Constants
  'function ACCURACY_BADGE() external view returns (bytes32)',
  'function CONSISTENCY_BADGE() external view returns (bytes32)',
  'function SPECIALIZATION_BADGE() external view returns (bytes32)',
  'function VERIFIED_AGENT() external view returns (bytes32)',
  
  // Events
  'event AgentRegistered(uint256 indexed agentId, string handle, address indexed owner, string metadataURI, uint256 timestamp)',
  'event CredentialIssued(uint256 indexed agentId, bytes32 indexed credentialType, uint256 value, address indexed issuer, uint256 timestamp)',
  'event AgentValidated(uint256 indexed agentId, bool isValid, address indexed validator, uint256 timestamp)',
  'event ReputationChanged(uint256 indexed agentId, int256 delta, uint256 newReputation, string reason, uint256 timestamp)',
  'event SelectionRecorded(uint256 indexed agentId, bytes32 indexed predictionId, address indexed user, uint256 reputationDelta, uint256 timestamp)',
];

// Credential type constants (must match contract)
export const CREDENTIAL_TYPES = {
  ACCURACY_BADGE: ethers.keccak256(ethers.toUtf8Bytes('ACCURACY_BADGE')),
  CONSISTENCY_BADGE: ethers.keccak256(ethers.toUtf8Bytes('CONSISTENCY_BADGE')),
  SPECIALIZATION_BADGE: ethers.keccak256(ethers.toUtf8Bytes('SPECIALIZATION_BADGE')),
  VERIFIED_AGENT: ethers.keccak256(ethers.toUtf8Bytes('VERIFIED_AGENT')),
} as const;

// ═══════════════════════════════════════════════════════════════════════
// Legacy ABIs (Base Sepolia)
// ═══════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════
// ERC-8004 AGENT REGISTRY (Arbitrum Sepolia)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get ERC-8004 Agent Registry contract instance
 */
function getERC8004Contract() {
  const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  const erc8004Address = process.env.ERC8004_REGISTRY_ADDRESS;
  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';

  if (!privateKey) {
    throw new Error('AGENT_DEPLOYER_PRIVATE_KEY not set');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const erc8004Registry = erc8004Address
    ? new ethers.Contract(erc8004Address, ERC8004_AGENT_REGISTRY_ABI, wallet)
    : null;

  return { erc8004Registry, wallet, provider };
}

/**
 * Check if ERC-8004 registry is deployed
 */
export function isERC8004Deployed(): boolean {
  return !!process.env.ERC8004_REGISTRY_ADDRESS;
}

// ═══════════════════════════════════════════════════════════════════════
// ERC-8004 Agent Registration
// ═══════════════════════════════════════════════════════════════════════

export interface ERC8004AgentProfile {
  agentId: number;
  handle: string;
  metadataURI: string;
  owner: string;
  reputation: number;
  totalPredictions: number;
  totalSelections: number;
  isValidated: boolean;
  isActive: boolean;
  createdAt: number;
  lastActionAt: number;
}

export interface ERC8004Credential {
  credentialType: string;
  value: number;
  issuedAt: number;
  expiresAt: number;
  issuer: string;
  proofURI: string;
  revoked: boolean;
}

export interface ERC8004ValidationRecord {
  actionHash: string;
  isValid: boolean;
  validatedAt: number;
  validator: string;
  reason: string;
}

export interface ERC8004ReputationEvent {
  agentId: number;
  delta: number;
  reason: string;
  triggeredBy: string;
  timestamp: number;
}

/**
 * Register a new agent with ERC-8004 compliant profile
 * @param handle Agent handle (e.g., "@auriga")
 * @param metadataURI IPFS URI containing full agent configuration
 * @returns Agent ID and transaction hash
 */
export async function registerAgentERC8004(
  handle: string,
  metadataURI: string
): Promise<{ agentId: number; txHash: string } | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      console.log('⚠️  ERC-8004 registry not deployed');
      return null;
    }

    console.log(`🤖 Registering agent ${handle} on ERC-8004 registry...`);

    const tx = await erc8004Registry.registerAgent(handle, metadataURI);
    console.log(`  Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Agent registered on ERC-8004 (block ${receipt.blockNumber})`);

    // Parse AgentRegistered event to get agentId
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = erc8004Registry.interface.parseLog(log);
        return parsed?.name === 'AgentRegistered';
      } catch {
        return false;
      }
    });

    let agentId = 0;
    if (event) {
      const parsed = erc8004Registry.interface.parseLog(event);
      agentId = Number(parsed?.args?.agentId || 0);
    }

    return { agentId, txHash: tx.hash };
  } catch (error: any) {
    console.error('❌ Failed to register agent on ERC-8004:', error.message);
    return null;
  }
}

/**
 * Get agent profile from ERC-8004 registry
 * @param agentId Agent ID to query
 */
export async function getAgentProfileERC8004(
  agentId: number
): Promise<ERC8004AgentProfile | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const profile = await erc8004Registry.getAgentProfile(agentId);

    return {
      agentId: Number(profile.agentId),
      handle: profile.handle,
      metadataURI: profile.metadataURI,
      owner: profile.owner,
      reputation: Number(profile.reputation),
      totalPredictions: Number(profile.totalPredictions),
      totalSelections: Number(profile.totalSelections),
      isValidated: profile.isValidated,
      isActive: profile.isActive,
      createdAt: Number(profile.createdAt),
      lastActionAt: Number(profile.lastActionAt),
    };
  } catch (error: any) {
    console.error('Error fetching ERC-8004 agent profile:', error.message);
    return null;
  }
}

/**
 * Get agent ID by handle
 * @param handle Agent handle to look up
 */
export async function getAgentIdByHandle(handle: string): Promise<number | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const agentId = await erc8004Registry.getAgentByHandle(handle);
    return Number(agentId);
  } catch (error: any) {
    console.error('Error fetching agent ID by handle:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ERC-8004 Credentials
// ═══════════════════════════════════════════════════════════════════════

/**
 * Issue a credential to an agent
 * @param agentId Agent receiving the credential
 * @param credentialType Type of credential (use CREDENTIAL_TYPES constants)
 * @param value Credential value (e.g., accuracy percentage)
 * @param expiresAt Expiration timestamp (0 = never expires)
 * @param proofURI Optional URI to proof/evidence
 */
export async function issueCredentialERC8004(
  agentId: number,
  credentialType: string,
  value: number,
  expiresAt: number = 0,
  proofURI: string = ''
): Promise<string | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      console.log('⚠️  ERC-8004 registry not deployed');
      return null;
    }

    console.log(`🏅 Issuing credential to agent ${agentId}...`);

    const tx = await erc8004Registry.issueCredential(
      agentId,
      credentialType,
      value,
      expiresAt,
      proofURI
    );
    console.log(`  Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Credential issued (block ${receipt.blockNumber})`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to issue credential:', error.message);
    return null;
  }
}

/**
 * Revoke a credential from an agent
 * @param agentId Agent whose credential to revoke
 * @param credentialType Type of credential to revoke
 */
export async function revokeCredentialERC8004(
  agentId: number,
  credentialType: string
): Promise<string | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      console.log('⚠️  ERC-8004 registry not deployed');
      return null;
    }

    console.log(`🚫 Revoking credential from agent ${agentId}...`);

    const tx = await erc8004Registry.revokeCredential(agentId, credentialType);
    console.log(`  Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Credential revoked (block ${receipt.blockNumber})`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to revoke credential:', error.message);
    return null;
  }
}

/**
 * Get all credentials for an agent
 * @param agentId Agent to query
 */
export async function getAgentCredentialsERC8004(
  agentId: number
): Promise<ERC8004Credential[] | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const credentials = await erc8004Registry.getAgentCredentials(agentId);

    return credentials.map((cred: any) => ({
      credentialType: cred.credentialType,
      value: Number(cred.value),
      issuedAt: Number(cred.issuedAt),
      expiresAt: Number(cred.expiresAt),
      issuer: cred.issuer,
      proofURI: cred.proofURI,
      revoked: cred.revoked,
    }));
  } catch (error: any) {
    console.error('Error fetching agent credentials:', error.message);
    return null;
  }
}

/**
 * Check if agent has a valid credential
 * @param agentId Agent to check
 * @param credentialType Type of credential
 */
export async function hasValidCredentialERC8004(
  agentId: number,
  credentialType: string
): Promise<{ hasCredential: boolean; value: number } | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const [hasCredential, value] = await erc8004Registry.hasValidCredential(
      agentId,
      credentialType
    );

    return {
      hasCredential,
      value: Number(value),
    };
  } catch (error: any) {
    console.error('Error checking credential:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ERC-8004 Validation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Validate an agent (mark as verified)
 * @param agentId Agent to validate
 * @param isValid Validation result
 * @param reason Reason for validation decision
 */
export async function validateAgentERC8004(
  agentId: number,
  isValid: boolean,
  reason: string
): Promise<string | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      console.log('⚠️  ERC-8004 registry not deployed');
      return null;
    }

    console.log(`✅ Validating agent ${agentId} (${isValid ? 'VALID' : 'INVALID'})...`);

    const tx = await erc8004Registry.validateAgent(agentId, isValid, reason);
    console.log(`  Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Agent validation recorded (block ${receipt.blockNumber})`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to validate agent:', error.message);
    return null;
  }
}

/**
 * Validate a specific agent action
 * @param agentId Agent performing the action
 * @param actionHash Hash of the action being validated
 * @param isValid Whether action is valid
 * @param reason Reason for validation decision
 */
export async function validateActionERC8004(
  agentId: number,
  actionHash: string,
  isValid: boolean,
  reason: string
): Promise<string | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      console.log('⚠️  ERC-8004 registry not deployed');
      return null;
    }

    console.log(`✅ Validating action for agent ${agentId}...`);

    const tx = await erc8004Registry.validateAction(agentId, actionHash, isValid, reason);
    console.log(`  Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Action validation recorded (block ${receipt.blockNumber})`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to validate action:', error.message);
    return null;
  }
}

/**
 * Check if an agent is validated
 * @param agentId Agent to check
 */
export async function isAgentValidatedERC8004(agentId: number): Promise<boolean | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    return await erc8004Registry.isAgentValidated(agentId);
  } catch (error: any) {
    console.error('Error checking agent validation:', error.message);
    return null;
  }
}

/**
 * Get validation history for an agent
 * @param agentId Agent to query
 */
export async function getValidationHistoryERC8004(
  agentId: number
): Promise<ERC8004ValidationRecord[] | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const history = await erc8004Registry.getValidationHistory(agentId);

    return history.map((record: any) => ({
      actionHash: record.actionHash,
      isValid: record.isValid,
      validatedAt: Number(record.validatedAt),
      validator: record.validator,
      reason: record.reason,
    }));
  } catch (error: any) {
    console.error('Error fetching validation history:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ERC-8004 Reputation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Record a prediction made by an agent
 * @param agentId Agent making prediction
 * @param predictionId Unique prediction identifier
 */
export async function recordPredictionERC8004(
  agentId: number,
  predictionId: string
): Promise<string | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      console.log('⚠️  ERC-8004 registry not deployed');
      return null;
    }

    const predictionHash = ethers.keccak256(ethers.toUtf8Bytes(predictionId));

    const tx = await erc8004Registry.recordPrediction(agentId, predictionHash);
    const receipt = await tx.wait();

    console.log(`📊 Prediction recorded for agent ${agentId} (block ${receipt.blockNumber})`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to record prediction:', error.message);
    return null;
  }
}

/**
 * Record when a user selects an agent's prediction
 * @param agentId Agent whose prediction was selected
 * @param predictionId Prediction identifier
 * @param userAddress User who made selection
 * @param reputationDelta Reputation points to award
 */
export async function recordSelectionERC8004(
  agentId: number,
  predictionId: string,
  userAddress: string,
  reputationDelta: number
): Promise<string | null> {
  try {
    const { erc8004Registry, wallet } = getERC8004Contract();

    if (!erc8004Registry) {
      console.log('⚠️  ERC-8004 registry not deployed');
      return null;
    }

    const predictionHash = ethers.keccak256(ethers.toUtf8Bytes(predictionId));
    const user = userAddress || wallet.address;

    console.log(`🎯 Recording selection for agent ${agentId}...`);

    const tx = await erc8004Registry.recordSelection(
      agentId,
      predictionHash,
      user,
      reputationDelta
    );
    console.log(`  Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Selection recorded (block ${receipt.blockNumber})`);
    console.log(`  Reputation +${reputationDelta}`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to record selection:', error.message);
    return null;
  }
}

/**
 * Update agent reputation directly
 * @param agentId Agent to update
 * @param delta Reputation change (+/-)
 * @param reason Reason for change
 */
export async function updateReputationERC8004(
  agentId: number,
  delta: number,
  reason: string
): Promise<string | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      console.log('⚠️  ERC-8004 registry not deployed');
      return null;
    }

    console.log(`📊 Updating reputation for agent ${agentId} (${delta > 0 ? '+' : ''}${delta})...`);

    const tx = await erc8004Registry.updateReputation(agentId, delta, reason);
    console.log(`  Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Reputation updated (block ${receipt.blockNumber})`);

    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to update reputation:', error.message);
    return null;
  }
}

/**
 * Get agent stats from ERC-8004 registry
 * @param agentId Agent to query
 */
export async function getAgentStatsERC8004(agentId: number): Promise<{
  reputation: number;
  totalPredictions: number;
  totalSelections: number;
  winRate: number;
  isValidated: boolean;
} | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const [reputation, totalPredictions, totalSelections, winRate, isValidated] =
      await erc8004Registry.getAgentStats(agentId);

    return {
      reputation: Number(reputation),
      totalPredictions: Number(totalPredictions),
      totalSelections: Number(totalSelections),
      winRate: Number(winRate) / 100, // Convert from basis points
      isValidated,
    };
  } catch (error: any) {
    console.error('Error fetching ERC-8004 agent stats:', error.message);
    return null;
  }
}

/**
 * Get reputation history for an agent
 * @param agentId Agent to query
 */
export async function getReputationHistoryERC8004(
  agentId: number
): Promise<ERC8004ReputationEvent[] | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const history = await erc8004Registry.getReputationHistory(agentId);

    return history.map((event: any) => ({
      agentId: Number(event.agentId),
      delta: Number(event.delta),
      reason: event.reason,
      triggeredBy: event.triggeredBy,
      timestamp: Number(event.timestamp),
    }));
  } catch (error: any) {
    console.error('Error fetching reputation history:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ERC-8004 View Helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get total number of agents registered
 */
export async function getTotalAgentsERC8004(): Promise<number | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const total = await erc8004Registry.getTotalAgents();
    return Number(total);
  } catch (error: any) {
    console.error('Error fetching total agents:', error.message);
    return null;
  }
}

/**
 * Get all agents owned by an address
 * @param owner Owner address
 */
export async function getAgentsByOwnerERC8004(owner: string): Promise<number[] | null> {
  try {
    const { erc8004Registry } = getERC8004Contract();

    if (!erc8004Registry) {
      return null;
    }

    const agentIds = await erc8004Registry.getAgentsByOwner(owner);
    return agentIds.map((id: any) => Number(id));
  } catch (error: any) {
    console.error('Error fetching agents by owner:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export default {
  // Legacy (Base Sepolia)
  recordChartOnChain,
  recordAgentSelectionOnChain,
  registerAgentOnChain,
  getAgentStatsOnChain,
  verifyChartOnChain,
  areContractsDeployed,
  
  // ERC-8004 (Arbitrum Sepolia)
  isERC8004Deployed,
  CREDENTIAL_TYPES,
  
  // Agent Registration
  registerAgentERC8004,
  getAgentProfileERC8004,
  getAgentIdByHandle,
  
  // Credentials
  issueCredentialERC8004,
  revokeCredentialERC8004,
  getAgentCredentialsERC8004,
  hasValidCredentialERC8004,
  
  // Validation
  validateAgentERC8004,
  validateActionERC8004,
  isAgentValidatedERC8004,
  getValidationHistoryERC8004,
  
  // Reputation
  recordPredictionERC8004,
  recordSelectionERC8004,
  updateReputationERC8004,
  getAgentStatsERC8004,
  getReputationHistoryERC8004,
  
  // Helpers
  getTotalAgentsERC8004,
  getAgentsByOwnerERC8004,
};

