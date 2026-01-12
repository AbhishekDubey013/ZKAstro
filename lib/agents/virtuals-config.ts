/**
 * Virtuals GAME SDK Configuration for Base Sepolia
 * Decentralized Agent Deployment with Gas Sponsorship
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Base Sepolia Configuration
export const BASE_SEPOLIA_CONFIG = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  explorer: 'https://sepolia-explorer.base.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Virtuals Protocol Configuration
export const VIRTUALS_CONFIG = {
  // Virtuals Protocol contracts on Base Sepolia
  gameRegistryAddress: process.env.VIRTUALS_GAME_REGISTRY || '0x...', // Update with actual address
  agentFactoryAddress: process.env.VIRTUALS_AGENT_FACTORY || '0x...', // Update with actual address
  
  // Gas Sponsorship (Paymaster)
  paymasterUrl: process.env.PAYMASTER_URL || 'https://paymaster.base.org',
  paymasterEnabled: true,
  
  // Agent Deployment Settings
  defaultAgentConfig: {
    gasLimit: 500000,
    maxFeePerGas: 1000000000, // 1 gwei
    maxPriorityFeePerGas: 1000000000,
  },
};

/**
 * Create Web3 clients for Base Sepolia
 */
export function createWeb3Clients() {
  const privateKey = process.env.AGENT_DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('AGENT_DEPLOYER_PRIVATE_KEY not set. Required for agent deployment.');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_CONFIG.rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_CONFIG.rpcUrl),
  });

  return { publicClient, walletClient, account };
}

/**
 * Gas Sponsorship Configuration (Paymaster)
 * Platform sponsors gas for agent operations
 */
export interface GasSponsorshipConfig {
  enabled: boolean;
  paymasterUrl?: string;
  sponsorAddress?: string;
}

export const gasSponsorshipConfig: GasSponsorshipConfig = {
  enabled: true,
  paymasterUrl: VIRTUALS_CONFIG.paymasterUrl,
  sponsorAddress: process.env.GAS_SPONSOR_ADDRESS, // Platform's gas sponsor wallet
};

/**
 * Get sponsored transaction parameters
 */
export async function getSponsoredTxParams(
  to: string,
  data: string,
  value: bigint = 0n
) {
  if (!gasSponsorshipConfig.enabled) {
    return null;
  }

  try {
    // Call paymaster service to get sponsored params
    const response = await fetch(gasSponsorshipConfig.paymasterUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'pm_sponsorUserOperation',
        params: [{
          to,
          data,
          value: value.toString(),
        }],
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Gas sponsorship failed:', error);
    return null;
  }
}

export default {
  BASE_SEPOLIA_CONFIG,
  VIRTUALS_CONFIG,
  gasSponsorshipConfig,
};

