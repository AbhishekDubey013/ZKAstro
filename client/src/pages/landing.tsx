import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sparkles, Sun, Moon, Stars, Zap } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-violet-50 via-blue-50 to-teal-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-teal-950/20 relative overflow-hidden">
      {/* Vibrant Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bright gradient orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-violet-400 to-purple-300 dark:from-violet-600 dark:to-purple-500 opacity-30 dark:opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-gradient-to-br from-teal-400 to-cyan-300 dark:from-teal-600 dark:to-cyan-500 opacity-30 dark:opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400 to-indigo-300 dark:from-blue-600 dark:to-indigo-500 opacity-20 dark:opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating sparkles */}
        <div className="absolute top-20 left-20 animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>
          <Sparkles className="h-6 w-6 text-yellow-400 dark:text-yellow-300" />
        </div>
        <div className="absolute top-40 right-32 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Stars className="h-5 w-5 text-violet-400 dark:text-violet-300" />
        </div>
        <div className="absolute bottom-32 left-40 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <Zap className="h-5 w-5 text-teal-400 dark:text-teal-300" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="text-center space-y-8 sm:space-y-10 md:space-y-12">
          {/* Cosmic Icons */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="relative">
              <Sun className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-yellow-500 dark:text-yellow-400 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-yellow-400/40 rounded-full" />
            </div>
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-violet-500 dark:text-violet-400 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="relative">
              <Moon className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-blue-500 dark:text-blue-400 animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-0 blur-xl bg-blue-400/40 rounded-full" />
            </div>
          </div>

          {/* Main Title - Animated Gradient */}
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
              <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-600 dark:from-violet-400 dark:via-blue-400 dark:to-teal-400 bg-clip-text text-transparent animate-gradient-x">
                Cosmic Predictions
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-4 font-medium">
            Unlock the secrets of your day with{" "}
            <span className="text-violet-600 dark:text-violet-400 font-bold">AI-powered astrology</span>
          </p>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Personalized daily predictions powered by real astronomical calculations
          </p>

          {/* Vibrant Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 px-4">
            <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 border-2 border-violet-300 dark:border-violet-700">
              <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <span className="text-sm sm:text-base font-semibold text-violet-700 dark:text-violet-300">Real Astronomical Data</span>
            </div>
            <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border-2 border-teal-300 dark:border-teal-700">
              <Stars className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span className="text-sm sm:text-base font-semibold text-teal-700 dark:text-teal-300">Competing AI Agents</span>
            </div>
          </div>

          {/* Main CTA Button - HERO */}
          <div className="pt-8 sm:pt-10 md:pt-12">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="h-14 sm:h-16 md:h-20 px-8 sm:px-12 md:px-16 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-600 hover:from-violet-700 hover:via-blue-700 hover:to-teal-700 text-white shadow-2xl hover:shadow-violet-500/50 dark:shadow-violet-900/50 transition-all duration-300 hover:scale-105 border-0 rounded-2xl"
              data-testid="button-know-your-day"
            >
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mr-3 animate-spin" style={{ animationDuration: '3s' }} />
              Know Your Day
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ml-3 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 sm:pt-10 space-y-4">
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500">
              🔮 Western Equal House System • 🔐 Zero-Knowledge Privacy • ✨ Powered by Perplexity AI
            </p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
              🏆 Built with Virtuals Protocol GAME SDK on Base (Ethereum L2)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
