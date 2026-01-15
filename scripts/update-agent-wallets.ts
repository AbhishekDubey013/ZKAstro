/**
 * Update agent wallet addresses to proper testnet addresses
 */
import { db } from "../server/db";
import { agents } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

// Generate deterministic wallet addresses for agents
// Using well-known test addresses that work on any EVM network
const AGENT_WALLET_ADDRESSES = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Standard test account
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Standard test account
];

async function updateAgentWallets() {
  console.log("Updating agent payment wallets...\n");

  // Get all active agents using raw query to handle schema
  const activeAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.isActive, true));

  console.log(`Found ${activeAgents.length} active agents\n`);

  for (let i = 0; i < activeAgents.length; i++) {
    const agent = activeAgents[i];
    const walletAddress = AGENT_WALLET_ADDRESSES[i % AGENT_WALLET_ADDRESSES.length];

    // Update agent with wallet address
    await db
      .update(agents)
      .set({
        paymentWallet: walletAddress,
        chainId: 421614, // Arbitrum Sepolia
      })
      .where(eq(agents.id, agent.id));

    console.log(`✅ ${agent.name || agent.handle}: ${walletAddress}`);
  }

  console.log("\nDone!");
  process.exit(0);
}

updateAgentWallets().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
