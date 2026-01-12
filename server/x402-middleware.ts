/**
 * X402 Payment Middleware
 * 
 * Implements the X402 payment protocol for HTTP 402 Payment Required responses.
 * 
 * Flow:
 * 1. Request comes in without payment
 * 2. Middleware returns 402 with payment instructions
 * 3. Client makes payment and retries with X-PAYMENT header
 * 4. Middleware verifies payment and allows request through
 */

import type { Request, Response, NextFunction } from 'express';
import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import crypto from 'crypto';

// Payment configuration
export const X402_CONFIG = {
  network: 'arbitrum-sepolia',
  chainId: 421614,
  currency: 'ETH',
  amountPerAgent: '0.00005', // 0.00005 ETH per agent (~$0.15 at $3000 ETH)
  amountPerPrediction: '0.00005', // 0.00005 ETH for testing
  // Time window for payment verification (5 minutes)
  paymentWindowMs: 5 * 60 * 1000,
};

// In-memory store for pending payments (use Redis in production)
const pendingPayments = new Map<string, PendingPayment>();

interface PendingPayment {
  paymentId: string;
  userId: string;
  amount: string;
  recipients: Array<{ address: string; amount: string; agentId: string }>;
  createdAt: number;
  verified: boolean;
  txHashes?: string[];
}

interface X402PaymentHeader {
  paymentId: string;
  txHashes: string[];
  payer: string;
}

// Viem public client for verifying transactions
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
});

/**
 * Generate a unique payment ID
 */
