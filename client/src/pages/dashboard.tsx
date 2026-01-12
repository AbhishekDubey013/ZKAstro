import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogOut, Star, User, ArrowRight, Sparkles, TrendingUp, Calendar, Clock, Send, CheckCircle2, HelpCircle, Wallet, Coins, Lightbulb } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useMetaMaskContext } from "@/components/metamask-provider";
import type { Chart } from "@shared/schema";
import ChartCreationForm from "@/components/chart-creation-form";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { WalletDisplay } from "@/components/wallet-display";
import { usePayment } from "@/hooks/usePayment";
import { useX402 } from "@/hooks/useX402";
import { useToast } from "@/hooks/use-toast";
import { RotatingPlaceholder } from "@/components/rotating-placeholder";

interface PredictionAnswer {
  id: string;
  agentId: string;
  summary: string;
  dayScore: number;
  agent: {
    handle: string;
    reputation: number;
  } | null;
}

interface UserPrediction {
  id: string;
  question: string;
  targetDate: string;
  status: string;
  selectedAnswerId: string | null;
  correctAnswerId: string | null;
  createdAt: string;
  answers: PredictionAnswer[];
}

// Prediction card component for the dashboard
function PredictionCard({ 
  prediction, 
  onViewDetails,
  walletAddress,
}: { 
  prediction: UserPrediction; 
  onViewDetails: () => void;
  walletAddress: string | null;
}) {
  const isSettled = prediction.status === "SETTLED";
  const isAnswered = prediction.status === "ANSWERED";
  const isPending = prediction.status === "OPEN";
  
  const correctAnswer = prediction.answers.find(a => a.id === prediction.correctAnswerId);
  const selectedAnswer = prediction.answers.find(a => a.id === prediction.selectedAnswerId);
  
  const handleMarkCorrect = async (answerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/request/${prediction.id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answerId, walletAddress }), // Include wallet for points
      });
      
      if (response.ok) {
        // Refresh predictions
        queryClient.invalidateQueries({ queryKey: ["/api/user/predictions", walletAddress] });
        queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      }
    } catch (err) {
      console.error("Error marking prediction correct:", err);
    }
  };
  
  return (
    <Card 
      className="relative cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-200 h-full"
      onClick={onViewDetails}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Final vote indicator - top right */}
        {isSettled && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">
              🔒 Final
            </span>
          </div>
        )}
        
        {/* Question and metadata */}
        <div className="mb-4">
          <p className="font-medium text-sm line-clamp-2 mb-2 pr-16">"{prediction.question}"</p>
          <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
              <Calendar className="h-3 w-3" />
              {new Date(prediction.targetDate).toLocaleDateString()}
            </span>
            <Badge 
              variant={isSettled ? "default" : isAnswered ? "secondary" : "outline"}
              className="text-xs"
            >
              {isSettled ? "Resolved" : isAnswered ? "Vote Now" : "Pending"}
            </Badge>
          </div>
        </div>
        
        {/* Agent scores - centered grid */}
        <div className="grid grid-cols-2 gap-3">
          {prediction.answers.map((answer) => {
            const isCorrect = answer.id === prediction.correctAnswerId;
            const isLoser = isSettled && !isCorrect;
            
            return (
              <div 
                key={answer.id}
                className={`text-center p-3 rounded-xl border transition-all ${
                  isCorrect 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-600 dark:text-green-400 shadow-md' 
                    : isLoser
                    ? 'bg-red-500/5 border-red-500/20 text-red-600/50 dark:text-red-400/50'
                    : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                }`}
              >
                <p className="text-xs font-semibold mb-1">{answer.agent?.handle || 'Agent'}</p>
                <p className="text-2xl font-bold">{Math.round(answer.dayScore)}</p>
                <p className="text-[10px] text-muted-foreground">score</p>
                {isAnswered && !isSettled && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 text-xs mt-2 hover:bg-primary/10 w-full"
                    onClick={(e) => handleMarkCorrect(answer.id, e)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Vote
                  </Button>
                )}
                {isCorrect && (
                  <span className="text-xs flex items-center gap-1 justify-center mt-2 font-semibold">
                    <CheckCircle2 className="h-3 w-3" />
                    Winner 🏆
                  </span>
                )}
                {isLoser && (
                  <span className="text-xs text-red-500/60 mt-2 block">-1 rep</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, walletAddress } = useAuth();
  const { account, disconnect, balance } = useMetaMaskContext();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const { toast } = useToast();
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
  
  // Payment hooks
  const { 
    isWalletReady, 
    PAYMENT_PER_AGENT,
    PAYMENT_PER_PREDICTION,
  } = usePayment();
  
  // X402 hook for automatic payment handling
  const { 
    x402Fetch, 
    isProcessing: isX402Processing,
    currentPayment,
    error: x402Error,
  } = useX402();

  const { data: charts, isLoading: chartsLoading } = useQuery<Chart[]>({
    queryKey: ["/api/charts", walletAddress],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const baseUrl = walletAddress ? `/api/charts?walletAddress=${encodeURIComponent(walletAddress)}` : `/api/charts`;
      const url = API_BASE_URL ? `${API_BASE_URL}${baseUrl}` : baseUrl;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch charts");
      return response.json();
    },
    enabled: !!user && !!walletAddress,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Fetch user predictions
  const { data: predictions, isLoading: predictionsLoading } = useQuery<UserPrediction[]>({
    queryKey: ["/api/user/predictions", walletAddress],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const baseUrl = walletAddress ? `/api/user/predictions?walletAddress=${encodeURIComponent(walletAddress)}` : `/api/user/predictions`;
      const url = API_BASE_URL ? `${API_BASE_URL}${baseUrl}` : baseUrl;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch predictions");
      return response.json();
    },
    enabled: !!user && !!walletAddress,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleLogout = () => {
    if (isAuthenticated) {
      disconnect();
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

  // Create prediction with X402 payment
  const handleAskPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charts || charts.length === 0 || !question.trim()) return;
    
    setIsSubmitting(true);
    setPaymentStatus("Requesting payment...");
    const mostRecentChart = charts[0];
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const paidUrl = `${API_BASE_URL}/api/request/paid`;
      
      const response = await x402Fetch(paidUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartId: mostRecentChart.id,
          question: question.trim(),
          targetDate: targetDate,
          walletAddress: walletAddress,
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
        toast({
          title: "🎉 Prediction Created",
          description: "Payment confirmed!",
        });
        setQuestion("");
        queryClient.invalidateQueries({ queryKey: ["/api/user/predictions", walletAddress] });
        setLocation(`/request/${data.requestId}`);
      }
    } catch (err: any) {
      console.error("Error creating prediction:", err);
      toast({
        title: "Payment Error",
        description: (
          <div className="space-y-2">
            <p>{err.message || "Failed to create prediction"}</p>
            <p className="text-xs text-muted-foreground">
              Try: MetaMask → Settings → Advanced → Reset Account
            </p>
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setPaymentStatus("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[80px]" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-border/50">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
                {user?.firstName && user?.lastName
                  ? `Welcome, ${user.firstName}`
                  : user?.email?.split('@')[0] || "Welcome back"}
              </h1>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                {/* User Points Badge - Always visible */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {user?.reputation || 0}
                  </span>
                  <span className="text-xs text-amber-600/70 dark:text-amber-400/70">pts</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>

        {chartsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground mt-4">Loading your charts...</p>
          </div>
        ) : hasCharts ? (
          <div className="stagger space-y-8">
            {/* Wallet Display */}
            {isWalletReady && (
              <div className="animate-fade-up">
                <WalletDisplay />
              </div>
            )}
            
            {/* Ask a Prediction Card - MAIN ACTION AREA */}
            <Card className="animate-fade-up relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-card via-primary/5 to-violet-500/10 shadow-2xl shadow-primary/20">
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 animate-pulse" />
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-full blur-3xl -mr-40 -mt-40 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent/20 to-pink-500/20 rounded-full blur-3xl -ml-32 -mb-32" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-primary/5 rounded-full blur-2xl" />
              
              {/* Corner accent */}
              <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden">
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-gradient-to-br from-primary to-violet-500 rotate-45 opacity-80" />
              </div>
              
              <CardHeader className="relative pb-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-semibold text-primary">✨ Ask the Stars</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">AI Ready</span>
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-serif bg-gradient-to-r from-foreground via-primary to-violet-500 bg-clip-text text-transparent">
                  What would you like to know?
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl">
                  Ask a question and receive <span className="text-primary font-medium">competing predictions</span> from our AI agents. 
                  Your question shapes their cosmic interpretation.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-4 pb-6">
                <form onSubmit={handleAskPrediction} className="space-y-5">
                  <div className="space-y-5">
                    {/* FLASHY Question Input - Main Action */}
                    <div className="relative group">
                      {/* Animated gradient border */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500 rounded-2xl opacity-75 group-focus-within:opacity-100 blur-md transition-all duration-500 animate-pulse" />
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-violet-500 to-pink-500 rounded-xl opacity-50 group-focus-within:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative bg-gradient-to-br from-background via-background to-primary/5 rounded-xl border-2 border-primary/30 group-focus-within:border-primary shadow-xl group-focus-within:shadow-2xl group-focus-within:shadow-primary/30 transition-all duration-300">
                        {/* Sparkle icon with glow */}
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
                          <div className="relative">
                            <Sparkles className="h-6 w-6 text-primary group-focus-within:text-primary transition-colors duration-300 animate-pulse" />
                            <div className="absolute inset-0 bg-primary/50 blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                        
                        <Input
                          type="text"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          className="h-16 sm:h-20 pl-14 pr-6 text-base sm:text-lg bg-transparent border-0 focus:ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 font-medium"
                          maxLength={500}
                          data-testid="input-question"
                          placeholder="Ask about your day, decisions, or opportunities..."
                        />
                        
                        {/* Floating label when typing */}
                        {question && (
                          <div className="absolute -top-3 left-4 px-2 bg-background text-xs font-semibold text-primary">
                            Your Question
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Example Questions - Colorful & Interactive */}
                    {!question && (
                      <div className="flex flex-col gap-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 via-violet-500/5 to-pink-500/5 border border-primary/20">
                        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                            <Lightbulb className="h-4 w-4 text-white" />
                          </div>
                          <span>Not sure what to ask? Try one of these:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { q: exampleQuestions[0], color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-500/60', text: 'text-violet-600 dark:text-violet-400' },
                            { q: exampleQuestions[1], color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 hover:border-pink-500/60', text: 'text-pink-600 dark:text-pink-400' },
                            { q: exampleQuestions[2], color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:border-cyan-500/60', text: 'text-cyan-600 dark:text-cyan-400' },
                          ].map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setQuestion(item.q)}
                              className={`text-xs px-4 py-3 rounded-lg bg-gradient-to-r ${item.color} border ${item.text} font-medium transition-all duration-200 cursor-pointer text-left hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]`}
                              title={item.q}
                            >
                              <span className="line-clamp-2">{item.q}</span>
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
                            data-testid="input-date"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pl-12 sm:pl-0">
                        When do you want the prediction for?
                      </div>
                    </div>
                  </div>
                  {/* FLASHY Submit Button - Call to Action */}
                  <div className="flex flex-col gap-3 pt-4">
                    <div className="relative group">
                      {/* Button glow effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500 rounded-xl opacity-70 group-hover:opacity-100 blur-lg transition-all duration-300" />
                      
                      <Button
                        type="submit"
                        size="lg"
                        disabled={!question.trim() || isSubmitting}
                        className="relative w-full h-14 sm:h-16 px-8 text-base sm:text-lg font-bold shadow-2xl transition-all duration-300 bg-gradient-to-r from-primary via-violet-600 to-primary hover:from-violet-600 hover:via-primary hover:to-violet-600 group overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="button-ask-prediction"
                        onClick={(e) => handleAskPrediction(e)}
                      >
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        
                        {/* Star particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute top-2 left-[20%] w-1 h-1 bg-white rounded-full animate-ping opacity-60" style={{ animationDelay: '0s' }} />
                          <div className="absolute bottom-3 right-[30%] w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }} />
                          <div className="absolute top-3 right-[15%] w-1 h-1 bg-white rounded-full animate-ping opacity-50" style={{ animationDelay: '1s' }} />
                        </div>
                        
                        <span className="relative z-10 flex items-center justify-center w-full">
                          {isSubmitting ? (
                            <>
                              <div className="h-5 w-5 sm:h-6 sm:w-6 mr-3 rounded-full border-3 border-white/30 border-t-white animate-spin" />
                              <span className="text-sm sm:text-base">{paymentStatus || "Processing..."}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
                              <span className="mr-2">Get Cosmic Prediction</span>
                              <span className="px-3 py-1 rounded-full bg-white/20 text-xs sm:text-sm font-semibold border border-white/30">
                                {PAYMENT_PER_PREDICTION} ETH
                              </span>
                              <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-2" />
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                    
                    {/* Payment info badge */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Coins className="h-3.5 w-3.5 text-amber-500" />
                      <span>x402 micropayment • Direct to AI agents • Instant</span>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Card 
                className="animate-fade-up group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-300" 
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{ animationDelay: '0.1s' }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <User className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Update Birth Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Refine your natal chart with corrected information
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="animate-fade-up group cursor-pointer hover:border-accent/30 hover:shadow-lg transition-all duration-300" 
                onClick={() => setLocation("/agents")}
                style={{ animationDelay: '0.15s' }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <TrendingUp className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Agent Leaderboard</h3>
                        <p className="text-sm text-muted-foreground">
                          Track which AI makes the best predictions
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Predictions Section */}
            {predictions && predictions.length > 0 && (
              <div className="animate-fade-up space-y-5" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xl font-serif font-semibold">My Predictions</h2>
                  <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-muted/50">{predictions.length} total</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {predictions.slice(0, 6).map((prediction) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      onViewDetails={() => setLocation(`/request/${prediction.id}`)}
                      walletAddress={walletAddress}
                    />
                  ))}
                </div>
                {predictions.length > 6 && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      className="px-8"
                      onClick={() => setLocation("/predictions")}
                    >
                      View All {predictions.length} Predictions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Chart stats */}
            {charts && charts.length > 0 && (
              <Card className="animate-fade-up bg-muted/30 border-border/50" style={{ animationDelay: '0.25s' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Chart created {new Date(charts[0].createdAt).toLocaleDateString()}</span>
                    </div>
                    {charts[0].onChainTxHash && (
                      <div className="flex items-center gap-2 text-accent">
                        <Sparkles className="h-4 w-4" />
                        <span>Verified on-chain</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form expansion */}
            {showCreateForm && (
              <Card className="animate-scale-in shadow-lg">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Update Your Chart</CardTitle>
                  <CardDescription>
                    Enter your birth details to generate a new natal chart.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartCreationForm />
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* New user flow */
          <div className="stagger">
            <div className="animate-fade-up mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8 bg-primary" />
                <span className="text-xs font-medium tracking-widest uppercase text-primary">Get Started</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-3">
                Create your natal chart
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl">
                Enter your birth information to generate a Western Equal-house chart. 
                This forms the basis for all your personalized predictions.
              </p>
            </div>

            <Card className="animate-fade-up shadow-lg" style={{ animationDelay: '0.1s' }}>
              <CardContent className="pt-6">
                <ChartCreationForm />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
