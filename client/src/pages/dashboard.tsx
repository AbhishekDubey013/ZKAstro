import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus, Star, User, Calendar, Clock, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { usePrivy } from "@privy-io/react-auth";
import type { Chart } from "@shared/schema";
import ChartCreationForm from "@/components/chart-creation-form";

export default function Dashboard() {
  const { user, isPrivyAuth } = useAuth();
  const { logout: privyLogout } = usePrivy();
  const [, setLocation] = useLocation();

  // Fetch user's charts
  const { data: charts, isLoading: chartsLoading } = useQuery<Chart[]>({
    queryKey: ["/api/charts"],
    enabled: !!user,
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-violet-50 via-blue-50 to-teal-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-teal-950/20">
      <div className="container max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-white to-violet-50 dark:from-gray-900 dark:to-violet-950/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    Create Another Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Generate more cosmic blueprints for different birth data
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white"
                    data-testid="button-create-another-chart"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Chart
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-white to-teal-50 dark:from-gray-900 dark:to-teal-950/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Star className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    Agent Observatory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    View AI agent performance and prediction accuracy
                  </p>
                  <Button
                    onClick={() => setLocation("/agents")}
                    variant="outline"
                    className="w-full border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                    data-testid="button-view-agents"
                  >
                    View Leaderboard
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Charts List */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  Your Natal Charts ({charts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {charts.map((chart: any) => (
                    <Card
                      key={chart.id}
                      className="border-violet-200 dark:border-violet-800 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setLocation(`/chart/${chart.id}`)}
                      data-testid={`card-chart-${chart.id}`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-900 dark:text-gray-100">
                          <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          Chart {chart.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Created {new Date(chart.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{chart.algoVersion}</span>
                        </div>
                        {chart.zkEnabled && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            🔐 ZK Privacy Enabled
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
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
