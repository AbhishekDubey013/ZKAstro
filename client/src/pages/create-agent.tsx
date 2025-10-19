import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { NavHeader } from '@/components/nav-header';

export default function CreateAgent() {
  const { toast } = useToast();
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [method, setMethod] = useState('');
  const [personality, setPersonality] = useState('');
  const [aggressiveness, setAggressiveness] = useState([1.0]);

  // Fetch existing agents to show what's already created
  const { data: agents } = useQuery({
    queryKey: ['/api/agents'],
  });

  const createAgent = useMutation({
    mutationFn: async (agentData: any) => {
      const response = await fetch('/api/admin/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create agent');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '🎉 Agent Created!',
        description: `${data.agent.handle} deployed successfully`,
      });

      // Reset form
      setHandle('');
      setName('');
      setMethod('');
      setPersonality('');
      setAggressiveness([1.0]);
    },
    onError: (error: any) => {
      toast({
        title: '❌ Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!handle.startsWith('@')) {
      toast({
        title: 'Invalid Handle',
        description: 'Handle must start with @',
        variant: 'destructive',
      });
      return;
    }

    createAgent.mutate({
      handle,
      name,
      method,
      personality,
      aggressiveness: aggressiveness[0],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <NavHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="text-5xl animate-bounce">🤖</div>
              <div className="absolute inset-0 blur-xl bg-violet-400/40 rounded-full" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Create Your AI Agent
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Deploy autonomous agents via <span className="text-violet-400 font-semibold">GAME Framework</span> on Base Sepolia
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-purple-900/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              🌟 How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-violet-400 text-xl">✓</span>
              <p>Deployed as smart contract on <span className="text-violet-400 font-semibold">Base Sepolia</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 text-xl">✓</span>
              <p>Receives raw planetary positions + <span className="text-violet-400 font-semibold">ZK proofs</span> for privacy</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 text-xl">✓</span>
              <p>Performance recorded <span className="text-violet-400 font-semibold">on-chain</span> for transparency</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 text-xl">✓</span>
              <p>Aggressiveness controls prediction style (<span className="text-violet-400 font-semibold">0.5x - 1.5x</span> multiplier)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 text-xl">✓</span>
              <p>Community can see and select your agent's predictions</p>
            </div>
          </CardContent>
        </Card>

        {/* Creation Form */}
        <Card className="border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Agent Configuration</CardTitle>
            <CardDescription className="text-slate-400">Define your agent's personality and methodology</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Handle */}
              <div className="space-y-2">
                <Label htmlFor="handle">Handle *</Label>
                <Input
                  id="handle"
                  placeholder="@myagent"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700"
                />
                <p className="text-sm text-slate-400">
                  Unique identifier (must start with @)
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Cosmic Oracle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700"
                />
                <p className="text-sm text-slate-400">Display name</p>
              </div>

              {/* Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Prediction Method *</Label>
                <Input
                  id="method"
                  placeholder="Transit-Aspect Synthesis"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700"
                />
                <p className="text-sm text-slate-400">
                  Your unique astrological methodology
                </p>
              </div>

              {/* Personality */}
              <div className="space-y-2">
                <Label htmlFor="personality">Personality *</Label>
                <Textarea
                  id="personality"
                  placeholder="Analytical and detail-oriented, focusing on practical applications..."
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  required
                  rows={3}
                  className="bg-slate-800 border-slate-700"
                />
                <p className="text-sm text-slate-400">
                  Describe your agent's approach to predictions
                </p>
              </div>

              {/* Aggressiveness Slider */}
              <div className="space-y-4">
                <Label>
                  Aggressiveness: {aggressiveness[0].toFixed(1)}x
                </Label>
                <Slider
                  value={aggressiveness}
                  onValueChange={setAggressiveness}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>0.5x (Conservative)</span>
                  <span>1.0x (Balanced)</span>
                  <span>1.5x (Bold)</span>
                </div>
                <p className="text-sm text-slate-400">
                  Controls scoring intensity - higher values weight transits more heavily
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-violet-500/50 transition-all duration-300"
                size="lg"
                disabled={createAgent.isPending}
              >
                {createAgent.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Deploying Agent...
                  </>
                ) : (
                  <>
                    🚀 Deploy Agent to Base Sepolia
                  </>
                )}
              </Button>

              {createAgent.isPending && (
                <p className="text-center text-sm text-slate-400">
                  This may take 30-60 seconds...
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Existing Agents */}
        <Card className="mt-6 border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">🎖️ Active Agents</CardTitle>
            <CardDescription className="text-slate-400">
              Currently deployed agents competing for predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents?.map((agent: any) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/80 to-purple-900/20 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-[1.02]"
                >
                  <div>
                    <div className="font-bold text-lg text-violet-300">{agent.handle}</div>
                    <div className="text-sm text-slate-400">{agent.method}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {agent.reputation || 0} reputation
                    </div>
                    <div className="text-xs text-slate-500">
                      {agent.aggressiveness}x aggressiveness
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

