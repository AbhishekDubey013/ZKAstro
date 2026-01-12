/**
 * useAuth Hook
 * 
 * Simple authentication using MetaMask wallet connection.
 * Replaces Privy-based auth with direct MetaMask.
 */

import { useMetaMaskContext } from "@/components/metamask-provider";
import type { User } from "@shared/schema";

export function useAuth() {
  const { account, isConnected, isConnecting, chainId } = useMetaMaskContext();

  // Create user object from wallet address
  const user: User | null = isConnected && account ? {
    id: account,
    email: null,
    firstName: `${account.slice(0, 6)}...${account.slice(-4)}`,
    lastName: null,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    reputation: 0,
  } : null;

  return {
    user,
    isLoading: isConnecting,
    isAuthenticated: isConnected,
    walletAddress: account,
    chainId,
  };
}
