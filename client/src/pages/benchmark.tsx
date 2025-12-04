import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Zap, Code2, ExternalLink, BarChart3, Flame, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BenchmarkResult {
  operation: string;
  stylusGas: string;
  solidityGas: string;
  savings: number;
  stylusTx: string;
  solidityTx: string;
}

interface BenchmarkData {
  timestamp: string;
  network: string;
  stylusAddress: string;
  solidityAddress?: string;
  methodology: string;
  results: BenchmarkResult[];
  summary: {
    totalStylusGas: string;
    totalSolidityGas: string;
    overallSavings: number;
    averageSavings: number;
    maxSavings?: number;
    minSavings?: number;
  };
}

export default function Benchmark() {
  const { data: benchmarkData, isLoading } = useQuery<BenchmarkData>({
    queryKey: ["/api/benchmark"],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      try {
        const response = await fetch(`${API_BASE_URL}/api/benchmark`, { credentials: "include" });
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Skeleton className="h-12 w-80 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!benchmarkData) {
    return (
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No benchmark data available. Run the benchmark script first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = benchmarkData;
  const overallSavings = data.summary.overallSavings;
  const stylusWins = overallSavings > 0;
  const hasSolidityContract = data.solidityAddress && data.solidityAddress !== '0x...';

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[100px]" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-primary" />
            <span className="text-xs font-medium tracking-widest uppercase text-primary">Real Benchmark Data</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-semibold mb-3">
            Stylus vs Solidity
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {hasSolidityContract 
              ? "Real gas measurements from identical contracts deployed on Arbitrum Sepolia."
              : "Stylus measurements with estimated Solidity costs based on EVM gas patterns."}
          </p>
          {hasSolidityContract && (
            <Badge variant="outline" className="mt-3 bg-accent/10 text-accent border-accent/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Real on-chain comparison
            </Badge>
          )}
        </div>

        {/* Key Finding Alert */}
        <Card className={`mb-8 ${stylusWins ? 'border-accent/30 bg-accent/5' : 'border-primary/30 bg-primary/5'}`}>
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              {stylusWins ? (
                <TrendingDown className="h-8 w-8 text-accent flex-shrink-0" />
              ) : (
                <TrendingUp className="h-8 w-8 text-primary flex-shrink-0" />
              )}
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {stylusWins 
                    ? `Stylus saves ${overallSavings.toFixed(1)}% gas` 
                    : `Solidity is ${Math.abs(overallSavings).toFixed(1)}% more efficient for this contract`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stylusWins 
                    ? "Stylus WASM execution provides significant gas savings for this use case."
                    : "This storage-heavy contract benefits from EVM's optimized SSTORE/SLOAD operations. Stylus shines in compute-intensive scenarios (cryptography, complex math, memory operations)."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                {stylusWins ? <TrendingDown className="h-5 w-5 text-accent" /> : <TrendingUp className="h-5 w-5 text-primary" />}
                <span className="text-xs font-medium text-muted-foreground uppercase">Difference</span>
              </div>
              <div className={`text-3xl md:text-4xl font-bold tabular-nums ${stylusWins ? 'text-accent' : 'text-primary'}`}>
                {overallSavings > 0 ? '-' : '+'}{Math.abs(overallSavings).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stylusWins ? 'Stylus saves' : 'Solidity saves'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-accent" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Stylus</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-accent tabular-nums">
                {Number(data.summary.totalStylusGas).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">total gas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-chart-4/5 border-chart-4/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-chart-4" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Solidity</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-chart-4 tabular-nums">
                {Number(data.summary.totalSolidityGas).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">total gas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-muted/50 border-muted-foreground/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Tests</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                {data.results.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">operations tested</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Operation Breakdown</CardTitle>
            <CardDescription>Gas consumption for each contract operation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.results.map((result, idx) => {
                const stylusGas = Number(result.stylusGas);
                const solidityGas = Number(result.solidityGas);
                const maxGas = Math.max(stylusGas, solidityGas);
                const isStylusBetter = result.savings > 0;
                
                return (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{result.operation}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${isStylusBetter ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}
                        >
                          {result.savings > 0 ? '-' : '+'}{Math.abs(result.savings).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Visual bar comparison */}
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center">
                        <span className="text-xs text-muted-foreground w-16">Stylus</span>
                        <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden relative">
                          <div 
                            className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-lg transition-all flex items-center justify-end pr-2"
                            style={{ width: `${(stylusGas / maxGas) * 100}%` }}
                          >
                            <span className="text-[10px] font-medium text-white">{stylusGas.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="text-xs text-muted-foreground w-16">Solidity</span>
                        <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden relative">
                          <div 
                            className="h-full bg-gradient-to-r from-chart-4 to-chart-4/70 rounded-lg transition-all flex items-center justify-end pr-2"
                            style={{ width: `${(solidityGas / maxGas) * 100}%` }}
                          >
                            <span className="text-[10px] font-medium text-white">{solidityGas.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* When to use Stylus */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="group hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="font-serif">When Stylus Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span><strong>Compute-intensive operations</strong>: Cryptography, complex math, ZK proof verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span><strong>Memory operations</strong>: Large data processing, string manipulation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span><strong>Complex logic</strong>: State machines, parsing, validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span><strong>Rust ecosystem</strong>: Reuse existing Rust libraries</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-serif">When Solidity Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span><strong>Storage-heavy contracts</strong>: EVM's SSTORE/SLOAD are highly optimized</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span><strong>Simple CRUD operations</strong>: Basic mappings, struct storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span><strong>Token contracts</strong>: ERC-20, ERC-721 standard implementations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span><strong>Ecosystem tooling</strong>: More auditors, better tooling support</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Contract Links */}
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Verified Contracts</h3>
                <p className="text-sm text-muted-foreground">
                  View the deployed contracts on Arbiscan
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://sepolia.arbiscan.io/address/${data.stylusAddress}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Stylus Contract
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                {hasSolidityContract && (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={`https://sepolia.arbiscan.io/address/${data.solidityAddress}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Solidity Contract
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            Benchmark run on {new Date(data.timestamp).toLocaleDateString()} • {data.network} • {data.methodology}
          </p>
        </div>
      </div>
    </div>
  );
}
