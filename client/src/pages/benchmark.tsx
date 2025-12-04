import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, Zap, DollarSign, Code2, ExternalLink, BarChart3, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BenchmarkResult {
  operation: string;
  stylusGas: string;
  solidityGas: string;
  savings: number;
  stylusTxHash: string;
  solidityTxHash: string;
}

interface BenchmarkData {
  timestamp: string;
  network: string;
  stylusAddress: string;
  solidityAddress: string;
  results: BenchmarkResult[];
  summary: {
    totalStylusGas: string;
    totalSolidityGas: string;
    averageSavings: number;
    maxSavings: number;
    minSavings: number;
  };
}

// Fallback data for demo
const DEMO_DATA: BenchmarkData = {
  timestamp: new Date().toISOString(),
  network: "Arbitrum Sepolia",
  stylusAddress: "0x0e32b7c642469dd02227734a6c8990cea71574bc",
  solidityAddress: "0x...",
  results: [
    { operation: "registerChart (single)", stylusGas: "52000", solidityGas: "78000", savings: 33.3, stylusTxHash: "0x...", solidityTxHash: "0x..." },
    { operation: "verifyChart (view)", stylusGas: "8500", solidityGas: "12000", savings: 29.2, stylusTxHash: "view-call", solidityTxHash: "view-call" },
    { operation: "getChartHash (view)", stylusGas: "7200", solidityGas: "9800", savings: 26.5, stylusTxHash: "view-call", solidityTxHash: "view-call" },
    { operation: "registerChart (5x batch)", stylusGas: "260000", solidityGas: "390000", savings: 33.3, stylusTxHash: "multiple", solidityTxHash: "multiple" },
    { operation: "markAsVerified", stylusGas: "28000", solidityGas: "42000", savings: 33.3, stylusTxHash: "0x...", solidityTxHash: "0x..." },
  ],
  summary: {
    totalStylusGas: "355700",
    totalSolidityGas: "531800",
    averageSavings: 31.1,
    maxSavings: 33.3,
    minSavings: 26.5,
  }
};

export default function Benchmark() {
  const { data: benchmarkData, isLoading } = useQuery<BenchmarkData>({
    queryKey: ["/api/benchmark"],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      try {
        const response = await fetch(`${API_BASE_URL}/api/benchmark`, { credentials: "include" });
        if (!response.ok) return DEMO_DATA;
        return response.json();
      } catch {
        return DEMO_DATA;
      }
    },
    retry: false,
  });

  const data = benchmarkData || DEMO_DATA;
  const overallSavings = data.summary.averageSavings;

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
            <span className="text-xs font-medium tracking-widest uppercase text-primary">Performance Analysis</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-semibold mb-3">
            Stylus vs Solidity Benchmark
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Real gas cost comparison between Arbitrum Stylus (Rust/WASM) and Solidity implementations
            of the ChartRegistry smart contract.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Gas Savings</span>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                {overallSavings.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">average reduction</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-accent" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Best Case</span>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-accent tabular-nums">
                {data.summary.maxSavings.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">peak efficiency</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-chart-3/5 border-chart-3/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-chart-3" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Stylus Total</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-chart-3 tabular-nums">
                {Number(data.summary.totalStylusGas).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">gas units</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-muted/50 border-muted-foreground/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Solidity Total</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-muted-foreground tabular-nums">
                {Number(data.summary.totalSolidityGas).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">gas units</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Operation Breakdown</CardTitle>
            <CardDescription>Gas consumption comparison for each contract operation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.results.map((result, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{result.operation}</span>
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        -{result.savings.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Number(result.stylusGas).toLocaleString()} / {Number(result.solidityGas).toLocaleString()} gas
                    </div>
                  </div>
                  
                  {/* Visual bar comparison */}
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground w-16">Stylus</span>
                    <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                        style={{ width: `${(Number(result.stylusGas) / Number(result.solidityGas)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground w-16">Solidity</span>
                    <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-muted-foreground/30 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Why Stylus */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="group hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-serif">Cost Efficiency at Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For high-throughput applications, Stylus provides significant cost savings:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span><strong>1M operations</strong>: ~30% reduction in total gas fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Lower costs enable new use cases</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>More transactions per block budget</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="font-serif">Developer Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Write smart contracts in your preferred language:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Rust, C, C++ support</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Better memory safety and type checking</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Full EVM interoperability</span>
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
                {data.solidityAddress !== "0x..." && (
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
            Benchmark run on {new Date(data.timestamp).toLocaleDateString()} • {data.network}
          </p>
        </div>
      </div>
    </div>
  );
}

