import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Star, User, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { usePrivy } from "@privy-io/react-auth";
import type { Chart } from "@shared/schema";
import ChartCreationForm from "@/components/chart-creation-form";
import { useState } from "react";

export default function Dashboard() {
  const { user, isPrivyAuth } = useAuth();
  const { logout: privyLogout, user: privyUser } = usePrivy();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const privyUserId = privyUser?.wallet?.address || privyUser?.email?.address || null;

  const { data: charts, isLoading: chartsLoading } = useQuery<Chart[]>({
    queryKey: ["/api/charts", privyUserId],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const baseUrl = privyUserId ? `/api/charts?privyUserId=${encodeURIComponent(privyUserId)}` : `/api/charts`;
      const url = API_BASE_URL ? `${API_BASE_URL}${baseUrl}` : baseUrl;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch charts");
      return response.json();
    },
    enabled: !!user && !!privyUserId,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const handleLogout = () => {
    if (isPrivyAuth) {
      privyLogout();
      setLocation("/");
    } else {
      window.location.href = "/api/logout";
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const hasCharts = charts && charts.length > 0;

  const handleKnowYourDay = async () => {
    if (!charts || charts.length === 0) return;
    
    const mostRecentChart = charts[0];
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const url = `${API_BASE_URL}/api/chart/${mostRecentChart.id}/today-prediction`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to get prediction: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.requestId) {
        setLocation(`/request/${data.requestId}`);
      }
    } catch (err) {
      console.error("Error loading today's prediction:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-5xl px-6 py-10 md:py-14 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-8 border-b border-border">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-border">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-serif font-semibold text-foreground">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || "Welcome back"}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                {user?.reputation && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-primary" />
                      {user.reputation} rep
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>

        {chartsLoading ? (
          <div className="text-center py-16">
            <div className="inline-block h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading your charts...</p>
          </div>
        ) : hasCharts ? (
          <div className="stagger-children space-y-8">
            {/* Main CTA Card */}
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
              <CardHeader className="relative pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium tracking-wider uppercase text-primary">
                    Today's Reading
                  </span>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-serif">
                  What do the stars have in store?
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Get your personalized prediction based on current planetary transits.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-4">
                <Button
                  onClick={handleKnowYourDay}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold group"
                  data-testid="button-know-your-day"
                >
                  Get Today's Prediction
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="group hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setShowCreateForm(!showCreateForm)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-lg font-semibold mt-3">Update Birth Data</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Refine your natal chart with corrected birth information.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:border-accent/30 transition-colors cursor-pointer" onClick={() => setLocation("/agents")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-muted">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-accent transition-colors" />
                  </div>
                  <CardTitle className="text-lg font-semibold mt-3">Agent Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Track which AI agents make the most accurate predictions.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart Form Expansion */}
            {showCreateForm && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="font-serif">Update Your Chart</CardTitle>
                  <CardDescription>
                    Enter your birth details to generate a new natal chart.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartCreationForm />
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* New user flow */
          <div className="stagger-children">
            <div className="mb-8">
              <span className="text-xs font-medium tracking-wider uppercase text-primary">Get Started</span>
              <h2 className="text-3xl font-serif font-semibold mt-2 mb-3">
                Create your natal chart
              </h2>
              <p className="text-muted-foreground max-w-lg">
                Enter your birth information to generate a Western Equal-house chart. 
                This forms the basis for all your personalized predictions.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <ChartCreationForm />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
