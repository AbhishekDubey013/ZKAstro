import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { NavHeader } from '@/components/nav-header';
import { Shield, Zap, TrendingUp, Coins, EyeOff, ArrowRight, Sun, Moon, Star, Sparkles, Wallet, Brain } from 'lucide-react';

export default function CreateAgent() {
  const { toast } = useToast();
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [method, setMethod] = useState('');
  const [personality, setPersonality] = useState('');
  const [aggressiveness, setAggressiveness] = useState([1.0]);
  const [paymentWallet, setPaymentWallet] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Astrological configuration
  const [primaryPlanet, setPrimaryPlanet] = useState('sun');
  const [aspectWeight, setAspectWeight] = useState([1.0]);
  const [focusOnBenefics, setFocusOnBenefics] = useState(true);
  const [considerRetrogrades, setConsiderRetrogrades] = useState(true);
  const [moonPhaseWeight, setMoonPhaseWeight] = useState([0.5]);

  // Fetch existing agents
  const { data: agents } = useQuery({
    queryKey: ['/api/agents'],
  });
  const agentsList = Array.isArray(agents) ? agents : [];

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
        title: 'Agent Deployed',
        description: `${data.agent.handle} is now live on Arbitrum`,
      });
      setHandle('');
      setName('');
      setMethod('');
      setPersonality('');
      setAggressiveness([1.0]);
    },
    onError: (error: any) => {
      toast({
        title: 'Deployment Failed',
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
      paymentWallet: paymentWallet.toLowerCase() || undefined,
      systemPrompt: systemPrompt || undefined,
      config: {
        primaryPlanet,
        aspectWeight: aspectWeight[0],
        focusOnBenefics,
        considerRetrogrades,
        moonPhaseWeight: moonPhaseWeight[0],
      }
    });
  };

  const planets = [
    { id: 'sun', name: 'Sun', symbol: '☉', desc: 'Core identity, vitality' },
    { id: 'moon', name: 'Moon', symbol: '☽', desc: 'Emotions, intuition' },
    { id: 'mercury', name: 'Mercury', symbol: '☿', desc: 'Communication, intellect' },
    { id: 'venus', name: 'Venus', symbol: '♀', desc: 'Love, harmony, values' },
    { id: 'mars', name: 'Mars', symbol: '♂', desc: 'Action, drive, energy' },
    { id: 'jupiter', name: 'Jupiter', symbol: '♃', desc: 'Expansion, luck, growth' },
    { id: 'saturn', name: 'Saturn', symbol: '♄', desc: 'Structure, discipline, karma' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/50 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
      </div>
      
      <NavHeader />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Decentralized Agent Network · Arbitrum
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Connect Your Agent.{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Earn Per Call.
            </span>
          </h1>
          
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            Deploy autonomous prediction agents that read chart data via ZK proofs—user DOB is never exposed. 
            Get paid directly through x402 payment rails for every prediction.
          </p>

          {/* Value Props */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <EyeOff className="h-5 w-5 text-violet-400 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-white text-sm">Zero-Knowledge</p>
                <p className="text-xs text-slate-400">No birth data access</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <Coins className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-white text-sm">x402 Payments</p>
                <p className="text-xs text-slate-400">Direct per-call earnings</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-white text-sm">On-Chain Rep</p>
                <p className="text-xs text-slate-400">Immutable scoring</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Info */}
            <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  Agent Identity
            </CardTitle>
                <CardDescription className="text-slate-400">
                  Define your agent's public presence
            </CardDescription>
          </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Handle</Label>
                  <Input
                      placeholder="@cosmicoracle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                      className="bg-slate-800/50 border-slate-700 text-white h-11"
                  />
                </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Display Name</Label>
                  <Input
                    placeholder="Cosmic Oracle"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                      className="bg-slate-800/50 border-slate-700 text-white h-11"
                  />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Methodology</Label>
                <Input
                    placeholder="Transit-Aspect Synthesis with Lunar Emphasis"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  required
                    className="bg-slate-800/50 border-slate-700 text-white h-11"
                />
              </div>
<div className="space-y-2">
                  <Label className="text-slate-200">Short Personality</Label>
                  <Textarea
                    placeholder="A wise and grounded astrologer who focuses on practical timing advice..."
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    required
                    rows={2}
                    className="bg-slate-800/50 border-slate-700 text-white resize-none"
                  />
                </div>
                
                {/* System Prompt - Agent Behavior */}
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-violet-400" />
                    Agent Behavior (System Prompt)
                  </Label>
                  <Textarea
                    placeholder={`You are @yourhandle, a [STYLE] astrologer who [UNIQUE APPROACH].

PHILOSOPHY: [Your agent's core belief about astrology]

YOUR SIGNATURE STYLE:
- [Key trait 1]
- [Key trait 2]
- [Key trait 3]

TONE: [How your agent speaks]
NEVER: [What to avoid]`}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={8}
                    className="bg-slate-800/50 border-slate-700 text-white resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    This prompt shapes how your agent generates predictions. Define their unique philosophy, style, and voice. 
                    <span className="text-violet-400 ml-1">Leave empty for default behavior.</span>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-400" />
                    Payment Wallet Address
                  </Label>
                  <Input
                    placeholder="0x... (receive ETH directly for predictions)"
                    value={paymentWallet}
                    onChange={(e) => setPaymentWallet(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white h-11 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    x402 payments will be sent directly to this address. Leave empty to receive payments to the platform wallet.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Astrological Config */}
            <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400" />
                  Astrological Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Fine-tune how your agent interprets celestial data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Primary Planet Focus */}
                <div className="space-y-3">
                  <Label className="text-slate-200">Primary Planetary Focus</Label>
                  <p className="text-xs text-slate-400 mb-3">Which planet's transits should your agent emphasize most?</p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {planets.map((planet) => (
                      <button
                        key={planet.id}
                        type="button"
                        onClick={() => setPrimaryPlanet(planet.id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          primaryPlanet === planet.id
                            ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                        title={planet.desc}
                      >
                        <div className="text-2xl mb-1">{planet.symbol}</div>
                        <div className="text-[10px] font-medium">{planet.name}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Selected: <span className="text-violet-400">{planets.find(p => p.id === primaryPlanet)?.desc}</span>
                  </p>
                </div>

                {/* Sliders */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-200 text-sm">Prediction Intensity</Label>
                      <span className="text-lg font-mono text-violet-400">{aggressiveness[0].toFixed(1)}x</span>
                </div>
                <Slider
                  value={aggressiveness}
                  onValueChange={setAggressiveness}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Conservative</span>
                      <span>Bold</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-200 text-sm">Aspect Sensitivity</Label>
                      <span className="text-lg font-mono text-violet-400">{aspectWeight[0].toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={aspectWeight}
                      onValueChange={setAspectWeight}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Subtle</span>
                      <span>Pronounced</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-200 text-sm">Moon Phase Weight</Label>
                      <span className="text-lg font-mono text-violet-400">{moonPhaseWeight[0].toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={moonPhaseWeight}
                      onValueChange={setMoonPhaseWeight}
                      min={0}
                      max={1.5}
                      step={0.1}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Ignore</span>
                      <span>Emphasize</span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-200 text-sm">Benefic Focus</Label>
                        <p className="text-[10px] text-slate-500">Emphasize Jupiter/Venus</p>
                      </div>
                      <Switch
                        checked={focusOnBenefics}
                        onCheckedChange={setFocusOnBenefics}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-200 text-sm">Retrograde Impact</Label>
                        <p className="text-[10px] text-slate-500">Factor in Rx periods</p>
                      </div>
                      <Switch
                        checked={considerRetrogrades}
                        onCheckedChange={setConsiderRetrogrades}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deploy Button */}
            <form onSubmit={handleSubmit}>
                <Button
                  type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  disabled={createAgent.isPending}
                >
                  {createAgent.isPending ? (
                  <>Deploying to Arbitrum...</>
                  ) : (
                    <>
                    Deploy Agent
                    <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Privacy Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300 space-y-3">
                <p>
                  Your agent receives planetary positions via zero-knowledge proofs. User birth dates are <span className="text-emerald-400 font-medium">never transmitted</span>.
                </p>
                <p className="text-slate-400 text-xs">
                  Cryptographic verification without data exposure. Trust through math.
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  x402 Payment Rails
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300 space-y-3">
                <p>
                  No platform middleman. HTTP-native micropayments mean users pay your agent <span className="text-amber-400 font-medium">directly per call</span>.
                </p>
                <p className="text-slate-400 text-xs">
                  Earnings flow straight to your wallet. Transparent and instant.
                </p>
              </CardContent>
            </Card>

            <Card className="border-violet-500/20 bg-violet-500/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-400" />
                  Reputation System
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300 space-y-3">
                <p>
                  Every prediction outcome is recorded on-chain. Users vote on accuracy—<span className="text-violet-400 font-medium">better agents rise</span>.
                </p>
                <p className="text-slate-400 text-xs">
                  Immutable, publicly auditable performance history.
                </p>
          </CardContent>
        </Card>

            {/* Tech Stack */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
              <p className="text-xs font-medium text-slate-400 mb-3">POWERED BY</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ⚡ Arbitrum Stylus
                </span>
                <span className="px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-purple-300 border border-purple-500/30">
                  🔐 ZK Proofs
                </span>
                <span className="px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                  💰 x402 Protocol
                </span>
                <span className="px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30">
                  #️⃣ Poseidon Hash
                </span>
              </div>
            </div>
          </div>
                      </div>

        {/* Active Agents */}
        {agentsList.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
              <h2 className="text-2xl font-bold text-white">Active Agents</h2>
              <span className="px-2 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                {agentsList.length} Live
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agentsList.map((agent: any) => (
<Card key={agent.id} className="border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/50 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg text-white group-hover:text-violet-300 transition-colors">{agent.handle}</p>
                        <p className="text-sm text-slate-400">{agent.method}</p>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                          <p className="font-mono text-sm font-bold text-violet-300">{agent.reputation || 0}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">reputation</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Intensity</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">{agent.aggressiveness || 1.0}x</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Payment</span>
                        {agent.paymentWallet ? (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" title={agent.paymentWallet}>
                            💰 {agent.paymentWallet.slice(0, 6)}...{agent.paymentWallet.slice(-4)}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">Platform</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
          </div>
        )}

        {agentsList.length === 0 && (
          <div className="mt-16 text-center py-12 rounded-xl border border-dashed border-slate-700">
            <Sun className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No agents deployed yet</h3>
            <p className="text-slate-500 text-sm">Be the first to connect and start earning</p>
              </div>
            )}
      </div>
    </div>
  );
}
