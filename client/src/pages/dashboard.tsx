import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus, Star, User, Calendar, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { usePrivy } from "@privy-io/react-auth";
import type { Chart } from "@shared/schema";
import ChartCreationForm from "@/components/chart-creation-form";
import { useState } from "react";

export default function Dashboard() {
  const { user, isPrivyAuth } = useAuth();
  const { logout: privyLogout } = usePrivy();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch user's charts (works in local dev because auth middleware is bypassed)
  const { data: charts, isLoading: chartsLoading } = useQuery<Chart[]>({
    queryKey: ["/api/charts"],
    enabled: !!user, // Fetch charts for all authenticated users
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
      const response = await fetch(`/api/chart/${mostRecentChart.id}/today-prediction`);
      const data = await response.json();
      
      if (data.requestId) {
        setLocation(`/request/${data.requestId}`);
      }
    } catch (err) {
      console.error("Error loading today's prediction:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-violet-50 via-blue-50 to-teal-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-teal-950/20 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-purple-400/20 dark:from-violet-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-teal-400/20 dark:from-blue-500/10 dark:to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="container max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* User Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-violet-300 dark:border-violet-700">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-teal-500 text-white text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "Welcome"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.reputation || 0} reputation
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-gray-300 dark:border-gray-700"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {chartsLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading your charts...</p>
          </div>
        ) : hasCharts ? (
          <>
            {/* Hero CTA - Know Your Day */}
            <Card className="border-violet-400/50 dark:border-violet-600/50 bg-gradient-to-br from-violet-100 via-blue-100 to-teal-100 dark:from-violet-900/40 dark:via-blue-900/40 dark:to-teal-900/40 mb-6 sm:mb-8 shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 backdrop-blur animate-glow">
              <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="inline-flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-8 w-8 text-violet-500 dark:text-violet-400 animate-pulse" />
                  <Sparkles className="h-6 w-6 text-blue-500 dark:text-blue-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <Sparkles className="h-8 w-8 text-teal-500 dark:text-teal-400 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-600 dark:from-violet-400 dark:via-blue-400 dark:to-teal-400 bg-clip-text text-transparent leading-tight animate-gradient-x">
                  Ready to discover your cosmic forecast?
                </CardTitle>
                <CardDescription className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mt-3 px-2 font-medium">
                  Get AI-powered predictions for today based on your natal chart
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-6 sm:pb-8 px-4">
                <Button
                  onClick={handleKnowYourDay}
                  size="lg"
                  className="h-14 sm:h-16 px-8 sm:px-12 text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-600 hover:from-violet-700 hover:via-blue-700 hover:to-teal-700 text-white shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 hover:scale-110 w-full sm:w-auto border-0"
                  data-testid="button-know-your-day"
                >
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 mr-2 sm:mr-3 animate-spin flex-shrink-0" style={{ animationDuration: '3s' }} />
                  <span className="whitespace-nowrap">Know Your Day</span>
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 ml-2 sm:ml-3 animate-spin flex-shrink-0" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                </Button>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-3 sm:mt-4">
                  ✨ Using your most recent chart
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Card className="border-violet-300/50 dark:border-violet-700/50 bg-gradient-to-br from-white/80 to-violet-100/80 dark:from-gray-900/80 dark:to-violet-950/40 backdrop-blur hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold">
                    <User className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    Update Your Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Update your birth information if needed
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
                    data-testid="button-update-chart"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {showCreateForm ? "Hide Form" : "Update Chart"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-teal-300/50 dark:border-teal-700/50 bg-gradient-to-br from-white/80 to-teal-100/80 dark:from-gray-900/80 dark:to-teal-950/40 backdrop-blur hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold">
                    <Star className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    Agent Observatory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    View AI agent performance and prediction accuracy
                  </p>
                  <Button
                    onClick={() => setLocation("/agents")}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
                    data-testid="button-view-agents"
                  >
                    View Leaderboard
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Conditional Chart Creation Form */}
            {showCreateForm && (
              <div className="mb-8">
                <Card className="border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                      Update Your Natal Chart
                    </CardTitle>
                    <CardDescription>
                      Update your birth information to regenerate your chart
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartCreationForm />
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        ) : (
          <>
            {/* New User - Show Chart Creation Form */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Create Your First Natal Chart
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your birth information to generate your Western Equal-house chart and receive personalized daily predictions
              </p>
            </div>

            <ChartCreationForm />
          </>
        )}
      </div>
    </div>
  );
}
