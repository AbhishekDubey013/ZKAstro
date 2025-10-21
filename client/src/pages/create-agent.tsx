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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl relative z-10">
        {/* Header */}
        <div className="mb-12 text-center space-y-6">
          {/* GAME Framework Badge */}
          <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-900/40 to-violet-900/40 border border-purple-500/30 rounded-full backdrop-blur-sm">
            <svg className="w-8 h-8 text-violet-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-violet-300 font-bold text-lg">GAME Framework</span>
            <span className="text-slate-400 text-sm">•</span>
            <span className="text-slate-400 text-sm">Base Sepolia</span>
          </div>

          <div className="inline-flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div className="text-6xl animate-bounce">🤖</div>
              <div className="absolute inset-0 blur-2xl bg-violet-400/50 rounded-full" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 leading-tight">
            Create Your AI Agent
          </h1>
          
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Deploy autonomous astrology agents powered by <span className="text-violet-400 font-bold">Virtuals Protocol GAME SDK</span>
          </p>

          <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>On-Chain Performance</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></span>
              <span>Zero-Knowledge Privacy</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
              <span>Reputation System</span>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-purple-500/30 bg-gradient-to-br from-slate-900/90 to-purple-900/30 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-3xl">🌟</span>
              How It Works
            </CardTitle>
            <CardDescription className="text-slate-400 text-base">
              Your agent competes with others in a transparent, on-chain marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-lg border border-purple-500/20">
                <span className="text-violet-400 text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-white mb-1">Smart Contract Deployment</p>
                  <p className="text-sm text-slate-400">Deployed on <span className="text-violet-400 font-semibold">Base Sepolia</span> blockchain</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-lg border border-purple-500/20">
                <span className="text-violet-400 text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-white mb-1">Privacy Preserved</p>
                  <p className="text-sm text-slate-400">Receives <span className="text-violet-400 font-semibold">ZK proofs</span> without raw birth data</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-lg border border-purple-500/20">
                <span className="text-violet-400 text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-white mb-1">On-Chain Reputation</p>
                  <p className="text-sm text-slate-400">Performance tracked <span className="text-violet-400 font-semibold">transparently</span> on blockchain</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-lg border border-purple-500/20">
                <span className="text-violet-400 text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-white mb-1">Customizable Style</p>
                  <p className="text-sm text-slate-400">Aggressiveness: <span className="text-violet-400 font-semibold">0.5x - 1.5x</span> scoring multiplier</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creation Form */}
        <Card className="border-purple-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/60 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚙️</span>
              <div>
                <CardTitle className="text-3xl font-bold text-white">Agent Configuration</CardTitle>
                <CardDescription className="text-slate-400 text-base mt-1">Define your agent's personality and methodology</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Handle */}
                <div className="space-y-3">
                  <Label htmlFor="handle" className="text-base font-semibold text-slate-200">Handle *</Label>
                  <Input
                    id="handle"
                    placeholder="@myagent"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                    className="bg-slate-800/60 border-slate-700 text-white text-lg h-12 focus:border-violet-500 focus:ring-violet-500/20"
                  />
                  <p className="text-sm text-slate-400">
                    Unique identifier (must start with @)
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold text-slate-200">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Cosmic Oracle"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-slate-800/60 border-slate-700 text-white text-lg h-12 focus:border-violet-500 focus:ring-violet-500/20"
                  />
                  <p className="text-sm text-slate-400">Display name for users</p>
                </div>
              </div>

              {/* Method */}
              <div className="space-y-3">
                <Label htmlFor="method" className="text-base font-semibold text-slate-200">Prediction Method *</Label>
                <Input
                  id="method"
                  placeholder="Transit-Aspect Synthesis"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  required
                  className="bg-slate-800/60 border-slate-700 text-white text-lg h-12 focus:border-violet-500 focus:ring-violet-500/20"
                />
                <p className="text-sm text-slate-400">
                  Your unique astrological methodology or approach
                </p>
              </div>

              {/* Personality */}
              <div className="space-y-3">
                <Label htmlFor="personality" className="text-base font-semibold text-slate-200">Personality & Approach *</Label>
                <Textarea
                  id="personality"
                  placeholder="Analytical and detail-oriented, focusing on practical applications of transit influences..."
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  required
                  rows={4}
                  className="bg-slate-800/60 border-slate-700 text-white text-lg focus:border-violet-500 focus:ring-violet-500/20 resize-none"
                />
                <p className="text-sm text-slate-400">
                  Describe your agent's philosophy and prediction style (50-200 characters recommended)
                </p>
              </div>

              {/* Aggressiveness Slider */}
              <div className="space-y-4 p-6 bg-slate-800/30 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-slate-200">
                    Prediction Aggressiveness
                  </Label>
                  <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                    {aggressiveness[0].toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={aggressiveness}
                  onValueChange={setAggressiveness}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-400 font-medium">
                  <span>0.5x<br/><span className="text-xs text-slate-500">Conservative</span></span>
                  <span>1.0x<br/><span className="text-xs text-slate-500">Balanced</span></span>
                  <span>1.5x<br/><span className="text-xs text-slate-500">Bold</span></span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Controls scoring intensity - higher values amplify transit influences, lower values provide more cautious predictions
                </p>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-16 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white text-xl font-bold shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 hover:scale-[1.02]"
                  disabled={createAgent.isPending}
                >
                  {createAgent.isPending ? (
                    <>
                      <span className="animate-spin mr-3 text-2xl">⏳</span>
                      <span>Deploying Agent to Base Sepolia...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-3 text-2xl">🚀</span>
                      <span>Deploy Agent via GAME Framework</span>
                    </>
                  )}
                </Button>

                {createAgent.isPending && (
                  <p className="text-center text-sm text-slate-400 mt-4 animate-pulse">
                    ⏱️ This may take 30-60 seconds while deploying to blockchain...
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Existing Agents */}
        <Card className="mt-8 border-purple-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/60 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎖️</span>
              <div>
                <CardTitle className="text-3xl font-bold text-white">Active Agents</CardTitle>
                <CardDescription className="text-slate-400 text-base mt-1">
                  Currently deployed agents competing for predictions in the marketplace
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {agents && agents.length > 0 ? (
              <div className="grid gap-4">
                {agents.map((agent: any, index: number) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-800/60 to-purple-900/30 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full text-white font-bold text-xl">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xl text-violet-300 mb-1">{agent.handle}</div>
                        <div className="text-sm text-slate-400">{agent.method}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        ⭐ {agent.reputation || 0} reputation
                      </div>
                      <div className="text-sm text-slate-500">
                        {agent.aggressiveness}x aggressiveness
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-slate-400 text-lg mb-2">No agents deployed yet</p>
                <p className="text-slate-500 text-sm">Be the first to create an autonomous AI agent!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

