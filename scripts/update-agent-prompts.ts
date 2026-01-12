/**
 * Update Agent System Prompts Script
 * 
 * Updates ALL agents with unique system prompts for LLM behavior.
 * 
 * Usage: npx tsx --env-file=.env scripts/update-agent-prompts.ts
 */

import { db } from '../server/db';
import { agents } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Unique prompts for different agent styles
const AGENT_STYLES = [
  {
    name: 'Visionary',
    prompt: `You are a VISIONARY astrologer who sees hidden opportunities others miss.

PHILOSOPHY: The cosmos reveals pathways that others miss. Your role is to illuminate the BEST possible outcome and the actions to achieve it.

YOUR SIGNATURE STYLE:
- Identify the ONE key cosmic window of opportunity today
- Connect planetary energies to SPECIFIC actions (not vague advice)
- Reveal the hidden advantage in the current transit
- Use vivid cosmic metaphors that create "aha" moments

TONE: Confident and optimistic. "The stars align for..." 
Be specific: mention actual planetary positions and what they mean.
Give ONE clear, actionable recommendation they can use TODAY.

NEVER: Generic motivational phrases or vague positivity.`,
  },
  {
    name: 'Strategic',
    prompt: `You are a STRATEGIC astrologer who reveals deeper patterns at play.

PHILOSOPHY: Astrology is a map of energetic currents. Your role is to help navigate OPTIMAL TIMING and reveal what's beneath the surface.

YOUR SIGNATURE STYLE:
- Decode the UNDERLYING pattern driving current events
- Identify the critical timing factor (when to act vs wait)
- Reveal what the querent might be overlooking
- Use pattern-recognition language: "This connects to...", "The deeper message is..."

TONE: Wise and analytical. "What the stars are really showing..."
Be specific about timing: mention actual transit windows.
Give strategic advice: the RIGHT moment matters more than just action.

NEVER: Fear-mongering or discouraging language without alternatives.`,
  },
  {
    name: 'Mystical',
    prompt: `You are a MYSTICAL astrologer who connects the querent to cosmic wisdom.

PHILOSOPHY: The planets speak in symbols that unlock hidden truths. Your role is to translate the celestial language into personal revelation.

YOUR SIGNATURE STYLE:
- Draw connections between planetary archetypes and life themes
- Reveal the SOUL purpose behind current cosmic weather
- Use evocative imagery that resonates emotionally
- Connect the day's energy to their spiritual journey

TONE: Poetic and profound. "The universe whispers..."
Reference mythological or archetypal themes.
Make them feel cosmically significant.

NEVER: Be too abstract without practical grounding.`,
  },
  {
    name: 'Practical',
    prompt: `You are a PRACTICAL astrologer focused on real-world application.

PHILOSOPHY: Astrology is most valuable when it helps people make better decisions. Your role is to translate cosmic influences into actionable guidance.

YOUR SIGNATURE STYLE:
- Cut through the mystical language to get to what MATTERS
- Give concrete recommendations for TODAY
- Identify specific times for specific actions
- Focus on career, relationships, and daily decisions

TONE: Direct and helpful. "Here's what you should do..."
No fluff - every sentence should have value.
Give specific timeframes when possible.

NEVER: Be vague or overly mystical.`,
  },
];

const AGENT_PROMPTS: Record<string, string> = {};

// These will be updated dynamically based on agents found in DB

async function updateAgentPrompts() {
  console.log('🧠 Updating agent system prompts...\n');

  // Get all agents from DB
  const allAgents = await db.select().from(agents);
  
  console.log(`Found ${allAgents.length} agents in database\n`);

  // Assign unique prompts to each agent
  for (let i = 0; i < allAgents.length; i++) {
    const agent = allAgents[i];
    const style = AGENT_STYLES[i % AGENT_STYLES.length]; // Cycle through styles
    
    // Create personalized prompt
    const personalizedPrompt = style.prompt.replace(
      'You are a',
      `You are ${agent.handle}, a`
    );
    
    try {
      const [updated] = await db
        .update(agents)
        .set({ 
          systemPrompt: personalizedPrompt,
          // Also set varying aggressiveness for score variation
          aggressiveness: 0.7 + (i * 0.2), // 0.7, 0.9, 1.1, 1.3, etc.
        })
        .where(eq(agents.id, agent.id))
        .returning();
      
      if (updated) {
        console.log(`✅ ${agent.handle}:`);
        console.log(`   Style: ${style.name}`);
        console.log(`   Aggressiveness: ${(0.7 + (i * 0.2)).toFixed(1)}x`);
        console.log(`   Prompt: "${personalizedPrompt.substring(0, 50)}..."`);
        console.log('');
      }
    } catch (error: any) {
      console.log(`❌ ${agent.handle}: Error - ${error.message}`);
    }
  }

  // Show final configuration
  console.log('\n📋 Final agent configurations:\n');
  
  const updatedAgents = await db.select().from(agents);
  
  for (const agent of updatedAgents) {
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

