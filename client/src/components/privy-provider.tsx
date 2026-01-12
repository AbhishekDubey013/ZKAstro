import { PrivyProvider } from '@privy-io/react-auth';
import { arbitrumSepolia } from 'viem/chains';

interface PrivyAuthProviderProps {
  children: React.ReactNode;
}

// Arbitrum Sepolia chain configuration
const arbitrumSepoliaChain = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  network: 'arbitrum-sepolia',
  nativeCurrency: {
    name: 'Arbitrum Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
};

export function PrivyAuthProvider({ children }: PrivyAuthProviderProps) {
  return (
    <PrivyProvider
      appId="cmgb15wpa00g0la0duq9rzaqw"
      config={{
        // Only allow email/social login - NO external wallets (MetaMask, etc.)
        loginMethods: ['google', 'github', 'email'],
        appearance: {
          theme: 'light',
          accentColor: '#f97316',
          logo: undefined,
        },
        // Force embedded wallet creation for ALL users
        embeddedWallets: {
          createOnLogin: 'all-users', // Create embedded wallet for everyone
          noPromptOnSignature: false, // Show confirmation for transactions
        },
        // Default chain for transactions
        defaultChain: arbitrumSepoliaChain,
        supportedChains: [arbitrumSepoliaChain],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
