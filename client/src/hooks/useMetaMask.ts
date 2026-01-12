/**
 * MetaMask Hook
 * 
 * Simple wallet connection using MetaMask directly.
 * No external auth providers needed.
 * 
 * Reference: https://github.com/hummusonrails/x402-demo-arbitrum
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserProvider, JsonRpcSigner, formatEther, parseEther } from 'ethers';

// Arbitrum Sepolia chain config
const ARBITRUM_SEPOLIA = {
  chainId: '0x66eee', // 421614 in hex
  chainName: 'Arbitrum Sepolia',
  nativeCurrency: {
    name: 'Arbitrum Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://sepolia.arbiscan.io'],
};

interface MetaMaskState {
  account: string | null;
  chainId: number | null;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

interface MetaMaskContextType extends MetaMaskState {
  connect: () => Promise<string>;
  disconnect: () => void;
  switchToArbitrumSepolia: () => Promise<void>;
  getProvider: () => BrowserProvider | null;
  getSigner: () => Promise<JsonRpcSigner | null>;
  sendTransaction: (to: string, value: bigint) => Promise<string>;
  refreshBalance: () => Promise<void>;
}

// Check if MetaMask is installed
const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

export function useMetaMask(): MetaMaskContextType {
  const [state, setState] = useState<MetaMaskState>({
    account: null,
    chainId: null,
    balance: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  // Get provider instance
  const getProvider = useCallback((): BrowserProvider | null => {
    if (!isMetaMaskInstalled() || !window.ethereum) return null;
    return new BrowserProvider(window.ethereum as any);
  }, []);

  // Get signer instance
  const getSigner = useCallback(async (): Promise<JsonRpcSigner | null> => {
    const provider = getProvider();
    if (!provider) return null;
    try {
      return await provider.getSigner();
    } catch {
      return null;
    }
  }, [getProvider]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!state.account) return;
    
    const provider = getProvider();
    if (!provider) return;

    try {
      const balance = await provider.getBalance(state.account);
      setState(prev => ({ ...prev, balance: formatEther(balance) }));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, [state.account, getProvider]);

  // Switch to Arbitrum Sepolia
  const switchToArbitrumSepolia = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask not installed');
    }

    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_SEPOLIA.chainId }],
      });
    } catch (switchError: any) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [ARBITRUM_SEPOLIA],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async (): Promise<string> => {
    if (!isMetaMaskInstalled()) {
      setState(prev => ({ ...prev, error: 'MetaMask not installed. Please install MetaMask.' }));
      throw new Error('MetaMask not installed');
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];

      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      });
      const chainId = parseInt(chainIdHex, 16);

      // Switch to Arbitrum Sepolia if not already on it
      if (chainId !== 421614) {
        await switchToArbitrumSepolia();
      }

      // Get balance
      const provider = new BrowserProvider(window.ethereum as any);
      const balance = await provider.getBalance(account);

      setState({
        account,
        chainId: 421614,
        balance: formatEther(balance),
        isConnecting: false,
        isConnected: true,
        error: null,
      });

      // Store in localStorage for persistence
      localStorage.setItem('metamask_connected', 'true');

      return account;
    } catch (error: any) {
      const errorMessage = error.code === 4001 
        ? 'Connection rejected by user' 
        : error.message || 'Failed to connect';
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [switchToArbitrumSepolia]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      account: null,
      chainId: null,
      balance: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
    localStorage.removeItem('metamask_connected');
  }, []);

  // Send transaction
  const sendTransaction = useCallback(async (to: string, value: bigint): Promise<string> => {
    const signer = await getSigner();
    if (!signer) {
      throw new Error('No signer available');
    }

    const tx = await signer.sendTransaction({
      to,
      value,
    });

    return tx.hash;
  }, [getSigner]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled() || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState(prev => ({ ...prev, account: accounts[0] }));
        refreshBalance();
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      setState(prev => ({ ...prev, chainId }));
      refreshBalance();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnect, refreshBalance]);

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('metamask_connected') === 'true';
    
    if (wasConnected && isMetaMaskInstalled() && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts.length > 0 && window.ethereum) {
            const account = accounts[0];
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            const chainId = parseInt(chainIdHex, 16);
            
            const provider = new BrowserProvider(window.ethereum as any);
            const balance = await provider.getBalance(account);

            setState({
              account,
              chainId,
              balance: formatEther(balance),
              isConnecting: false,
              isConnected: true,
              error: null,
            });
          }
        })
        .catch(console.error);
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchToArbitrumSepolia,
    getProvider,
    getSigner,
    sendTransaction,
    refreshBalance,
  };
}

// Context for sharing wallet state across components
const MetaMaskContext = createContext<MetaMaskContextType | null>(null);

export const MetaMaskProvider = MetaMaskContext.Provider;

export function useMetaMaskContext(): MetaMaskContextType {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error('useMetaMaskContext must be used within a MetaMaskProvider');
  }
  return context;
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

