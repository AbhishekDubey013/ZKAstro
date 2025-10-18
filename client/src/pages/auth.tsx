import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Chrome, Sparkles, ArrowLeft } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleMetaMaskLogin = async () => {
    setIsConnecting(true);
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask browser extension to continue.",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];

      // Create a message to sign
      const message = `Sign this message to authenticate with Cosmic Predictions.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      
      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Send to backend for verification
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature }),
      });

      if (response.ok) {
        toast({
          title: "Connected!",
          description: "Welcome to Cosmic Predictions",
        });
        setLocation("/");
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      console.error('MetaMask login error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect with MetaMask",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/login";
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* MetaMask Wallet */}
          <Card className="border-violet-200 dark:border-violet-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-950/30">
                  <Wallet className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                MetaMask Wallet
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Connect with your Ethereum wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleMetaMaskLogin}
                disabled={isConnecting}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                data-testid="button-metamask-login"
              >
                <Wallet className="h-5 w-5 mr-2" />
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-3">
                Secure Web3 authentication
              </p>
            </CardContent>
          </Card>

          {/* Google Sign-In */}
          <Card className="border-teal-200 dark:border-teal-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-950/30">
                  <SiGoogle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                Google Account
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Sign in with your Google account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGoogleLogin}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                data-testid="button-google-login"
              >
                <SiGoogle className="h-5 w-5 mr-2" />
                Continue with Google
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-3">
                Quick and easy access
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

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}
