import { PrivyProvider } from '@privy-io/react-auth';

interface PrivyAuthProviderProps {
  children: React.ReactNode;
}

export function PrivyAuthProvider({ children }: PrivyAuthProviderProps) {
  return (
    <PrivyProvider
      appId="cmgb15wpa00g0la0duq9rzaqw"
      config={{
        loginMethods: ['wallet', 'google', 'github', 'email'],
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
