import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    // Clone response once to read body without consuming original
    const clonedRes = res.clone();
    
    try {
      const errorData = await clonedRes.json();
      // Prefer the message field, then error field, then fallback to statusText
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || res.statusText;
    } catch (jsonError) {
      // If JSON parsing fails, try reading as text
      try {
        // Clone again for text reading (previous clone may be consumed)
        const textRes = res.clone();
        const text = await textRes.text();
        errorMessage = text || res.statusText;
      } catch (textError) {
        // If all else fails, use status text
        errorMessage = res.statusText || `HTTP ${res.status} Error`;
      }
    }
    
    const error = new Error(errorMessage);
    (error as any).status = res.status;
    throw error;
  }
}

// Get API base URL from environment or use relative path for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper to construct absolute URL
function buildApiUrl(url: string): string {
  if (!API_BASE_URL) {
    // No base URL - use relative path for local dev
    return url.startsWith('/') ? url : `/${url}`;
  }
  
  // Ensure base URL is absolute (starts with http:// or https://)
  let base = API_BASE_URL.trim();
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    // If relative path provided, make it absolute using current origin
    if (base.startsWith('/')) {
      base = `${window.location.origin}${base}`;
    } else {
      // Assume it's meant to be on same origin
      base = `${window.location.origin}/${base}`;
    }
  }
  
  // Remove trailing slash from base
  base = base.replace(/\/$/, '');
  
  // Ensure path starts with /
  const path = url.startsWith('/') ? url : `/${url}`;
  
  return `${base}${path}`;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = buildApiUrl(url);
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = buildApiUrl(url);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
