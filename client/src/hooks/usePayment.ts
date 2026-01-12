/**
 * usePayment Hook
 * 
 * Simplified payment hook using MetaMask directly.
 * Replaces Privy-based payment system.
 */

import { useCallback } from 'react';
import { useMetaMaskContext } from '@/components/metamask-provider';
import { parseEther } from 'ethers';

// Payment amount per agent (0.00005 ETH)
export const PAYMENT_PER_AGENT = '0.00005';
export const PAYMENT_PER_PREDICTION = '0.00005'; // Simplified for testing

interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface AgentPayment {
  agentId: string;
  walletAddress: string;
  amount: string;
}

export function usePayment() {
  const { 
    account, 
    balance, 
    isConnected, 
    getSigner,
    refreshBalance,
  } = useMetaMaskContext();

  // Check if user has enough balance for a prediction
  const hasEnoughBalance = useCallback(async () => {
    if (!balance) return false;
    const requiredAmount = parseFloat(PAYMENT_PER_PREDICTION);
    const availableAmount = parseFloat(balance);
    return availableAmount >= requiredAmount;
  }, [balance]);

  // Send payment to a single agent
  const sendPaymentToAgent = useCallback(async (
    toAddress: string,
    amount: string = PAYMENT_PER_AGENT
  ): Promise<PaymentResult> => {
    if (!isConnected || !account) {
      return { success: false, error: 'MetaMask not connected' };
    }

    try {
      const signer = await getSigner();
      if (!signer) {
        return { success: false, error: 'Could not get signer' };
      }

      const tx = await signer.sendTransaction({
        to: toAddress,
        value: parseEther(amount),
      });

      console.log(`Payment sent to ${toAddress}: ${tx.hash}`);
      
      // Refresh balance after payment
      await refreshBalance();
      
      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error('Payment error:', error);
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        return { success: false, error: 'Transaction cancelled by user' };
      }
      
      return { 
        success: false, 
        error: error.message || 'Transaction failed' 
      };
    }
  }, [account, isConnected, getSigner, refreshBalance]);

  // Pay multiple agents for a prediction
  const payForPrediction = useCallback(async (
    agents: AgentPayment[]
  ): Promise<{ success: boolean; results: PaymentResult[]; totalPaid: string }> => {
    const results: PaymentResult[] = [];
    let successCount = 0;

    // Check balance first
    const hasBalance = await hasEnoughBalance();
    if (!hasBalance) {
      return {
        success: false,
        results: [{ success: false, error: 'Insufficient balance' }],
        totalPaid: '0',
      };
    }

    // Pay each agent
    for (const agent of agents) {
      if (!agent.walletAddress) {
        results.push({ 
          success: false, 
          error: `Agent ${agent.agentId} has no payment wallet` 
        });
        continue;
      }

      const result = await sendPaymentToAgent(agent.walletAddress, agent.amount);
      results.push(result);
      
      if (result.success) {
        successCount++;
      }
    }

    const totalPaid = (successCount * parseFloat(PAYMENT_PER_AGENT)).toFixed(6);

    return {
      success: successCount === agents.length,
      results,
      totalPaid,
    };
  }, [hasEnoughBalance, sendPaymentToAgent]);

  return {
    // Wallet state
    walletAddress: account,
    balance,
    isWalletReady: isConnected,
    
    // Actions
    fetchBalance: refreshBalance,
    hasEnoughBalance,
    sendPaymentToAgent,
    payForPrediction,
    
    // Constants
    PAYMENT_PER_AGENT,
    PAYMENT_PER_PREDICTION,
  };
}
