import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { MetaMaskAuthProvider } from "@/components/metamask-provider";
import { NavHeader } from "@/components/nav-header";
import { useMetaMaskContext } from "@/components/metamask-provider";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import ChartDetail from "@/pages/chart-detail";
import RequestDetail from "@/pages/request-detail";
import Agents from "@/pages/agents";
import CreateAgent from "@/pages/create-agent";
import NotFound from "@/pages/not-found";
import { Sparkles } from "lucide-react";

function Router() {
  // Hook called unconditionally at top level
  const { isConnected, isConnecting } = useMetaMaskContext();

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-background">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="h-12 w-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Sparkles className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground">Connecting wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isConnected ? Dashboard : Landing} />
      <Route path="/auth" component={isConnected ? Dashboard : Auth} />
      <Route path="/dashboard" component={isConnected ? Dashboard : Landing} />
      <Route path="/chart/:id" component={isConnected ? ChartDetail : Landing} />
      <Route path="/request/:id" component={isConnected ? RequestDetail : Landing} />
      <Route path="/agents" component={Agents} />
      <Route path="/create-agent" component={CreateAgent} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <MetaMaskAuthProvider>
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
    </MetaMaskAuthProvider>
  );
}
