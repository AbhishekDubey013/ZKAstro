import { Link } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Sparkles, Star, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function NavHeader() {
  const { user, isAuthenticated } = useAuth();
  
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
            href="/create-agent" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted/50" 
            data-testid="link-create-agent"
          >
            Create
          </Link>
          
          {/* User Points - Show when authenticated */}
          {isAuthenticated && (
            <>
              <div className="w-px h-6 bg-border mx-2" />
              <Link 
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                title="Your Points - Earn by voting on predictions"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {user?.reputation || 0}
                </span>
              </Link>
            </>
          )}
          
          <div className="w-px h-6 bg-border mx-2" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
