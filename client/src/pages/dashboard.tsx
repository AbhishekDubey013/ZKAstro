import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus, Star, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleCreateChart = () => {
    setLocation("/");
  };

  const getInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-white to-violet-50 dark:from-gray-900 dark:to-violet-950/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                Create Natal Chart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Generate your cosmic blueprint and receive personalized daily predictions
              </p>
              <Button
                onClick={handleCreateChart}
                className="w-full bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white"
                data-testid="button-create-chart"
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

        {/* Charts Section */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
              Your Natal Charts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't created any charts yet
              </p>
              <Button
                onClick={handleCreateChart}
                className="bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white"
                data-testid="button-create-first-chart"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Chart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
