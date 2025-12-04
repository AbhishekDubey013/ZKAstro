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
          theme: 'light', // Will adapt to system preference
          accentColor: '#f97316', // Orange/amber to match our primary
          logo: undefined,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
