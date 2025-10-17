import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";

interface RequestData {
  request: {
    id: string;
    question: string;
    targetDate: string;
    status: string;
    selectedAnswerId: string | null;
  };
  chart: {
    id: string;
    paramsJson: any;
  };
  answers: Array<{
    id: string;
    agentId: string;
    summary: string;
    highlights: string;
    dayScore: number;
    factors: string;
    agent: {
      handle: string;
      method: string;
      reputation: number;
    };
  }>;
}

function ScoreCircle({ score }: { score: number }) {
  const scoreColor =
    score >= 70 ? "text-chart-3" : score >= 40 ? "text-chart-4" : "text-chart-5";
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/20"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${(score / 100) * 351.86} 351.86`}
          className={scoreColor}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold font-mono ${scoreColor}`}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function RequestDetail() {
  const [, params] = useRoute("/request/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const requestId = params?.id;

  const { data, isLoading } = useQuery<RequestData>({
    queryKey: ["/api/request", requestId],
    enabled: !!requestId,
    refetchInterval: (query) => {
      const data = query.state.data as RequestData | undefined;
      return data?.request?.status === "OPEN" ? 2000 : false;
    },
  });

  const selectAnswerMutation = useMutation({
    mutationFn: async (answerId: string) => {
      return await apiRequest("POST", `/api/request/${requestId}/select`, {
        answerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Prediction selected",
        description: "The agent's reputation has been updated!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error selecting prediction",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-7xl px-4 md:px-6 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container max-w-7xl px-4 md:px-6 py-8 text-center">
        <p className="text-muted-foreground">Request not found</p>
      </div>
    );
  }

  const { request, answers } = data;
  const isSettled = request.status === "SETTLED";

  return (
    <div className="container max-w-7xl px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">Daily Prediction</h1>
          <Badge variant={isSettled ? "default" : "secondary"} data-testid={`status-${request.status.toLowerCase()}`}>
            {request.status}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">{request.question}</p>
        <p className="text-sm text-muted-foreground">
          For {new Date(request.targetDate).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Loading State */}
      {request.status === "OPEN" && answers.length < 2 && (
        <Card className="border-primary/20">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              <div>
                <p className="font-medium">Agents are analyzing the stars...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Received {answers.length} of 2 predictions
                </p>
              </div>
              <Progress value={(answers.length / 2) * 100} className="w-64" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Predictions - Side by Side */}
      {answers.length >= 2 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {answers.map((answer) => {
            const isSelected = request.selectedAnswerId === answer.id;
            const factorsList = answer.factors.split(';').map(f => f.trim()).filter(Boolean);
            const highlightsList = answer.highlights.split('\n').map(h => h.trim()).filter(Boolean);

            return (
              <Card
                key={answer.id}
                className={`relative ${
                  isSelected ? "border-primary/50 bg-primary/5" : ""
                }`}
                data-testid={`answer-card-${answer.agent.handle}`}
              >
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Selected
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="font-serif text-xl mb-1">
                        {answer.agent.handle}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {answer.agent.method}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1" data-testid={`reputation-${answer.agent.handle}`}>
                      <TrendingUp className="h-3 w-3" />
                      {answer.agent.reputation}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Day Score */}
                  <div className="flex justify-center">
                    <ScoreCircle score={answer.dayScore} />
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Daily Reading
                    </h4>
                    <p className="text-sm leading-relaxed" data-testid={`summary-${answer.agent.handle}`}>
                      {answer.summary}
                    </p>
                  </div>

                  {/* Highlights */}
                  {highlightsList.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Key Highlights
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {highlightsList.map((highlight, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{highlight.replace(/^-\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Astrological Factors */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Cosmic Factors
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {factorsList.map((factor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  {!isSettled && (
                    <Button
                      className="w-full"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => selectAnswerMutation.mutate(answer.id)}
                      disabled={selectAnswerMutation.isPending}
                      data-testid={`button-select-${answer.agent.handle}`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Selected
                        </>
                      ) : (
                        "Choose This Prediction"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      {isSettled && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation(`/chart/${request.chartId}`)}
            data-testid="button-back-to-chart"
          >
            Back to Chart
          </Button>
          <Button
            onClick={() => setLocation("/agents")}
            data-testid="button-view-leaderboard"
          >
            View Leaderboard
          </Button>
        </div>
      )}
    </div>
  );
}
