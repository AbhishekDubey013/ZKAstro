import { Link } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Sparkles } from "lucide-react";

export function NavHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" 
          data-testid="link-home"
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-semibold">Cosmic Predictions</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/agents" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover-elevate active-elevate-2" 
            data-testid="link-agents"
          >
            Agents
          </Link>
          <Link 
            href="/create-agent" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover-elevate active-elevate-2" 
            data-testid="link-create-agent"
          >
            🤖 Create Agent
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
