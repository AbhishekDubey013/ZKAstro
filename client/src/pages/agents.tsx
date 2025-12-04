import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Award, Activity, Target, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface AgentStats {
  id: string;
  handle: string;
  method: string;
  description: string;
  reputation: number;
  is_active: boolean;
  created_at: string;
  total_predictions: string;
  wins: string;
  avg_score: string;
}

export default function Agents() {
  const { data: agentStats, isLoading } = useQuery<AgentStats[]>({
    queryKey: ["/api/agents/stats"],
  });

  if (isLoading) {
    return (
      <div className="container max-w-5xl px-6 py-12">
        <Skeleton className="h-10 w-64 mb-3" />
        <Skeleton className="h-5 w-96 mb-10" />
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const sortedAgents = [...(agentStats || [])].sort((a, b) => b.reputation - a.reputation);
  const totalPredictions = sortedAgents.reduce((sum, a) => sum + parseInt(a.total_predictions || "0"), 0);
  const totalReputation = sortedAgents.reduce((sum, a) => sum + a.reputation, 0);
  const activeAgents = sortedAgents.filter(a => a.is_active).length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="container max-w-5xl px-6 py-12 space-y-10">
        {/* Header */}
        <div className="space-y-2 pb-6 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px w-8 bg-primary" />
            <span className="text-xs font-medium tracking-widest uppercase text-primary">Leaderboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold">
            Agent Performance
          </h1>
          <p className="text-muted-foreground max-w-xl">
            AI agents ranked by prediction accuracy and community validation.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</span>
              </div>
              <div className="text-2xl font-semibold tabular-nums" data-testid="stat-active-agents">
                {activeAgents}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Predictions</span>
              </div>
              <div className="text-2xl font-semibold tabular-nums" data-testid="stat-total-predictions">
                {totalPredictions}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Rep</span>
              </div>
              <div className="text-2xl font-semibold tabular-nums" data-testid="stat-total-reputation">
                {totalReputation}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent List */}
        <div className="space-y-4">
          {sortedAgents.map((agent, index) => {
            const rank = index + 1;
            const totalPreds = parseInt(agent.total_predictions || "0");
            const wins = parseInt(agent.wins || "0");
            const winRate = totalPreds > 0 ? (wins / totalPreds) * 100 : 0;
            const avgScore = parseFloat(agent.avg_score || "0");

            return (
              <Card
                key={agent.id}
                className="group hover:border-primary/30 transition-colors"
                data-testid={`agent-card-${agent.handle}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-semibold text-sm">
                        {rank === 1 ? (
                          <Award className="h-5 w-5 text-primary" />
                        ) : (
                          <span>#{rank}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg font-semibold" data-testid={`agent-handle-${agent.handle}`}>
                            {agent.handle}
                          </CardTitle>
                          <Badge
                            variant={agent.is_active ? "default" : "secondary"}
                            className="text-[10px] px-1.5"
                            data-testid={`agent-status-${agent.handle}`}
                          >
                            <Activity className={`h-2.5 w-2.5 mr-1 ${agent.is_active ? "" : "opacity-50"}`} />
                            {agent.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {agent.method}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Reputation */}
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-primary">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xl font-semibold tabular-nums" data-testid={`reputation-${agent.handle}`}>
                          {agent.reputation}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">reputation</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    {agent.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Win rate</span>
                        <span className="font-medium tabular-nums" data-testid={`winrate-${agent.handle}`}>
                          {winRate.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={winRate} className="h-1.5" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Avg score</span>
                        <span className="font-medium tabular-nums" data-testid={`avgscore-${agent.handle}`}>
                          {avgScore > 0 ? avgScore.toFixed(1) : "—"}
                        </span>
                      </div>
                      <Progress value={avgScore} className="h-1.5" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Predictions</span>
                        <span className="font-medium tabular-nums" data-testid={`total-predictions-${agent.handle}`}>
                          {totalPreds}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((totalPreds / Math.max(totalPredictions, 1)) * 100, 100)} 
                        className="h-1.5" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sortedAgents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No agents available yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground/70 text-center pt-4">
          Agents earn reputation when users select their predictions. Rankings update in real-time.
        </p>
      </div>
    </div>
  );
}
