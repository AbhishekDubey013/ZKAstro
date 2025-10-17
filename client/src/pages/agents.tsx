import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Award, Activity, Target, Zap, Brain, Sparkles } from "lucide-react";
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
      <div className="container max-w-7xl px-4 md:px-6 py-12">
        <Skeleton className="h-12 w-96 mb-4" />
        <Skeleton className="h-6 w-full max-w-2xl mb-12" />
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-7xl px-4 md:px-6 py-12 space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-4 pb-8 border-b border-border/50">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Agent Observatory
            </h1>
            <div className="relative">
              <Sparkles className="h-10 w-10 text-secondary animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-secondary/20 rounded-full" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI astrology agents ranked by cosmic accuracy and community trust. Each agent employs unique 
            prediction methodologies to guide your daily journey through the stars.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Active Agents
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-primary" data-testid="stat-active-agents">
                {activeAgents}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Competing prediction systems
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-card to-secondary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-secondary" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total Predictions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-secondary" data-testid="stat-total-predictions">
                {totalPredictions}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cosmic insights generated
              </p>
            </CardContent>
          </Card>

          <Card className="border-chart-3/20 bg-gradient-to-br from-card to-chart-3/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-chart-3" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total Reputation
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-chart-3" data-testid="stat-total-reputation">
                {totalReputation}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Community validation points
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance Cards */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Performance Leaderboard</h2>
          </div>

          {sortedAgents.map((agent, index) => {
            const rank = index + 1;
            const isTopRanked = rank <= 2;
            const totalPreds = parseInt(agent.total_predictions || "0");
            const wins = parseInt(agent.wins || "0");
            const winRate = totalPreds > 0 ? (wins / totalPreds) * 100 : 0;
            const avgScore = parseFloat(agent.avg_score || "0");

            const getRankColor = () => {
              if (rank === 1) return "from-chart-4/30 to-chart-4/5 border-chart-4/30";
              if (rank === 2) return "from-secondary/30 to-secondary/5 border-secondary/30";
              return "from-card to-card/50 border-border/50";
            };

            const getRankIcon = () => {
              if (rank === 1) return <Award className="h-8 w-8 text-chart-4" />;
              if (rank === 2) return <Zap className="h-8 w-8 text-secondary" />;
              return <span className="text-3xl font-mono text-muted-foreground">#{rank}</span>;
            };

            return (
              <Card
                key={agent.id}
                className={`bg-gradient-to-br ${getRankColor()} transition-all hover-elevate`}
                data-testid={`agent-card-${agent.handle}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Rank + Agent Info */}
                    <div className="flex items-start gap-6 flex-1">
                      {/* Rank Badge */}
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background/50 backdrop-blur-sm border border-border/50">
                        {getRankIcon()}
                      </div>

                      {/* Agent Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="font-serif text-2xl" data-testid={`agent-handle-${agent.handle}`}>
                            {agent.handle}
                          </CardTitle>
                          <Badge
                            variant={agent.is_active ? "default" : "secondary"}
                            className="text-xs"
                            data-testid={`agent-status-${agent.handle}`}
                          >
                            <Activity className={`h-3 w-3 mr-1 ${agent.is_active ? "text-chart-3" : ""}`} />
                            {agent.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <CardDescription className="text-base">
                          {agent.method}
                        </CardDescription>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {agent.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Reputation */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="text-4xl font-bold font-mono" data-testid={`reputation-${agent.handle}`}>
                          {agent.reputation}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Reputation</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-border/30">
                    {/* Win Rate */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Win Rate</span>
                        <span className="font-mono font-bold" data-testid={`winrate-${agent.handle}`}>
                          {winRate.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={winRate} 
                        className="h-2 bg-background/50"
                        data-testid={`winrate-progress-${agent.handle}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        {wins} wins / {totalPreds} predictions
                      </p>
                    </div>

                    {/* Avg Score */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Avg Day Score</span>
                        <span className="font-mono font-bold" data-testid={`avgscore-${agent.handle}`}>
                          {avgScore > 0 ? avgScore.toFixed(1) : "—"}
                        </span>
                      </div>
                      <Progress 
                        value={avgScore || 0} 
                        className="h-2 bg-background/50"
                        data-testid={`avgscore-progress-${agent.handle}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        Out of 100 points
                      </p>
                    </div>

                    {/* Total Predictions */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Total Insights</span>
                        <span className="font-mono font-bold" data-testid={`total-predictions-${agent.handle}`}>
                          {totalPreds}
                        </span>
                      </div>
                      <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${Math.min((totalPreds / Math.max(totalPredictions, 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(agent.created_at).toLocaleDateString()}
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
                <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg text-muted-foreground">
                  No agents available yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Footer */}
        <div className="text-center space-y-4 pt-8 border-t border-border/50">
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Agents earn reputation when their predictions resonate with users. The cosmic accuracy 
            of each agent is validated through community selection, creating a self-improving 
            prediction ecosystem guided by the wisdom of the collective.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Powered by astronomical calculations and AI intelligence</span>
            <Sparkles className="h-4 w-4 text-secondary" />
          </div>
        </div>
      </div>
    </div>
  );
}
