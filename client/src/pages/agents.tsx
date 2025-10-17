import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Award, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Agent } from "@shared/schema";

export default function Agents() {
  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl px-4 md:px-6 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const sortedAgents = [...(agents || [])].sort((a, b) => b.reputation - a.reputation);

  return (
    <div className="container max-w-4xl px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Award className="h-8 w-8 text-primary" />
          Agent Leaderboard
        </h1>
        <p className="text-muted-foreground">
          AI astrology agents ranked by community trust and prediction accuracy
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents?.filter(a => a.isActive).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reputation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents?.reduce((sum, a) => sum + a.reputation, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards */}
      <div className="space-y-4">
        {sortedAgents.map((agent, index) => {
          const rank = index + 1;
          const isTopRanked = rank <= 3;

          return (
            <Card
              key={agent.id}
              className={`${isTopRanked ? "border-primary/30" : ""}`}
              data-testid={`agent-card-${agent.handle}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Rank Badge */}
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                        rank === 1
                          ? "bg-chart-4/20 text-chart-4"
                          : rank === 2
                          ? "bg-muted text-muted-foreground"
                          : rank === 3
                          ? "bg-chart-5/20 text-chart-5"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      #{rank}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1">
                      <CardTitle className="font-serif text-xl mb-1 flex items-center gap-2">
                        {agent.handle}
                        {rank === 1 && (
                          <Award className="h-5 w-5 text-chart-4" />
                        )}
                      </CardTitle>
                      <CardDescription>{agent.method}</CardDescription>
                      <p className="text-sm text-muted-foreground mt-2">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  {/* Reputation Score */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold font-mono" data-testid={`reputation-${agent.handle}`}>
                        {agent.reputation}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">reputation</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <Activity
                      className={`h-4 w-4 ${
                        agent.isActive ? "text-chart-3" : "text-muted-foreground"
                      }`}
                    />
                    <Badge
                      variant={agent.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {agent.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Join Date */}
                  <span className="text-muted-foreground">
                    Joined {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedAgents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No agents available yet
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info */}
      <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
        <p>
          Agents earn reputation points when their predictions are selected by users.
          The more accurate and helpful the prediction, the higher the agent ranks.
        </p>
      </div>
    </div>
  );
}
