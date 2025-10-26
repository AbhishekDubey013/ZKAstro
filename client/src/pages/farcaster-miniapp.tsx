import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Star, Calendar, Clock, MapPin, LogOut } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

interface BirthData {
  dob: string;
  tob: string;
  location: string;
  lat: number;
  lon: number;
}

interface DailyPrediction {
  date: string;
  prediction: string;
  luckyNumber: number;
  luckyColor: string;
  mood: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function FarcasterMiniapp() {
  const [hasData, setHasData] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<DailyPrediction | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const { toast } = useToast();
  
  // Privy authentication
  const { user, authenticated, login, logout, ready, getAccessToken } = usePrivy();
  
  // Debug logging
  console.log('🔍 Privy State:', { ready, authenticated, user: user?.wallet?.address });

  const [birthData, setBirthData] = useState<BirthData>({
    dob: "",
    tob: "",
    location: "",
    lat: 0,
    lon: 0
  });

  useEffect(() => {
    if (ready && authenticated) {
      checkUserData();
    }
  }, [ready, authenticated]);

  // Helper to get auth headers with Privy token
  const getAuthHeaders = async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (authenticated) {
      try {
        const token = await getAccessToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get access token:", error);
      }
    }

    return headers;
  };

  const checkUserData = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/farcaster/check-data", {
        credentials: "include",
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasData(data.hasData);
      }
    } catch (error) {
      console.error("Error checking user data:", error);
    }
  };

  const handleSubmitBirthData = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/farcaster/save-birth-data", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(birthData)
      });

      if (response.ok) {
        setHasData(true);
        setShowForm(false);
        toast({
          title: "Birth data saved!",
          description: "Now let's get your daily prediction"
        });
        await getDailyPrediction();
      } else {
        throw new Error("Failed to save data");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save birth data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDailyPrediction = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/farcaster/daily-prediction", {
        credentials: "include",
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      } else {
        throw new Error("Failed to get prediction");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get prediction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (ratingValue: number) => {
    setRating(ratingValue);
    
    try {
      const headers = await getAuthHeaders();
      await fetch("/api/farcaster/rate-prediction", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ 
          rating: ratingValue,
          date: prediction?.date 
        })
      });

      toast({
        title: "Thanks for rating!",
        description: `You rated today's prediction ${ratingValue}/5`
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;

    const question = userQuestion.trim();
    setUserQuestion("");
    setChatLoading(true);

    // Add user message immediately
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/farcaster/ask-question", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          question,
          date: prediction?.date
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        throw new Error("Failed to get answer");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get answer. Please try again.",
        variant: "destructive"
      });
      // Remove the user message if failed
      setChatMessages(prev => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-spin text-violet-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="border-violet-200 dark:border-violet-800 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Cosmic Predictions
              </CardTitle>
              <CardDescription className="text-base">
                Get personalized daily astrology predictions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ✨ Personalized daily predictions
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  🔮 AI-powered astrological insights
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  🌟 Rate and improve predictions
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  🔐 Privacy-preserving ZK proofs
                </p>
              </div>
              <Button 
                onClick={login}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                Sign in with Wallet
              </Button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Connect your wallet or Farcaster account
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasData && !showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="border-violet-200 dark:border-violet-800 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Welcome {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}!
              </CardTitle>
              <CardDescription className="text-base">
                Let's set up your birth chart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  📅 Enter your birth details
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  🔐 Stored securely with ZK proofs
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  🌟 Get personalized predictions
                </p>
              </div>
              <Button 
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                Enter Birth Details
              </Button>
              <Button 
                onClick={logout}
                variant="outline"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card className="border-violet-200 dark:border-violet-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Your Birth Details</CardTitle>
              <CardDescription>
                This information stays private and is used only for your predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitBirthData} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dob" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    value={birthData.dob}
                    onChange={(e) => setBirthData({...birthData, dob: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tob" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time of Birth
                  </Label>
                  <Input
                    id="tob"
                    type="time"
                    required
                    value={birthData.tob}
                    onChange={(e) => setBirthData({...birthData, tob: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Place of Birth
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="e.g., New York, USA"
                    required
                    value={birthData.location}
                    onChange={(e) => setBirthData({...birthData, location: e.target.value})}
                  />
                  <p className="text-xs text-gray-500">
                    We'll use this to calculate your exact planetary positions
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save & Get Prediction"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasData && !prediction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="border-violet-200 dark:border-violet-800 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Welcome Back!</CardTitle>
              <CardDescription>
                Ready to discover what the stars have in store for you today?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={getDailyPrediction}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? "Loading..." : "Know Your Day"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (prediction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
        <div className="max-w-md mx-auto pt-8 space-y-4">
          <Card className="border-violet-200 dark:border-violet-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                Today's Prediction
              </CardTitle>
              <CardDescription>
                {new Date(prediction.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {prediction.prediction}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-violet-100 dark:border-violet-900">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lucky Number</p>
                  <p className="text-2xl font-bold text-violet-600">{prediction.luckyNumber}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-violet-100 dark:border-violet-900">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lucky Color</p>
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: prediction.luckyColor }}
                    />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-violet-100 dark:border-violet-900">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mood</p>
                  <p className="text-lg font-semibold text-violet-600">{prediction.mood}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-center text-gray-700 dark:text-gray-300">
                  How accurate was this prediction?
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => submitRating(value)}
                      disabled={rating !== null}
                      className={`transition-all ${
                        rating === value
                          ? "scale-110"
                          : rating !== null
                          ? "opacity-40"
                          : "hover:scale-110"
                      }`}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating !== null && value <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating !== null && (
                  <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Thanks for your feedback! 🙏
                  </p>
                )}
              </div>

              {/* Chat Section */}
              <div className="space-y-3 border-t border-violet-100 dark:border-violet-900 pt-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  Ask something specific about your day
                </p>
                
                {/* Chat Messages */}
                {chatMessages.length > 0 && (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-violet-100 dark:bg-violet-900/30 ml-8'
                            : 'bg-purple-50 dark:bg-purple-950/30 mr-8'
                        }`}
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="e.g., Should I have that important conversation today? What about my career?"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAskQuestion();
                      }
                    }}
                    className="resize-none"
                    rows={2}
                    disabled={chatLoading}
                  />
                  <Button
                    onClick={handleAskQuestion}
                    disabled={!userQuestion.trim() || chatLoading}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {chatLoading ? "..." : "Ask"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get personalized insights based on your chart and today's transits
                </p>
              </div>

              <Button 
                onClick={() => {
                  setPrediction(null);
                  setRating(null);
                  setChatMessages([]);
                  setUserQuestion("");
                }}
                variant="outline"
                className="w-full"
              >
                Get Another Prediction
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}

