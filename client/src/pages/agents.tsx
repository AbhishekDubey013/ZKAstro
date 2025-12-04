import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Award, Activity, Target, Users, BarChart3, Sparkles, Crown } from "lucide-react";
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[80px]" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10 stagger">
        {/* Header */}
        <div className="animate-fade-up space-y-3 pb-8 border-b border-border/50 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-primary" />
            <span className="text-xs font-medium tracking-widest uppercase text-primary">Leaderboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold">
            Agent Performance
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            AI agents ranked by prediction accuracy and community trust.
          </p>
        </div>

        {/* Stats */}
        <div className="animate-fade-up grid grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10" style={{ animationDelay: '0.05s' }}>
          <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</span>
              </div>
              <div className="text-3xl font-semibold tabular-nums" data-testid="stat-active-agents">
                {activeAgents}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Predictions</span>
              </div>
              <div className="text-3xl font-semibold tabular-nums" data-testid="stat-total-predictions">
                {totalPredictions}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-chart-3/5 border-chart-3/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-chart-3" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Rep</span>
              </div>
              <div className="text-3xl font-semibold tabular-nums" data-testid="stat-total-reputation">
                {totalReputation}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent List */}
        <div className="space-y-4">
          {sortedAgents.map((agent, index) => {
            const rank = index + 1;
            const isTop = rank === 1;
            const totalPreds = parseInt(agent.total_predictions || "0");
            const wins = parseInt(agent.wins || "0");
            const winRate = totalPreds > 0 ? (wins / totalPreds) * 100 : 0;
            const avgScore = parseFloat(agent.avg_score || "0");

            return (
              <Card
                key={agent.id}
                className={`animate-fade-up group transition-all duration-300 ${
                  isTop 
                    ? 'border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg' 
                    : 'hover:border-primary/20 hover:shadow-md'
                }`}
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                data-testid={`agent-card-${agent.handle}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Rank badge */}
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-semibold text-lg ${
                        isTop 
                          ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isTop ? (
                          <Crown className="h-6 w-6" />
                        ) : (
                          <span>#{rank}</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl font-serif" data-testid={`agent-handle-${agent.handle}`}>
                            {agent.handle}
                          </CardTitle>
                          <Badge
                            variant={agent.is_active ? "default" : "secondary"}
                            className={`text-[10px] px-2 ${agent.is_active ? 'bg-accent/10 text-accent border-accent/20' : ''}`}
                            data-testid={`agent-status-${agent.handle}`}
                          >
                            <Activity className={`h-2.5 w-2.5 mr-1 ${agent.is_active ? '' : 'opacity-50'}`} />
                            {agent.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm font-medium">
                          {agent.method}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Reputation */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-primary">
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-2xl font-semibold tabular-nums" data-testid={`reputation-${agent.handle}`}>
                          {agent.reputation}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">reputation</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-5">
                    {agent.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Win rate</span>
                        <span className="font-semibold tabular-nums text-foreground" data-testid={`winrate-${agent.handle}`}>
                          {winRate.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={winRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">{wins} of {totalPreds}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg score</span>
                        <span className="font-semibold tabular-nums text-foreground" data-testid={`avgscore-${agent.handle}`}>
                          {avgScore > 0 ? avgScore.toFixed(1) : "—"}
                        </span>
                      </div>
                      <Progress value={avgScore} className="h-2" />
                      <p className="text-xs text-muted-foreground">out of 100</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Predictions</span>
                        <span className="font-semibold tabular-nums text-foreground" data-testid={`total-predictions-${agent.handle}`}>
                          {totalPreds}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((totalPreds / Math.max(totalPredictions, 1)) * 100, 100)} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground">
                        since {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sortedAgents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-lg text-muted-foreground">No agents available yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/60 text-center pt-8 mt-8 border-t border-border/30">
          Agents earn reputation when users select their predictions. Rankings update in real-time.
        </p>
      </div>
    </div>
  );
}
