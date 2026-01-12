import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Calendar, Sparkles, Send, ArrowRight, HelpCircle, Coins, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useX402 } from "@/hooks/useX402";
import { useMetaMaskContext } from "@/components/metamask-provider";
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
  // Handle negative values by adding 360 degrees
  let totalDeg = centiDeg / 100;
  while (totalDeg < 0) totalDeg += 360;
  totalDeg = totalDeg % 360;
  
  const signIndex = Math.floor(totalDeg / 30);
  const degree = totalDeg % 30;
  return {
    sign: zodiacSigns[signIndex % 12],
    degree: Math.floor(degree * 100) / 100,
  };
}

interface ChartParams {
  planets: {
    sun: number;
    moon: number;
    mercury: number;
    venus: number;
    mars: number;
    jupiter: number;
    saturn: number;
  };
  asc: number;
  mc: number;
  zodiac: string;
  houseSystem: string;
}

export default function ChartDetail() {
  const [, routeParams] = useRoute("/chart/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const chartId = routeParams?.id;
  const { account } = useMetaMaskContext();
  const { x402Fetch, isProcessing } = useX402();

  const [question, setQuestion] = useState("");
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  
  // Example questions that rotate
  const exampleQuestions = [
    "Will my job interview go well tomorrow?",
    "Should I invest in cryptocurrency this month?",
    "Will my relationship improve next week?",
    "Is this a good time to start a new business?",
    "Should I move to a new city this year?",
    "Will my health improve in the coming months?",
    "Is it the right time to ask for a promotion?",
    "Should I take that vacation next month?",
    "Will my creative project be successful?",
    "Is this a good time to make a major purchase?",
  ];
  
  // Rotate placeholder every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % exampleQuestions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { data: chart, isLoading } = useQuery<Chart>({
    queryKey: ["/api/chart", chartId],
    enabled: !!chartId,
  });

  // Parse the chart params from JSON
  const chartParams = useMemo(() => {
    if (!chart?.paramsJson) return null;
    try {
      if (typeof chart.paramsJson === 'string') {
        return JSON.parse(chart.paramsJson) as ChartParams;
      }
      return chart.paramsJson as ChartParams;
    } catch {
      return null;
    }
  }, [chart]);

  // Calculate positions from params
  const positions = useMemo(() => {
    if (!chartParams?.planets) return null;
    
    return {
      sun: centiDegToSign(chartParams.planets.sun),
      moon: centiDegToSign(chartParams.planets.moon),
      mercury: centiDegToSign(chartParams.planets.mercury),
      venus: centiDegToSign(chartParams.planets.venus),
      mars: centiDegToSign(chartParams.planets.mars),
      jupiter: centiDegToSign(chartParams.planets.jupiter),
      saturn: centiDegToSign(chartParams.planets.saturn),
      ascendant: centiDegToSign(chartParams.asc),
    };
  }, [chartParams]);

  // Create prediction with X402 payment
  const handleAskPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chartId || !question.trim()) return;
    
    setIsSubmitting(true);
    setPaymentStatus("Requesting payment...");
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const paidUrl = `${API_BASE_URL}/api/request/paid`;
      
      const response = await x402Fetch(paidUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        chartId,
          question: question.trim(),
        targetDate,
          walletAddress: account,
        }),
        onPaymentRequired: (requirement) => {
          setPaymentStatus(`Payment: ${requirement.amount} ETH`);
          toast({
            title: "💰 Payment Required",
            description: `Confirm ${requirement.amount} ETH in MetaMask...`,
          });
        },
        onPaymentSent: () => {
          setPaymentStatus("Verifying...");
          toast({
            title: "✅ Payment Sent!",
            description: "Waiting for confirmation...",
          });
        },
        onPaymentVerified: () => {
      toast({
            title: "✅ Payment Verified!",
            description: "X402 payment confirmed",
          });
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.requestId) {
        // Log X402 payment details for verification
        if (data.x402) {
          console.log('✅ X402 Payment Verified:', {
            paymentId: data.x402.paymentId,
            txHashes: data.x402.txHashes,
            verified: data.x402.verified || true,
          });
        }
        
        toast({
          title: "🎉 Prediction Created",
          description: data.x402 ? (
            <div className="space-y-1 text-sm">
              <p>✅ X402 Payment Verified</p>
              <p className="text-xs opacity-75">TX: {data.x402.txHashes?.[0]?.slice(0, 20)}...</p>
            </div>
          ) : "Payment confirmed!",
        });
        setQuestion("");
        queryClient.invalidateQueries({ queryKey: ["/api/user/predictions", account] });
      setLocation(`/request/${data.requestId}`);
      }
    } catch (err: any) {
      console.error("Error creating prediction:", err);
      toast({
        title: "Prediction Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setPaymentStatus("");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chart) {
    return (
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">Chart not found</p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => setLocation("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Chart Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Your Natal Chart</CardTitle>
            <CardDescription>
              Created: {new Date(chart.createdAt).toLocaleDateString()} • {chartParams?.zodiac || 'Tropical'} zodiac
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positions ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Sun & Moon */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                    <span className="text-2xl">{planetSymbols.sun}</span>
                    <div>
                      <p className="font-medium">{positions.sun.sign}</p>
                      <p className="text-xs text-muted-foreground">{positions.sun.degree.toFixed(1)}°</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                    <span className="text-2xl">{planetSymbols.moon}</span>
                    <div>
                      <p className="font-medium">{positions.moon.sign}</p>
                      <p className="text-xs text-muted-foreground">{positions.moon.degree.toFixed(1)}°</p>
                    </div>
                  </div>
                </div>
                
                {/* Other Planets */}
                <div className="space-y-2">
                  {['mercury', 'venus', 'mars', 'jupiter', 'saturn'].map((planet) => {
                    const pos = positions[planet as keyof typeof positions];
                    if (!pos || typeof pos !== 'object' || !('sign' in pos)) return null;
                    return (
                      <div key={planet} className="flex items-center gap-2 text-sm">
                        <span>{planetSymbols[planet]}</span>
                        <span className="text-muted-foreground">{planetNames[planet]}:</span>
                        <span>{pos.sign} {pos.degree.toFixed(0)}°</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Chart data processing...</p>
            )}
          </CardContent>
        </Card>

        {/* Ascendant Card */}
        {positions?.ascendant && (
          <Card className="border-accent/20">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Ascendant (Rising Sign)
              </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="text-center p-6 rounded-lg bg-accent/5">
                <p className="text-3xl font-serif mb-2">{positions.ascendant.sign}</p>
                <p className="text-muted-foreground">{positions.ascendant.degree.toFixed(2)}°</p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Ask a Question Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Ask the Stars</span>
            </div>
          </div>
          <CardTitle className="text-xl font-serif">
            What would you like to know?
          </CardTitle>
          <CardDescription>
            Ask a question and receive competing predictions from AI agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAskPrediction} className="space-y-5">
            <div className="space-y-4">
              {/* Enhanced Question Input - ULTRA Flashy & Attention-Grabbing */}
              <div className="relative group">
                {/* Intense animated gradient border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 via-pink-500 to-primary rounded-lg opacity-40 group-hover:opacity-70 group-focus-within:opacity-90 blur-md transition-opacity duration-500 animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-primary rounded-lg opacity-30 group-hover:opacity-50 group-focus-within:opacity-70 blur-sm transition-opacity duration-500" style={{ animation: 'spin 3s linear infinite' }} />
                
                {/* Intense glowing background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/15 to-pink-500/20 rounded-lg opacity-70 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/10 to-transparent rounded-lg opacity-50 group-focus-within:opacity-100 animate-pulse" />
                
                <div className="relative bg-background/95 backdrop-blur-md rounded-lg border-2 border-primary/30 group-focus-within:border-primary group-hover:border-primary/60 transition-all duration-500 shadow-lg group-focus-within:shadow-2xl group-focus-within:shadow-primary/20">
                  {/* Ultra animated sparkle icon */}
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="relative">
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute inset-0 bg-primary/50 rounded-full blur-lg animate-ping" style={{ animationDuration: '2s' }} />
                      <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-md animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                    </div>
                  </div>
                  
                  <Input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="relative h-12 sm:h-14 pl-11 sm:pl-14 pr-12 sm:pr-16 text-sm sm:text-base bg-transparent border-0 focus:ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 placeholder:transition-all placeholder:duration-500 group-focus-within:placeholder:text-primary/70 font-medium"
                    maxLength={500}
                    placeholder={exampleQuestions[currentPlaceholder]}
                  />
                  
                  {/* Ultra animated example indicator */}
                  {!question && (
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2 z-10">
                      <div className="relative">
                        <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary drop-shadow-lg animate-pulse" style={{ animationDuration: '1s' }} />
                        <div className="absolute inset-0 bg-primary/50 rounded-full blur-md animate-ping" style={{ animationDuration: '1.5s' }} />
                      </div>
                      <span className="hidden sm:inline text-xs font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse drop-shadow-sm">
                        Example question
                      </span>
                    </div>
                  )}
                  
                  {/* Intense shimmer effect on focus */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 via-primary/20 to-transparent -translate-x-full group-focus-within:translate-x-full transition-transform duration-1000 group-focus-within:duration-3000 opacity-0 group-focus-within:opacity-100 rounded-lg" />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-purple-500/20 to-transparent translate-x-full group-focus-within:translate-x-0 transition-transform duration-1500 group-focus-within:duration-2500 opacity-0 group-focus-within:opacity-100 rounded-lg" />
                </div>
              </div>
              
              {/* Example Questions Below Input */}
              {!question && (
                <div className="flex flex-col gap-3 p-4 rounded-lg bg-gradient-to-br from-primary/10 via-purple-500/8 to-pink-500/10 border border-primary/30 shadow-lg">
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    <div className="relative">
                      <Lightbulb className="h-4 w-4 text-primary animate-pulse" style={{ animationDuration: '1s' }} />
                      <div className="absolute inset-0 bg-primary/40 rounded-full blur-sm animate-ping" style={{ animationDuration: '1.5s' }} />
                    </div>
                    <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      Try these examples:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {exampleQuestions.slice(0, 3).map((example, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setQuestion(example)}
                        className="group relative text-xs px-4 py-3 sm:py-2.5 rounded-lg sm:rounded-full bg-gradient-to-r from-primary/15 via-purple-500/10 to-pink-500/15 hover:from-primary/25 hover:via-purple-500/20 hover:to-pink-500/25 border-2 border-primary/40 hover:border-primary/70 text-foreground/90 hover:text-foreground transition-all duration-300 cursor-pointer text-left sm:text-center truncate sm:truncate-none overflow-hidden active:scale-95 shadow-md hover:shadow-lg hover:shadow-primary/20"
                        title={example}
                      >
                        {/* Intense shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative z-10 font-semibold">
                          {example.split('?')[0]}?
                        </span>
                        {/* Intense glow effect */}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 rounded-lg sm:rounded-full transition-all duration-300 blur-lg" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Character counter with progress */}
              {question && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Characters</span>
                    <span className={`font-medium ${question.length > 450 ? 'text-orange-500' : question.length > 400 ? 'text-yellow-500' : 'text-primary'}`}>
                      {question.length}/500
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        question.length > 450 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                        question.length > 400 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-primary to-purple-500'
                      }`}
                      style={{ width: `${Math.min((question.length / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Date Picker with Enhanced UI - Mobile Optimized */}
              <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Target Date
                    </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
                      className="h-10 w-full text-sm sm:text-base bg-background/80 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pl-12 sm:pl-0">
                  When do you want the prediction for?
                </div>
              </div>
          </div>

            {/* Submit Button with Enhanced UI - Mobile Optimized */}
            <div className="flex flex-col gap-3 pt-2">
          <Button
                type="submit"
                size="lg"
                disabled={!question.trim() || isSubmitting || isProcessing}
                className="w-full h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 group relative overflow-hidden active:scale-[0.98]"
                onClick={(e) => handleAskPrediction(e)}
              >
                <span className="relative z-10 flex items-center justify-center w-full">
                  {isSubmitting || isProcessing ? (
                    <>
                      <div className="h-4 w-4 sm:h-5 sm:w-5 mr-2 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span className="text-xs sm:text-sm">{paymentStatus || "Processing..."}</span>
                    </>
            ) : (
              <>
                      <Coins className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Get Prediction</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-white/20 text-[10px] sm:text-xs font-medium">
                        0.00005 ETH
                      </span>
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
                {!isSubmitting && !isProcessing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            )}
          </Button>
              
              {/* Quick Example Questions - Flashy & Interactive */}
              {!question && (
                <div className="flex flex-col gap-3 p-4 rounded-lg bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/20">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <div className="relative">
                      <Lightbulb className="h-4 w-4 text-primary animate-pulse" />
                      <div className="absolute inset-0 bg-primary/30 rounded-full blur-sm animate-ping" />
                    </div>
                    <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                      Try these examples:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {exampleQuestions.slice(0, 3).map((example, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setQuestion(example)}
                        className="group relative text-xs px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border border-primary/30 hover:border-primary/50 text-foreground/80 hover:text-foreground transition-all duration-300 cursor-pointer text-left sm:text-center truncate sm:truncate-none overflow-hidden active:scale-95"
                        title={example}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative z-10 font-medium">
                          {example.split('?')[0]}?
                        </span>
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 rounded-lg sm:rounded-full transition-all duration-300 blur-sm" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
