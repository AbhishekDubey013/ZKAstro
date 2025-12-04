import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight, Shield, Sparkles, BarChart3, Star, Moon, Sun } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-glow" />
        {/* Accent glow */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '2s' }} />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[80px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-6 py-20 md:py-28 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Text */}
          <div className="space-y-8 stagger">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Daily Cosmic Guidance</span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up text-4xl sm:text-5xl md:text-6xl font-serif font-semibold leading-[1.1] tracking-tight" style={{ animationDelay: '0.1s' }}>
              Discover what the{" "}
              <span className="gradient-text">stars reveal</span>{" "}
              about your day
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg" style={{ animationDelay: '0.2s' }}>
              Personalized astrological predictions powered by real astronomical data and competing AI agents.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up flex flex-col sm:flex-row gap-4" style={{ animationDelay: '0.3s' }}>
              <Button
                onClick={() => setLocation("/auth")}
                size="lg"
                className="h-14 px-8 text-base font-semibold shadow-lg glow-primary group"
                data-testid="button-know-your-day"
              >
                Get Your Reading
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLocation("/agents")}
                className="h-14 px-8 text-base font-medium bg-card/50 backdrop-blur-sm"
              >
                View AI Agents
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-up flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground" style={{ animationDelay: '0.4s' }}>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                Zero-knowledge privacy
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                On-chain verified
              </span>
            </div>
          </div>

          {/* Right column - Visual */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Decorative celestial illustration */}
            <div className="relative w-full max-w-md aspect-square">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-[spin_60s_linear_infinite]" />
              
              {/* Middle ring */}
              <div className="absolute inset-8 rounded-full border border-accent/30 animate-[spin_40s_linear_infinite_reverse]" />
              
              {/* Inner glow */}
              <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
              
              {/* Center orb */}
              <div className="absolute inset-20 rounded-full bg-gradient-to-br from-card via-card to-primary/10 border border-border shadow-2xl flex items-center justify-center">
                <div className="relative">
                  <Sun className="h-16 w-16 text-primary animate-float" />
                  <Moon className="h-8 w-8 text-accent absolute -bottom-2 -right-4 animate-float" style={{ animationDelay: '1s' }} />
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute top-8 right-12 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
              </div>
              <div className="absolute bottom-16 left-8 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="w-4 h-4 rounded-full bg-accent shadow-lg shadow-accent/50" />
              </div>
              <div className="absolute top-1/3 left-4 animate-float" style={{ animationDelay: '2s' }}>
                <div className="w-2 h-2 rounded-full bg-chart-3 shadow-lg shadow-chart-3/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="mt-24 md:mt-32 pt-16 border-t border-border/50">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Zero-Knowledge Privacy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your birth data is calculated locally. We use cryptographic proofs—your private information never leaves your device.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real Astronomical Data</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Calculations based on actual planetary positions using the Western Equal House system. No approximations.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-chart-3/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Competing AI Agents</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Multiple AI agents analyze your chart independently. Track their accuracy and choose the best predictor.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground/60 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span>Built on Arbitrum Stylus</span>
            <span className="hidden sm:inline text-border">•</span>
            <span>Powered by Perplexity AI</span>
            <span className="hidden sm:inline text-border">•</span>
            <span>On-chain verification</span>
          </p>
        </div>
      </div>
    </div>
  );
}
