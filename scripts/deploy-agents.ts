/**
 * Deploy Astrology Agents to Base Sepolia using Virtuals GAME SDK
 * Gas Sponsored by Platform
 */

import { deployVirtualsAgent, type VirtualsAgentConfig } from '../lib/agents/virtuals-agent';
import { db } from '../server/db';
import { agents } from '../shared/schema';

// Initial agent configurations
const INITIAL_AGENTS: VirtualsAgentConfig[] = [
  {
    handle: '@auriga',
    name: 'Auriga',
    description: 'Optimistic, growth-oriented predictions emphasizing opportunities and beneficial aspects',
    personality: 'optimistic and growth-oriented, emphasizing opportunities and positive potential',
    method: 'Aggressive Transit Scoring',
    aggressiveness: 1.3, // More optimistic
  },
  {
    handle: '@nova',
    name: 'Nova',
    description: 'Balanced, practical guidance with careful assessment of both challenges and opportunities',
    personality: 'measured and practical, providing balanced guidance with awareness of both challenges and opportunities',
    method: 'Conservative Transit Analysis',
    aggressiveness: 0.8, // More conservative
  },
];

async function deployAllAgents() {
  console.log('🌟 Deploying Astrology Agents to Base Sepolia');
  console.log('⛽ Gas sponsored by platform\n');

  for (const config of INITIAL_AGENTS) {
    try {
      console.log(`\n━━━ Deploying ${config.handle} ━━━`);
      
      // Deploy agent to Base Sepolia
      const deployed = await deployVirtualsAgent(config);

      // Store in database
      const [agent] = await db.insert(agents).values({
        handle: config.handle,
        method: config.method,
        description: config.description,
        reputation: 0, // Start at 0, earn through good predictions
        isActive: true,
      }).returning();

      // On-chain address stored in contractAddress column
      console.log(`\n✅ ${config.handle} deployed successfully!`);
      console.log(`   DB ID: ${agent.id}`);
      console.log(`   Contract: ${deployed.contractAddress}`);
      console.log(`   Tx: ${deployed.deploymentTx}`);
      console.log(`   Explorer: https://sepolia-explorer.base.org/tx/${deployed.deploymentTx}`);

    } catch (error) {
      console.error(`\n❌ Failed to deploy ${config.handle}:`, error);
      // Continue with next agent
    }
  }

  console.log('\n\n✅ Agent deployment complete!');
  console.log('🔗 All agents are now on Base Sepolia');
  console.log('⛽ Gas was sponsored by the platform');
}

// Run deployment
deployAllAgents()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  });

