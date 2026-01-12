import { MessageCircle, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PredictionChatProps {
  requestId: string;
}

export function PredictionChat({ requestId: _requestId }: PredictionChatProps) {
  return (
    <Card data-testid="prediction-chat-card" className="border-dashed border-2 opacity-80">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Ask Follow-Up Questions
              <span className="inline-flex items-center gap-1 text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                Coming Soon
              </span>
            </CardTitle>
            <CardDescription>
              Chat with the AI about your prediction
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center justify-center h-[200px] text-center gap-4 bg-muted/30 rounded-lg border border-dashed">
          <div className="relative">
            <Sparkles className="h-12 w-12 text-primary/30" />
            <div className="absolute inset-0 animate-pulse">
              <Sparkles className="h-12 w-12 text-primary/50" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Interactive Chat Coming Soon!
            </p>
            <p className="text-xs text-muted-foreground/70 max-w-[300px]">
              Ask follow-up questions about your prediction, explore specific cosmic influences, 
              and get personalized insights from the agents.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
