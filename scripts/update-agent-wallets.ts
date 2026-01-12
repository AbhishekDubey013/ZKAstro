/**
 * Update Agent Wallets Script
 * 
 * Updates existing agents in the database with their payment wallet addresses.
 * Run this after setting AURIGA_WALLET_ADDRESS and NOVA_WALLET_ADDRESS in .env
 * 
 * Usage: npx tsx --env-file=.env scripts/update-agent-wallets.ts
 */

import { db } from '../server/db';
import { agents } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function updateAgentWallets() {
  console.log('🔧 Updating agent wallets...\n');

  // Get wallet addresses from environment
  const aurigaWallet = process.env.AURIGA_WALLET_ADDRESS?.toLowerCase();
  const novaWallet = process.env.NOVA_WALLET_ADDRESS?.toLowerCase();

  if (!aurigaWallet && !novaWallet) {
    console.error('❌ No agent wallet addresses found in environment!');
    console.log('\nPlease set the following in your .env file:');
    console.log('  AURIGA_WALLET_ADDRESS=0x...');
    console.log('  NOVA_WALLET_ADDRESS=0x...');
    process.exit(1);
  }

  const results: Array<{ handle: string; wallet: string | null; status: string }> = [];

  // Update @auriga
  if (aurigaWallet) {
    try {
      const [updated] = await db
        .update(agents)
        .set({ paymentWallet: aurigaWallet })
        .where(eq(agents.handle, '@auriga'))
        .returning();
      
      if (updated) {
        results.push({ handle: '@auriga', wallet: aurigaWallet, status: '✅ Updated' });
      } else {
        results.push({ handle: '@auriga', wallet: aurigaWallet, status: '⚠️ Not found in DB' });
      }
    } catch (error: any) {
      results.push({ handle: '@auriga', wallet: aurigaWallet, status: `❌ Error: ${error.message}` });
    }
  } else {
    results.push({ handle: '@auriga', wallet: null, status: '⏭️ Skipped (no wallet set)' });
  }

  // Update @nova
  if (novaWallet) {
    try {
      const [updated] = await db
        .update(agents)
        .set({ paymentWallet: novaWallet })
        .where(eq(agents.handle, '@nova'))
        .returning();
      
      if (updated) {
        results.push({ handle: '@nova', wallet: novaWallet, status: '✅ Updated' });
      } else {
        results.push({ handle: '@nova', wallet: novaWallet, status: '⚠️ Not found in DB' });
      }
    } catch (error: any) {
      results.push({ handle: '@nova', wallet: novaWallet, status: `❌ Error: ${error.message}` });
    }
  } else {
    results.push({ handle: '@nova', wallet: null, status: '⏭️ Skipped (no wallet set)' });
  }

  // Print results
  console.log('Results:\n');
  console.log('┌─────────────┬──────────────────────────────────────────────┬────────────────────────────┐');
  console.log('│ Agent       │ Wallet Address                               │ Status                     │');
  console.log('├─────────────┼──────────────────────────────────────────────┼────────────────────────────┤');
  
  for (const r of results) {
    const handlePad = r.handle.padEnd(11);
    const walletPad = (r.wallet || 'N/A').padEnd(44);
    const statusPad = r.status.padEnd(26);
    console.log(`│ ${handlePad} │ ${walletPad} │ ${statusPad} │`);
  }
  
  console.log('└─────────────┴──────────────────────────────────────────────┴────────────────────────────┘');

  // Verify updates
  console.log('\n📋 Current agent wallet status:\n');
  
  const allAgents = await db.select().from(agents);
  
  for (const agent of allAgents) {
    const walletStatus = agent.paymentWallet 
      ? `💰 ${agent.paymentWallet}`
      : '⚠️ No wallet configured (will use platform wallet)';
    console.log(`  ${agent.handle}: ${walletStatus}`);
  }

  console.log('\n✅ Done!');
  console.log('\nℹ️  x402 payments will now route directly to agent wallets.');
  console.log('   Agents without wallets will have payments go to PLATFORM_WALLET or RECEIVER_ADDRESS.');
}

updateAgentWallets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
