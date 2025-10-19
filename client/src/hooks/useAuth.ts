import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check Privy wallet authentication
  const { authenticated: isPrivyAuth, ready: isPrivyReady, user: privyUser } = usePrivy();

  // Only check Replit Auth if Privy is not authenticated
  const { data: replitUser, isLoading: isReplitLoading, isError } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !isPrivyAuth && isPrivyReady, // Only query if NOT using Privy AND Privy is ready
    refetchInterval: false,
    refetchOnWindowFocus: false,
    // Treat 401 as error (not authenticated)
    throwOnError: false,
  });

  // Combined authentication state
  // Only authenticated if:
  // 1. Privy says authenticated, OR
  // 2. We successfully got a replitUser (no error and user exists)
  const isAuthenticated = isPrivyAuth === true || (isPrivyReady && !isError && !!replitUser);
  
  // Show loading while Privy is initializing
  // Once Privy is ready, if not using Privy, wait for Replit check to complete
  const isLoading = !isPrivyReady || (!isPrivyAuth && isReplitLoading);
  
  // Map Privy user to our User type
  // Only create user object if actually authenticated
  const user: User | null = replitUser || (isPrivyAuth && privyUser ? {
    id: privyUser.id,
    email: privyUser.email?.address || null,
    firstName: privyUser.google?.name || privyUser.wallet?.address?.slice(0, 6) || null,
    lastName: null,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    reputation: 0,
  } : null);

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('[useAuth]', {
      isPrivyAuth,
      isPrivyReady,
      isReplitLoading,
      isError,
      hasReplitUser: !!replitUser,
      isAuthenticated,
      isLoading
    });
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    isPrivyAuth,
    privyUser,
  };
}
