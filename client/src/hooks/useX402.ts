/**
 * useX402 Hook
 * 
 * Handles X402 Payment Required responses automatically using MetaMask.
 * Based on x402 protocol: https://github.com/hummusonrails/x402-demo-arbitrum
 * 
 * When a request returns 402, this hook:
 * 1. Parses the payment requirements
 * 2. Sends payments to recipients via MetaMask
 * 3. Retries the original request with X-PAYMENT header
 */

import { useState, useCallback } from 'react';
import { useMetaMaskContext } from '@/components/metamask-provider';
import { parseEther, getAddress, formatEther } from 'ethers';

interface X402PaymentRequirement {
  version: string;
  paymentId: string;
  network: string;
  chainId: number;
  currency: string;
  amount: string;
  recipients: Array<{
    address: string;
    amount: string;
    description?: string;
  }>;
  expiresAt: string;
  instructions: string;
}

interface X402Response {
  error: string;
  code: string;
  x402: X402PaymentRequirement;
}

interface X402FetchOptions extends RequestInit {
  onPaymentRequired?: (requirement: X402PaymentRequirement) => void;
  onPaymentSent?: (txHashes: string[]) => void;
  onPaymentVerified?: () => void;
  skipPayment?: boolean;
}

interface X402State {
  isProcessing: boolean;
  currentPayment: X402PaymentRequirement | null;
  txHashes: string[];
  error: string | null;
}

