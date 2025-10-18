import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Sparkles, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login, authenticated, ready } = usePrivy();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (ready && authenticated) {
      setLocation("/");
    }
  }, [authenticated, ready, setLocation]);

  const handlePrivyLogin = () => {
    login();
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-violet-50 via-blue-50 to-teal-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-teal-950/20 relative overflow-hidden">
      {/* Vibrant Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-violet-400 to-purple-300 dark:from-violet-600 dark:to-purple-500 opacity-30 dark:opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-gradient-to-br from-teal-400 to-cyan-300 dark:from-teal-600 dark:to-cyan-500 opacity-30 dark:opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-center space-y-6 mb-10">
          <div className="flex justify-center">
            <Sparkles className="h-16 w-16 text-violet-600 dark:text-violet-400 animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-600 dark:from-violet-400 dark:via-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
            Connect to Continue
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose your preferred method to access your cosmic predictions
          </p>
        </div>

        {/* Auth Options */}
        <div className="flex justify-center max-w-md mx-auto">
          {/* Privy Wallet */}
          <Card className="w-full border-violet-200 dark:border-violet-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-50 dark:from-violet-900/30 dark:to-purple-950/30">
                  <Wallet className="h-12 w-12 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                Wallet Connect
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Connect with any Web3 wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handlePrivyLogin}
                disabled={!ready}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold"
                data-testid="button-privy-login"
              >
                <Wallet className="h-5 w-5 mr-2" />
                {!ready ? "Loading..." : "Connect Wallet"}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-3">
                Secure Web3 authentication via Privy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Note */}
        <div className="text-center mt-10">
          <p className="text-sm text-gray-500 dark:text-gray-500 max-w-2xl mx-auto">
            🔐 Your birth data is protected with zero-knowledge proofs. We never store your raw birth information.
          </p>
        </div>
      </div>
    </div>
  );
}