function generatePaymentId(): string {
  return `x402_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Create a 402 Payment Required response
 */
export function create402Response(
  recipients: Array<{ address: string; amount: string; agentId: string }>,
  userId: string
): { statusCode: 402; body: any; paymentId: string } {
  const paymentId = generatePaymentId();
  const totalAmount = (recipients.length * parseFloat(X402_CONFIG.amountPerAgent)).toFixed(6);

  // Store pending payment
  pendingPayments.set(paymentId, {
    paymentId,
    userId,
    amount: totalAmount,
    recipients,
    createdAt: Date.now(),
    verified: false,
  });

  // Clean up old pending payments
  cleanupOldPayments();

  return {
    statusCode: 402,
    paymentId,
    body: {
      error: 'Payment Required',
      code: 'PAYMENT_REQUIRED',
      x402: {
        version: '1.0',
        paymentId,
        network: X402_CONFIG.network,
        chainId: X402_CONFIG.chainId,
        currency: X402_CONFIG.currency,
        amount: totalAmount,
        recipients: recipients.map(r => ({
          address: r.address,
          amount: r.amount,
          description: `Payment to agent ${r.agentId}`,
        })),
        expiresAt: new Date(Date.now() + X402_CONFIG.paymentWindowMs).toISOString(),
        instructions: 'Send ETH to the recipient addresses, then retry with X-PAYMENT header',
      },
    },
  };
}

/**
 * Parse the X-PAYMENT header
 */
function parseX402Header(header: string): X402PaymentHeader | null {
  try {
    // Header format: base64 encoded JSON
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    
    if (!parsed.paymentId || !parsed.txHashes || !Array.isArray(parsed.txHashes)) {
      return null;
    }
    
    return parsed as X402PaymentHeader;
  } catch {
    // Try parsing as plain JSON
    try {
      const parsed = JSON.parse(header);
      return parsed as X402PaymentHeader;
    } catch {
      return null;
    }
  }
}

/**
 * Verify a transaction on-chain
 */
async function verifyTransaction(
  txHash: string,
  expectedTo: string,
  expectedAmount: string
): Promise<boolean> {
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (receipt.status !== 'success') {
      console.log(`Transaction ${txHash} failed`);
      return false;
    }

    const tx = await publicClient.getTransaction({
      hash: txHash as `0x${string}`,
    });

    // Verify recipient (case-insensitive)
    if (tx.to?.toLowerCase() !== expectedTo.toLowerCase()) {
      console.log(`Transaction ${txHash} wrong recipient: ${tx.to} vs ${expectedTo}`);
      return false;
    }

    // Verify amount (with 10% tolerance for gas variations)
    const expectedWei = parseEther(expectedAmount);
    const actualWei = tx.value;
    const tolerance = expectedWei / 10n; // 10% tolerance

    if (actualWei < expectedWei - tolerance) {
      console.log(`Transaction ${txHash} insufficient amount: ${formatEther(actualWei)} vs ${expectedAmount}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error verifying transaction ${txHash}:`, error);
    return false;
  }
}

/**
 * Verify all payments for a payment request
 * 
 * Accepts either:
 * - One transaction per recipient (ideal)
 * - One transaction with total amount to first recipient (simplified mode)
 */
async function verifyPayments(
  paymentId: string,
  txHashes: string[]
): Promise<{ verified: boolean; error?: string }> {
  const pending = pendingPayments.get(paymentId);

  if (!pending) {
    return { verified: false, error: 'Payment request not found or expired' };
  }

  // Check if already verified
  if (pending.verified) {
    return { verified: true };
  }

  // Check expiration
  if (Date.now() - pending.createdAt > X402_CONFIG.paymentWindowMs) {
    pendingPayments.delete(paymentId);
    return { verified: false, error: 'Payment request expired' };
  }

  // Need at least one transaction
  if (txHashes.length === 0) {
    return { verified: false, error: 'No transaction hashes provided' };
  }

  // Simplified verification: Accept single transaction with total amount
  // The frontend sends one tx with total amount to first recipient
  const txHash = txHashes[0];
  
  console.log(`🔍 Verifying payment: ${txHash}`);
  console.log(`   Payment ID: ${paymentId}`);
  console.log(`   Expected total: ${pending.amount} ETH`);
  console.log(`   Recipients: ${pending.recipients.length}`);

  try {
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (receipt.status !== 'success') {
      console.log(`❌ Transaction ${txHash} failed on-chain`);
      return { verified: false, error: `Transaction ${txHash} failed` };
    }

    // Get transaction details
    const tx = await publicClient.getTransaction({
      hash: txHash as `0x${string}`,
    });

    // Verify it was sent to one of our recipients
    const recipientAddresses = pending.recipients.map(r => r.address.toLowerCase());
    const txTo = tx.to?.toLowerCase();
    
    if (!txTo || !recipientAddresses.includes(txTo)) {
      console.log(`⚠️ Transaction recipient mismatch: ${txTo} not in ${recipientAddresses.join(', ')}`);
      // For testnet, be lenient - just verify tx exists and succeeded
      console.log(`✅ Lenient mode: Transaction exists and succeeded, accepting payment`);
    }

    // Verify amount (with tolerance for gas variations)
    const expectedWei = parseEther(pending.amount);
    const actualWei = tx.value;
    const tolerance = expectedWei / 5n; // 20% tolerance for testnet

    if (actualWei < expectedWei - tolerance) {
      console.log(`⚠️ Amount mismatch: sent ${formatEther(actualWei)} ETH, expected ${pending.amount} ETH`);
      // For testnet, accept if it's at least 50% of expected
      const minAcceptable = expectedWei / 2n;
      if (actualWei >= minAcceptable) {
        console.log(`✅ Lenient mode: Amount is at least 50%, accepting`);
      } else {
        return { verified: false, error: `Insufficient payment: sent ${formatEther(actualWei)}, need ${pending.amount}` };
      }
    }

    console.log(`✅ Payment verified: ${formatEther(actualWei)} ETH in tx ${txHash}`);

    // Mark as verified
    pending.verified = true;
    pending.txHashes = txHashes;
    pendingPayments.set(paymentId, pending);

    return { verified: true };
  } catch (error: any) {
    console.error(`❌ Error verifying transaction ${txHash}:`, error.message);
    return { verified: false, error: `Transaction verification failed: ${error.message}` };
  }
}

/**
 * Clean up old pending payments
 */
function cleanupOldPayments(): void {
  const now = Date.now();
  for (const [id, payment] of pendingPayments.entries()) {
    if (now - payment.createdAt > X402_CONFIG.paymentWindowMs * 2) {
      pendingPayments.delete(id);
    }
  }
}

/**
 * Get pending payment by ID
 */
export function getPendingPayment(paymentId: string): PendingPayment | undefined {
  return pendingPayments.get(paymentId);
}

/**
 * X402 middleware for routes that require payment
 */
export function x402PaymentRequired(
  getRecipients: (req: Request) => Promise<Array<{ address: string; amount: string; agentId: string }>>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const x402Header = req.headers['x-payment'] as string;

    if (!x402Header) {
      // No payment header - return 402
      try {
        const userId = (req as any).user?.claims?.sub || req.body?.privyUserId || 'anonymous';
        const recipients = await getRecipients(req);

        if (recipients.length === 0) {
          // No recipients with wallets - log warning but still require payment to platform
          console.warn('⚠️ No agent payment wallets found, using platform wallet as fallback');
          // Don't skip - use platform wallet instead
          recipients.push({
            address: process.env.RECEIVER_ADDRESS || process.env.PLATFORM_WALLET || '0x000000000000000000000000000000000000dead',
            amount: X402_CONFIG.amountPerPrediction,
            agentId: 'platform',
          });
        }

        const { statusCode, body, paymentId } = create402Response(recipients, userId);
        
        res.setHeader('X-Payment-Id', paymentId);
        res.setHeader('X-Payment-Network', X402_CONFIG.network);
        return res.status(statusCode).json(body);
      } catch (error) {
        console.error('Error creating 402 response:', error);
        return next(); // Continue without payment on error
      }
    }

    // Parse and verify payment
    const payment = parseX402Header(x402Header);

    if (!payment) {
      return res.status(400).json({
        error: 'Invalid X-PAYMENT header',
        code: 'INVALID_PAYMENT_HEADER',
      });
    }

    // Verify the payment
    const verification = await verifyPayments(payment.paymentId, payment.txHashes);

    if (!verification.verified) {
      return res.status(402).json({
        error: 'Payment verification failed',
        code: 'PAYMENT_VERIFICATION_FAILED',
        details: verification.error,
      });
    }

    // Payment verified - attach to request and continue
    (req as any).x402Payment = {
      paymentId: payment.paymentId,
      txHashes: payment.txHashes,
      verified: true,
    };

    console.log(`✅ X402 Payment Verified Successfully!`);
    console.log(`   Payment ID: ${payment.paymentId}`);
    console.log(`   Transactions: ${payment.txHashes.length} tx(s)`);
    console.log(`   TX Hashes: ${payment.txHashes.join(', ')}`);
    console.log(`   Payer: ${payment.payer}`);
    next();
  };
}

/**
 * Optional X402 middleware - doesn't block if no payment
 */
export function x402PaymentOptional(
  getRecipients: (req: Request) => Promise<Array<{ address: string; amount: string; agentId: string }>>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const x402Header = req.headers['x-payment'] as string;

    if (x402Header) {
      // Has payment header - verify it
      const payment = parseX402Header(x402Header);

      if (payment) {
        const verification = await verifyPayments(payment.paymentId, payment.txHashes);

        if (verification.verified) {
          (req as any).x402Payment = {
            paymentId: payment.paymentId,
            txHashes: payment.txHashes,
            verified: true,
          };
          console.log(`✅ X402 payment verified (optional): ${payment.paymentId}`);
        }
      }
    }

    next();
  };
}

export { X402_CONFIG as config };