export function useX402() {
  const { account, getSigner, switchToArbitrumSepolia, isConnected } = useMetaMaskContext();
  const [state, setState] = useState<X402State>({
    isProcessing: false,
    currentPayment: null,
    txHashes: [],
    error: null,
  });

  /**
   * Send payments to all recipients using MetaMask
   * Simplified: Send a SINGLE transaction with total amount to first recipient
   * This avoids MetaMask nonce/timing issues with multiple consecutive txs
   */
  const sendPayments = useCallback(async (
    requirement: X402PaymentRequirement
  ): Promise<string[]> => {
    if (!isConnected || !account) {
      throw new Error('MetaMask not connected. Please connect your wallet.');
    }

    console.log(`X402: Wallet address: ${account}`);
    console.log(`X402: Total payment: ${requirement.amount} ETH`);

    // Switch to correct chain if needed
    if (requirement.chainId === 421614) {
      try {
        console.log(`X402: Switching to Arbitrum Sepolia...`);
        await switchToArbitrumSepolia();
        console.log(`X402: Chain switch successful`);
      } catch (switchError: any) {
        console.error('X402: Chain switch error:', switchError);
        throw new Error('Please switch to Arbitrum Sepolia network in MetaMask');
      }
    }

    // Small delay to ensure chain switch is complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const signer = await getSigner();
    if (!signer) {
      throw new Error('Could not get signer from MetaMask');
    }
    
    const provider = signer.provider;
    if (!provider) {
      throw new Error('Could not get provider from signer');
    }

    // Check wallet balance before sending
    const totalValueWei = parseEther(requirement.amount);
    const balance = await provider.getBalance(account);
    const gasEstimate = BigInt(25000) * BigInt(20000000000); // ~25k gas * 20 gwei = ~0.0005 ETH buffer
    const totalNeeded = totalValueWei + gasEstimate;
    
    console.log(`X402: Wallet balance: ${formatEther(balance)} ETH`);
    console.log(`X402: Payment amount: ${requirement.amount} ETH`);
    console.log(`X402: Estimated gas buffer: ${formatEther(gasEstimate)} ETH`);
    
    if (balance < totalNeeded) {
      throw new Error(`Insufficient balance. You have ${formatEther(balance)} ETH but need approximately ${formatEther(totalNeeded)} ETH (payment + gas). Get test ETH from: https://www.alchemy.com/faucets/arbitrum-sepolia`);
    }

    // Send a SINGLE payment with the total amount
    // For simplicity (and to avoid MetaMask issues), combine all payments into one
    const recipient = requirement.recipients[0]; // Use first recipient
    
    // Normalize address to proper checksum format
    let toAddress: string;
    try {
      toAddress = getAddress(recipient.address);
    } catch {
      // If checksum fails, use lowercase (ethers accepts it)
      toAddress = recipient.address.toLowerCase();
    }
    
    console.log(`X402: Sending ${requirement.amount} ETH to ${toAddress}`);
    
    // Retry logic for transient errors
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`X402: Attempt ${attempt}/${maxRetries}...`);
        
        // Get fresh nonce to avoid nonce issues
        const nonce = await signer.getNonce();
        console.log(`X402: Using nonce: ${nonce}`);
        
        // Send transaction with explicit nonce
        const tx = await signer.sendTransaction({
          to: toAddress,
          value: totalValueWei,
          nonce: nonce,
          // Let MetaMask estimate gas
        });

        console.log(`X402: Payment sent: ${tx.hash}`);
        console.log(`X402: View on explorer: https://sepolia.arbiscan.io/tx/${tx.hash}`);
        
        // Wait for confirmation (with timeout)
        console.log(`X402: Waiting for confirmation...`);
        try {
          await Promise.race([
            tx.wait(1),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Confirmation timeout')), 30000)
            )
          ]);
          console.log(`✅ X402: Payment confirmed on-chain!`);
        } catch (waitError: any) {
          // If timeout, still proceed - transaction is sent
          if (waitError.message === 'Confirmation timeout') {
            console.warn(`⚠️ X402: Confirmation timeout, but transaction is sent. Proceeding...`);
          } else {
            throw waitError;
          }
        }
        
        return [tx.hash];
      } catch (txError: any) {
        lastError = txError;
        console.error(`X402: Attempt ${attempt} failed:`, txError.message || txError);
        
        // Don't retry user rejections
        if (txError.code === 'ACTION_REJECTED' || txError.code === 4001) {
          throw new Error('Transaction cancelled by user');
        }
        
        // Don't retry insufficient funds
        if (txError.message?.includes('insufficient funds') || txError.message?.includes('insufficient balance')) {
          throw new Error('Insufficient ETH for gas fees. You need ETH for: payment amount + gas fees. Get test ETH from: https://www.alchemy.com/faucets/arbitrum-sepolia');
        }
        
        // For Internal JSON-RPC errors, retry after a delay
        if (txError.message?.includes('Internal JSON-RPC error') || txError.message?.includes('could not coalesce')) {
          if (attempt < maxRetries) {
            const delay = attempt * 2000; // 2s, 4s, 6s
            console.log(`X402: Retrying in ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For nonce errors, retry immediately
        if (txError.message?.includes('nonce') || txError.message?.includes('replacement')) {
          if (attempt < maxRetries) {
            console.log(`X402: Nonce issue, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // Unknown error - don't retry
        break;
      }
    }
    
    // All retries exhausted
    const errorMsg = lastError?.shortMessage || lastError?.message || 'Transaction failed after multiple attempts';
    throw new Error(`Payment failed: ${errorMsg}. Please try again or check MetaMask for pending transactions.`);
  }, [account, isConnected, getSigner, switchToArbitrumSepolia]);

  /**
   * Create X-PAYMENT header value
   */
  const createPaymentHeader = useCallback((
    paymentId: string,
    txHashes: string[],
    payer: string
  ): string => {
    const payload = {
      paymentId,
      txHashes,
      payer,
    };
    // Base64 encode for header
    return btoa(JSON.stringify(payload));
  }, []);

  /**
   * X402-aware fetch function
   * Automatically handles 402 responses by making payments and retrying
   */
  const x402Fetch = useCallback(async (
    url: string,
    options: X402FetchOptions = {}
  ): Promise<Response> => {
    const { 
      onPaymentRequired, 
      onPaymentSent, 
      onPaymentVerified,
      skipPayment,
      ...fetchOptions 
    } = options;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Make initial request
      const response = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
      });

      // If not 402, return response as-is
      if (response.status !== 402) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return response;
      }

      // Parse 402 response
      const errorBody: X402Response = await response.json();
      
      if (!errorBody.x402) {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          error: 'Invalid 402 response - missing x402 data',
        }));
        throw new Error('Invalid 402 response');
      }

      const requirement = errorBody.x402;
      setState(prev => ({ ...prev, currentPayment: requirement }));
      
      // Callback for UI
      onPaymentRequired?.(requirement);

      // If skipPayment is true, return the 402 response
      if (skipPayment) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return new Response(JSON.stringify(errorBody), {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if payment is expired
      if (new Date(requirement.expiresAt) < new Date()) {
        throw new Error('Payment request expired');
      }

      // Send payments via MetaMask
      console.log(`X402: Sending payments for ${requirement.paymentId}...`);
      const txHashes = await sendPayments(requirement);
      
      setState(prev => ({ ...prev, txHashes }));
      onPaymentSent?.(txHashes);

      if (!account) {
        throw new Error('Wallet disconnected during payment');
      }

      // Create X-PAYMENT header
      const paymentHeader = createPaymentHeader(
        requirement.paymentId,
        txHashes,
        account
      );

      // Retry request with payment header
      console.log(`🔄 X402: Retrying request with X-PAYMENT header...`);
      console.log(`   Payment ID: ${requirement.paymentId}`);
      console.log(`   TX Hashes: ${txHashes.join(', ')}`);
      console.log(`   Payer: ${account}`);
      
      const retryResponse = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
        headers: {
          ...fetchOptions.headers,
          'X-PAYMENT': paymentHeader,
        },
      });

      if (retryResponse.ok) {
        console.log(`✅ X402: Payment VERIFIED by server! Status: ${retryResponse.status}`);
        onPaymentVerified?.();
      } else {
        const errorText = await retryResponse.text();
        console.error(`❌ X402: Server rejected payment verification:`, retryResponse.status);
        console.error(`   Error:`, errorText);
      }

      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        currentPayment: null,
      }));

      return retryResponse;
    } catch (error: any) {
      console.error('X402 error:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: error.message || 'Payment failed',
      }));
      throw error;
    }
  }, [sendPayments, createPaymentHeader, account]);

  /**
   * Check if a response is a 402 Payment Required
   */
  const isPaymentRequired = useCallback((response: Response): boolean => {
    return response.status === 402;
  }, []);

  /**
   * Parse a 402 response to get payment requirements
   */
  const parsePaymentRequirement = useCallback(async (
    response: Response
  ): Promise<X402PaymentRequirement | null> => {
    if (response.status !== 402) return null;
    
    try {
      const body = await response.json();
      return body.x402 || null;
    } catch {
      return null;
    }
  }, []);

  return {
    // State
    isProcessing: state.isProcessing,
    currentPayment: state.currentPayment,
    txHashes: state.txHashes,
    error: state.error,
    
    // Functions
    x402Fetch,
    sendPayments,
    createPaymentHeader,
    isPaymentRequired,
    parsePaymentRequirement,
    
    // Wallet info
    walletAddress: account,
    isConnected,
  };
}

/**
 * Type guard for X402 response
 */
export function isX402Response(data: any): data is X402Response {
  return data && data.x402 && typeof data.x402.paymentId === 'string';
}
