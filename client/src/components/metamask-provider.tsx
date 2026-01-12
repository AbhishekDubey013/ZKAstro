/**
 * MetaMask Provider
 * 
 * Replaces Privy with direct MetaMask connection.
 * Simpler and more standard Web3 approach.
 */

import { ReactNode } from 'react';
import { useMetaMask, MetaMaskProvider } from '@/hooks/useMetaMask';

interface MetaMaskAuthProviderProps {
  children: ReactNode;
}

export function MetaMaskAuthProvider({ children }: MetaMaskAuthProviderProps) {
  // Hook must be called unconditionally at top level
  const metamask = useMetaMask();

  return (
    <MetaMaskProvider value={metamask}>
      {children}
    </MetaMaskProvider>
  );
}

// Re-export for convenience
export { useMetaMaskContext } from '@/hooks/useMetaMask';
