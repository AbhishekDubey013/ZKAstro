import { PrivyProvider } from '@privy-io/react-auth';

interface PrivyAuthProviderProps {
  children: React.ReactNode;
}

export function PrivyAuthProvider({ children }: PrivyAuthProviderProps) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID || "cmgb15wpa00g0la0duq9rzaqw";
  
  console.log('🔐 Privy App ID:', appId);
  
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet', 'farcaster', 'google', 'github', 'email'],
        appearance: {
          theme: 'dark',
          accentColor: '#8b5cf6',
          logo: undefined,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
