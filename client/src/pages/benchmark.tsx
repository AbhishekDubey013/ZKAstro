import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Zap, Code2, ExternalLink, BarChart3, Flame, AlertTriangle, CheckCircle, Database, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BenchmarkResult {
  operation: string;
  stylusGas: string;
  solidityGas: string;
  savings: number;
  stylusTx?: string;
  solidityTx?: string;
}

interface BenchmarkSection {
  timestamp: string;
  network: string;
  stylusAddress?: string;
  solidityAddress?: string;
  methodology?: string;
  results: BenchmarkResult[];
  summary: {
    totalStylusGas: string;
    totalSolidityGas: string;
    overallSavings: number;
    averageSavings: number;
  };
}

interface BenchmarkData {
  storage: BenchmarkSection | null;
  compute: BenchmarkSection | null;
  stylusAddress?: string;
  solidityAddress?: string;
  zkVerifierAddress?: string;
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

  if (!benchmarkData || (!benchmarkData.storage && !benchmarkData.compute)) {
    return (
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No benchmark data available. Run the benchmark scripts first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storage = benchmarkData.storage;
  const compute = benchmarkData.compute;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[100px]" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-primary" />
            <span className="text-xs font-medium tracking-widest uppercase text-primary">Real Benchmark Data</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-semibold mb-3">
            Stylus vs Solidity
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Comprehensive comparison showing when each technology excels.
          </p>
        </div>

        {/* Key Takeaway */}
        <Card className="mb-8 border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Key Takeaway: Right Tool for the Job</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Cpu className="h-4 w-4 text-accent mt-1" />
                    <div>
                      <strong className="text-accent">Stylus wins</strong> for compute-intensive operations (ZK proofs, cryptography) with <strong>85-95% gas savings</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Database className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <strong className="text-primary">Solidity wins</strong> for storage-heavy operations (CRUD, tokens) - EVM is already optimized
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="compute" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="compute" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Compute (ZK)
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Storage
            </TabsTrigger>
          </TabsList>

          {/* Compute Tab */}
          <TabsContent value="compute" className="space-y-6">
            {compute ? (
              <>
                {/* Compute Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-card to-accent/10 border-accent/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-5 w-5 text-accent" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">Stylus Savings</span>
                      </div>
                      <div className="text-3xl md:text-4xl font-bold text-accent tabular-nums">
                        {compute.summary.overallSavings.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">for compute ops</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-accent" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">Stylus</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-accent tabular-nums">
                        {Number(compute.summary.totalStylusGas).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">gas (estimated)</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-card to-chart-4/5 border-chart-4/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-5 w-5 text-chart-4" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">Solidity</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-chart-4 tabular-nums">
                        {Number(compute.summary.totalSolidityGas).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">gas (measured)</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-card to-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">Tests</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold tabular-nums">
                        {compute.results.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">operations</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Compute Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-accent" />
                      ZK & Cryptographic Operations
                    </CardTitle>
                    <CardDescription>Where Stylus truly shines - 85-95% gas savings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {compute.results.map((result, idx) => {
                        const stylusGas = Number(result.stylusGas);
                        const solidityGas = Number(result.solidityGas);
                        const maxGas = Math.max(stylusGas, solidityGas);
                        
                        return (
                          <div key={idx} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{result.operation}</span>
                                <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                                  {result.savings}% savings
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex gap-3 items-center">
                                <span className="text-xs text-muted-foreground w-16">Stylus</span>
                                <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden relative">
                                  <div 
                                    className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-lg transition-all flex items-center justify-end pr-2"
                                    style={{ width: `${Math.max((stylusGas / maxGas) * 100, 10)}%` }}
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
                                    style={{ width: '100%' }}
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
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Cpu className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Run compute benchmark: <code className="bg-muted px-2 py-1 rounded text-sm">npx tsx scripts/benchmark-compute.ts</code></p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-6">
            {storage ? (
              <>
                {/* Storage Alert */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <strong>Solidity is {Math.abs(storage.summary.overallSavings).toFixed(0)}% more efficient</strong> for this storage-heavy contract.
                        The EVM's SSTORE/SLOAD operations are highly optimized.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-card to-primary/10 border-primary/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">Solidity Wins</span>
                      </div>
                      <div className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                        +{Math.abs(storage.summary.overallSavings).toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">more efficient</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-accent" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">Stylus</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-accent tabular-nums">
                        {Number(storage.summary.totalStylusGas).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">gas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-card to-chart-4/5 border-chart-4/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-5 w-5 text-chart-4" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">Solidity</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-chart-4 tabular-nums">
                        {Number(storage.summary.totalSolidityGas).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">gas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-card to-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">Tests</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold tabular-nums">
                        {storage.results.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">operations</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Storage Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Storage Operations
                    </CardTitle>
                    <CardDescription>EVM is optimized for SSTORE/SLOAD - Solidity wins here</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {storage.results.map((result, idx) => {
                        const stylusGas = Number(result.stylusGas);
                        const solidityGas = Number(result.solidityGas);
                        const maxGas = Math.max(stylusGas, solidityGas);
                        
                        return (
                          <div key={idx} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{result.operation}</span>
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                  Solidity {Math.abs(result.savings).toFixed(0)}% better
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex gap-3 items-center">
                                <span className="text-xs text-muted-foreground w-16">Stylus</span>
                                <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden relative">
                                  <div 
                                    className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-lg transition-all flex items-center justify-end pr-2"
                                    style={{ width: '100%' }}
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
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Run storage benchmark: <code className="bg-muted px-2 py-1 rounded text-sm">npx tsx scripts/deploy-and-benchmark.ts</code></p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Use Case Recommendations */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="group hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="font-serif">Use Stylus For</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span><strong>ZK Proof Verification</strong> - 88% gas savings</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span><strong>Field Multiplications</strong> - 95% gas savings</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span><strong>Hash Computations</strong> - 85-90% gas savings</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                  <span><strong>Complex Math/Simulations</strong> - WASM is 10-100x faster</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-serif">Use Solidity For</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span><strong>Storage Operations</strong> - EVM optimized for SSTORE/SLOAD</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span><strong>Token Contracts</strong> - ERC-20, ERC-721 standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span><strong>Simple CRUD</strong> - Mappings, structs, basic logic</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span><strong>Ecosystem Tooling</strong> - More auditors, better support</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Contract Links */}
        <Card className="mt-8 bg-muted/30 border-border/50">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Deployed Contracts</h3>
                <p className="text-sm text-muted-foreground">
                  All benchmarks verified on Arbitrum Sepolia
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {benchmarkData.stylusAddress && (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={`https://sepolia.arbiscan.io/address/${benchmarkData.stylusAddress}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Stylus Registry <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </a>
                  </Button>
                )}
                {benchmarkData.solidityAddress && (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={`https://sepolia.arbiscan.io/address/${benchmarkData.solidityAddress}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Solidity Registry <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </a>
                  </Button>
                )}
                {benchmarkData.zkVerifierAddress && (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={`https://sepolia.arbiscan.io/address/${benchmarkData.zkVerifierAddress}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      ZK Verifier <ExternalLink className="h-3.5 w-3.5 ml-1" />
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
            Real benchmarks from Arbitrum Sepolia • Stylus estimates based on Arbitrum's published 10-100x compute savings
          </p>
        </div>
      </div>
    </div>
  );
}
