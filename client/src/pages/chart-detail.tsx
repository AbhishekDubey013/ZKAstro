import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chart } from "@shared/schema";

// Zodiac sign helpers
const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const planetSymbols: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
};

const planetNames: Record<string, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
};

function centiDegToSign(centiDeg: number): { sign: string; degree: number } {
  const totalDeg = centiDeg / 100;
  const signIndex = Math.floor(totalDeg / 30);
  const degree = totalDeg % 30;
  return {
    sign: zodiacSigns[signIndex % 12],
    degree: Math.floor(degree * 100) / 100,
  };
}

export default function ChartDetail() {
  const [, params] = useRoute("/chart/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const chartId = params?.id;

  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const { data: chart, isLoading } = useQuery<Chart>({
    queryKey: ["/api/chart", chartId],
    enabled: !!chartId,
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/request", {
        chartId,
        question: "How will my day go?",
        targetDate,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Prediction requested",
        description: "Your agents are analyzing the stars...",
      });
      setLocation(`/request/${data.requestId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl px-4 md:px-6 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chart) {
    return (
      <div className="container max-w-4xl px-4 md:px-6 py-8 text-center">
        <p className="text-muted-foreground">Chart not found</p>
      </div>
    );
  }

  const params = chart.paramsJson as any;

  return (
    <div className="container max-w-4xl px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Your Natal Chart</h1>
        <p className="text-muted-foreground">
          Western Equal House System • {new Date(chart.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Planetary Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Planetary Positions</CardTitle>
          <CardDescription>Your natal planetary placements in tropical zodiac</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(params.planets).map(([planet, centiDeg]: [string, any]) => {
            const { sign, degree } = centiDegToSign(centiDeg);
            const isRetro = params.retro?.[planet as keyof typeof params.retro];
            
            return (
              <div
                key={planet}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                data-testid={`planet-${planet}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-label={planetNames[planet]}>
                    {planetSymbols[planet]}
                  </span>
                  <span className="font-medium">{planetNames[planet]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">
                    {degree.toFixed(2)}°
                  </span>
                  <span className="font-medium">{sign}</span>
                  {isRetro && (
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                      ℞
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Chart Points */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ascendant (Rising)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-medium">ASC</span>
              <div className="text-right">
                <div className="font-mono text-sm text-muted-foreground">
                  {(params.asc / 100).toFixed(2)}°
                </div>
                <div className="font-medium">{centiDegToSign(params.asc).sign}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Midheaven</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-medium">MC</span>
              <div className="text-right">
                <div className="font-mono text-sm text-muted-foreground">
                  {(params.mc / 100).toFixed(2)}°
                </div>
                <div className="font-medium">{centiDegToSign(params.mc).sign}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Prediction Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Request Daily Prediction
          </CardTitle>
          <CardDescription>
            Get AI-powered insights from competing astrology agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Target Date
            </Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              data-testid="input-target-date"
            />
            <p className="text-xs text-muted-foreground">
              Select the day you want predictions for (default: today)
            </p>
          </div>

          <Button
            className="w-full"
            onClick={() => createRequestMutation.mutate()}
            disabled={createRequestMutation.isPending}
            data-testid="button-request-prediction"
          >
            {createRequestMutation.isPending ? (
              <>Analyzing Transits...</>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Request Prediction
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
