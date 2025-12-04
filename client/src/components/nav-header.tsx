import { Link } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Sun, Moon } from "lucide-react";

export function NavHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 max-w-5xl items-center justify-between px-6">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 group" 
          data-testid="link-home"
        >
          {/* Celestial icon */}
          <div className="relative flex items-center justify-center w-8 h-8">
            <Sun className="h-5 w-5 text-primary absolute transition-transform group-hover:scale-110" />
            <Moon className="h-3 w-3 text-accent absolute -right-0.5 -bottom-0.5" />
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight">
            Astrolabe
          </span>
        </Link>
        
        <nav className="flex items-center gap-1">
          <Link 
            href="/agents" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted/50" 
            data-testid="link-agents"
          >
            Agents
          </Link>
          <Link 
            href="/create-agent" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted/50" 
            data-testid="link-create-agent"
          >
            Create
          </Link>
          <div className="w-px h-5 bg-border mx-2" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
