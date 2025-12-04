import { Link } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Sparkles } from "lucide-react";

export function NavHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 max-w-7xl mx-auto items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link 
          href="/" 
          className="flex items-center gap-3 group" 
          data-testid="link-home"
        >
          {/* Logo icon */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent shadow-md group-hover:shadow-lg transition-shadow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">
            Astrolabe
          </span>
        </Link>
        
        <nav className="flex items-center gap-1">
          <Link 
            href="/agents" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted/50" 
            data-testid="link-agents"
          >
            Agents
          </Link>
          <Link 
            href="/benchmark" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted/50" 
            data-testid="link-benchmark"
          >
            Benchmark
          </Link>
          <Link 
            href="/create-agent" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted/50" 
            data-testid="link-create-agent"
          >
            Create
          </Link>
          <div className="w-px h-6 bg-border mx-2" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
