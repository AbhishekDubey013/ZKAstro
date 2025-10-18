import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";

export function useAuth() {
  // Check Replit Auth session
  const { data: replitUser, isLoading: isReplitLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check Privy wallet authentication
  const { authenticated: isPrivyAuth, ready: isPrivyReady, user: privyUser } = usePrivy();

  // Combined authentication state
  const isAuthenticated = !!replitUser || isPrivyAuth;
  const isLoading = isReplitLoading || !isPrivyReady;
  const user = replitUser || (privyUser ? {
    id: privyUser.id,
    email: privyUser.email?.address,
    firstName: privyUser.google?.name || privyUser.wallet?.address?.slice(0, 6),
    lastName: '',
    profileImageUrl: undefined,
  } : null);

  return {
    user,
    isLoading,
    isAuthenticated,
    isPrivyAuth,
    privyUser,
  };
}
