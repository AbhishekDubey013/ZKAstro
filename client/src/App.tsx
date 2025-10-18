import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PrivyAuthProvider } from "@/components/privy-provider";
import { NavHeader } from "@/components/nav-header";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import ChartDetail from "@/pages/chart-detail";
import RequestDetail from "@/pages/request-detail";
import Agents from "@/pages/agents";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={Auth} />
          <Route path="/agents" component={Agents} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/auth" component={Dashboard} />
          <Route path="/chart/:id" component={ChartDetail} />
          <Route path="/request/:id" component={RequestDetail} />
          <Route path="/agents" component={Agents} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

export default function App() {
  return (
    <PrivyAuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <NavHeader />
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  );
}
