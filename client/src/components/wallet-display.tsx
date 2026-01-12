import { useEffect } from 'react';
import { useMetaMaskContext } from '@/components/metamask-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Payment amount per prediction (2 agents)
const PAYMENT_PER_PREDICTION = '0.0002';
const PAYMENT_PER_AGENT = '0.0001';

export function WalletDisplay() {
  const { 
    account, 
    balance, 
    isConnected, 
    refreshBalance,
    chainId,
  } = useMetaMaskContext();
  const { toast } = useToast();

  // Fetch balance on mount and periodically
  useEffect(() => {
    if (isConnected) {
      refreshBalance();
    }
  }, [isConnected, refreshBalance]);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast({
        title: 'Address copied!',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const openFaucet = () => {
    window.open('https://faucet.quicknode.com/arbitrum/sepolia', '_blank');
  };

  const openExplorer = () => {
    if (account) {
      window.open(`https://sepolia.arbiscan.io/address/${account}`, '_blank');
    }
  };

  if (!isConnected || !account) {
    return null;
  }

  const balanceNum = parseFloat(balance || '0');
  const predictionsAvailable = Math.floor(balanceNum / parseFloat(PAYMENT_PER_PREDICTION));
  const isLowBalance = balanceNum < parseFloat(PAYMENT_PER_PREDICTION);
  const isWrongNetwork = chainId !== 421614;

  return (
    <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Wallet Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={copyAddress}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={openExplorer}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold">
                  {balance ? parseFloat(balance).toFixed(6) : '0'} ETH
                </span>
                <Badge variant={isLowBalance ? "destructive" : "secondary"} className="text-xs">
                  {isLowBalance ? 'Low balance' : `~${predictionsAvailable} predictions`}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshBalance}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openFaucet}
              className="text-xs"
            >
              Get Test ETH
            </Button>
          </div>
        </div>

        {/* Wrong network warning */}
        {isWrongNetwork && (
          <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
            <p>
              ⚠️ Please switch to Arbitrum Sepolia network in MetaMask
            </p>
          </div>
        )}

        {/* Low balance warning */}
        {!isWrongNetwork && isLowBalance && (
          <div className="mt-3 p-2 bg-destructive/10 rounded-lg text-sm text-destructive">
            <p>
              You need at least {PAYMENT_PER_PREDICTION} ETH to create a prediction.{' '}
              <button 
                onClick={openFaucet}
                className="underline font-medium"
              >
                Get free test ETH from the faucet
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export constants for other components
export { PAYMENT_PER_PREDICTION, PAYMENT_PER_AGENT };
