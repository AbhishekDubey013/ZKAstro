import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Star, User, ArrowRight, Sparkles, TrendingUp, Calendar, Clock } from "lucide-react";
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[80px]" />
      </div>

      <div className="container max-w-5xl px-6 py-10 md:py-14 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-8 border-b border-border/50">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
                {user?.firstName && user?.lastName
                  ? `Welcome, ${user.firstName}`
                  : user?.email?.split('@')[0] || "Welcome back"}
              </h1>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                {user?.reputation && user.reputation > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    <Star className="h-3.5 w-3.5 fill-primary" />
                    {user.reputation}
                  </span>
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
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground mt-4">Loading your charts...</p>
          </div>
        ) : hasCharts ? (
          <div className="stagger space-y-8">
            {/* Main CTA Card */}
            <Card className="animate-fade-up relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl -ml-24 -mb-24" />
              
              <CardHeader className="relative pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">Today's Reading</span>
                  </div>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-serif">
                  What do the stars have in store?
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground mt-2">
                  Get personalized predictions based on current planetary transits and your natal chart.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-4 pb-6">
                <Button
                  onClick={handleKnowYourDay}
                  size="lg"
                  className="h-14 px-10 text-base font-semibold shadow-lg glow-primary group"
                  data-testid="button-know-your-day"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Today's Prediction
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card 
                className="animate-fade-up group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-300" 
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{ animationDelay: '0.1s' }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <User className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Update Birth Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Refine your natal chart with corrected information
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="animate-fade-up group cursor-pointer hover:border-accent/30 hover:shadow-lg transition-all duration-300" 
                onClick={() => setLocation("/agents")}
                style={{ animationDelay: '0.15s' }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <TrendingUp className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Agent Leaderboard</h3>
                        <p className="text-sm text-muted-foreground">
                          Track which AI makes the best predictions
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart stats */}
            {charts && charts.length > 0 && (
              <Card className="animate-fade-up bg-muted/30 border-border/50" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Chart created {new Date(charts[0].createdAt).toLocaleDateString()}</span>
                    </div>
                    {charts[0].onChainTxHash && (
                      <div className="flex items-center gap-2 text-accent">
                        <Sparkles className="h-4 w-4" />
                        <span>Verified on-chain</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form expansion */}
            {showCreateForm && (
              <Card className="animate-scale-in shadow-lg">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Update Your Chart</CardTitle>
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
          <div className="stagger">
            <div className="animate-fade-up mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8 bg-primary" />
                <span className="text-xs font-medium tracking-widest uppercase text-primary">Get Started</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-3">
                Create your natal chart
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl">
                Enter your birth information to generate a Western Equal-house chart. 
                This forms the basis for all your personalized predictions.
              </p>
            </div>

            <Card className="animate-fade-up shadow-lg" style={{ animationDelay: '0.1s' }}>
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
