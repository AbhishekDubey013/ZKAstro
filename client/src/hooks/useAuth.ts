import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check Replit Auth session
  const { data: replitUser, isLoading: isReplitLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check Privy wallet authentication
  const { authenticated: isPrivyAuth, ready: isPrivyReady, user: privyUser } = usePrivy();

  // Combined authentication state
  const isAuthenticated = !!replitUser || isPrivyAuth;
  const isLoading = isReplitLoading || !isPrivyReady;
  
  // Map Privy user to our User type
  const user: User | null = replitUser || (privyUser ? {
    id: privyUser.id,
    email: privyUser.email?.address || null,
    firstName: privyUser.google?.name || privyUser.wallet?.address?.slice(0, 6) || null,
    lastName: null,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    reputation: 0,
  } : null);

  return {
    user,
    isLoading,
    isAuthenticated,
    isPrivyAuth,
    privyUser,
  };
}
