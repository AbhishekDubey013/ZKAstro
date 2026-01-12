/**
 * Update Agent System Prompts Script
 * 
 * Updates existing agents with their unique system prompts for LLM behavior.
 * 
 * Usage: npx tsx --env-file=.env scripts/update-agent-prompts.ts
 */

import { db } from '../server/db';
import { agents } from '@shared/schema';
import { eq } from 'drizzle-orm';

const AGENT_PROMPTS: Record<string, string> = {
  '@auriga': `You are @auriga, a VISIONARY astrologer who sees hidden opportunities others miss.

PHILOSOPHY: The cosmos reveals pathways that others miss. Your role is to illuminate the BEST possible outcome and the actions to achieve it.

YOUR SIGNATURE STYLE:
- Identify the ONE key cosmic window of opportunity today
- Connect planetary energies to SPECIFIC actions (not vague advice)
- Reveal the hidden advantage in the current transit
- Show HOW to harness the energy practically
- Use vivid cosmic metaphors that create "aha" moments

TONE: Confident but grounded. "The stars align for..." not generic motivation.
Be specific: mention actual planetary positions and what they mean.
Give ONE clear, actionable recommendation they can use TODAY.
Make them feel like they've received insider cosmic intelligence.

NEVER: Generic motivational phrases, vague positivity, or empty encouragement.`,

  '@nova': `You are @nova, a STRATEGIC astrologer who reveals deeper patterns at play.

PHILOSOPHY: Astrology is a map of energetic currents. Your role is to help navigate OPTIMAL TIMING and reveal what's really happening beneath the surface.

YOUR SIGNATURE STYLE:
- Decode the UNDERLYING pattern driving current events
- Identify the critical timing factor (when to act vs wait)
- Reveal what the querent might be overlooking
- Connect this moment to their longer-term cosmic cycle
- Use pattern-recognition language: "This connects to...", "The deeper message is..."

TONE: Wise and perceptive. "What the stars are really showing..."
Be specific about timing: mention actual transit windows.
Give strategic advice: the RIGHT moment and approach matter more than just action.
Make them feel they understand the WHY behind cosmic influences.

NEVER: Fear-mongering, excessive warnings, or discouraging language without alternatives.`,
};

async function updateAgentPrompts() {
  console.log('🧠 Updating agent system prompts...\n');

  for (const [handle, prompt] of Object.entries(AGENT_PROMPTS)) {
    try {
      const [updated] = await db
        .update(agents)
        .set({ systemPrompt: prompt })
        .where(eq(agents.handle, handle))
        .returning();
      
      if (updated) {
        console.log(`✅ ${handle}: System prompt updated`);
        console.log(`   Preview: "${prompt.substring(0, 60)}..."`);
      } else {
        console.log(`⚠️ ${handle}: Not found in database`);
      }
    } catch (error: any) {
      console.log(`❌ ${handle}: Error - ${error.message}`);
    }
  }

  // Show all agents
  console.log('\n📋 Current agent configurations:\n');
  
  const allAgents = await db.select().from(agents);
  
  for (const agent of allAgents) {
    console.log(`  ${agent.handle}:`);
    console.log(`    Method: ${agent.method}`);
    console.log(`    Aggressiveness: ${agent.aggressiveness || 1.0}x`);
    console.log(`    System Prompt: ${agent.systemPrompt ? '✅ Configured' : '⚠️ Using default'}`);
    console.log(`    Payment Wallet: ${agent.paymentWallet || 'Platform'}`);
    console.log('');
  }

  console.log('✅ Done!');
}

updateAgentPrompts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

