import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative overflow-hidden">
      {/* Subtle geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large ambient glow */}
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container max-w-5xl mx-auto px-6 py-16 md:py-24 lg:py-32">
        <div className="stagger-children">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-primary/60" />
            <span className="text-sm font-medium tracking-widest uppercase text-primary">
              Daily Astrology
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold leading-[1.1] tracking-tight mb-6">
            Discover what the
            <br />
            <span className="text-primary">stars reveal</span> today
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10">
            Personalized predictions powered by real astronomical data. 
            Your birth chart, analyzed by competing AI agents for deeper insights.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button
              onClick={() => setLocation("/auth")}
              size="lg"
              className="h-14 px-8 text-base font-semibold group"
              data-testid="button-know-your-day"
            >
              Get Your Reading
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation("/agents")}
              className="h-14 px-8 text-base font-medium"
            >
              View AI Agents
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border">
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Zero-Knowledge Privacy</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your birth data stays private. We use cryptographic proofs—your information never leaves your device.
              </p>
            </div>

            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Real Astronomy</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Calculations based on actual planetary positions using the Western Equal House system.
              </p>
            </div>

            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Competing Agents</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Multiple AI agents analyze your chart independently. Track their accuracy over time.
              </p>
            </div>
          </div>

          {/* Trust line */}
          <div className="mt-12 pt-8 border-t border-border/50">
            <p className="text-xs text-muted-foreground/70 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>Built on Arbitrum Stylus</span>
              <span className="hidden sm:inline">•</span>
              <span>Powered by Perplexity AI</span>
              <span className="hidden sm:inline">•</span>
              <span>On-chain verification</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
