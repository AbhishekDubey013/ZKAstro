import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowLeft, Shield, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login, authenticated, ready } = usePrivy();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (ready && authenticated) {
      setLocation("/dashboard");
    }
  }, [authenticated, ready, setLocation]);

  const handlePrivyLogin = () => {
    login();
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-glow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 -ml-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center space-y-4 mb-10 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg glow-primary">
                <Wallet className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-6 w-6 text-primary animate-pulse-subtle" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold">
            Connect to Continue
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Choose your preferred method to access your cosmic predictions
          </p>
        </div>

        {/* Auth Card */}
        <div className="max-w-md mx-auto">
          <Card className="relative overflow-hidden border-primary/20 shadow-xl">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24" />
            
            <CardHeader className="relative text-center pb-4">
              <CardTitle className="text-xl sm:text-2xl font-serif mb-2">
                Wallet Connect
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Connect with any Web3 wallet, email, or social account
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <Button
                onClick={handlePrivyLogin}
                disabled={!ready}
                size="lg"
                className="w-full h-14 text-base font-semibold shadow-lg glow-primary group"
                data-testid="button-privy-login"
              >
                <Wallet className="h-5 w-5 mr-2" />
                {!ready ? "Loading..." : "Connect Wallet"}
                <Sparkles className="h-4 w-4 ml-2 opacity-70" />
              </Button>
              
              {/* Info */}
              <div className="pt-2 space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Supports MetaMask, Coinbase Wallet, WalletConnect, and more
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-accent" />
                  <span>Secure authentication via Privy</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Note */}
        <div className="mt-10 sm:mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <Shield className="h-4 w-4 text-accent" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your birth data is protected with zero-knowledge proofs. We never store your raw birth information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
