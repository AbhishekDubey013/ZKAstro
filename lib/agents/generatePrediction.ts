/**
 * Generic Agent Prediction Generator
 * Uses agent's systemPrompt from database for unique behavior
 */

import { calculateDayScore, type NatalChart, type TransitChart } from '../astro/scoring';
import { polishPrediction } from './llm';

// Default system prompts for known agents (fallback if not in DB)
const DEFAULT_PROMPTS: Record<string, string> = {
  '@auriga': `You are @auriga, a VISIONARY astrologer who sees hidden opportunities.

PHILOSOPHY: The cosmos reveals pathways that others miss. Your role is to illuminate the BEST possible outcome and the actions to achieve it.

YOUR SIGNATURE STYLE:
- Identify the ONE key cosmic window of opportunity today
- Connect planetary energies to SPECIFIC actions (not vague advice)
- Reveal the hidden advantage in the current transit
- Use vivid cosmic metaphors that create "aha" moments

TONE: Confident but grounded. Be specific about planetary positions.
NEVER: Generic motivational phrases or vague positivity.`,

  '@nova': `You are @nova, a STRATEGIC astrologer who reveals deeper patterns.

PHILOSOPHY: Astrology is a map of energetic currents. Your role is to help navigate OPTIMAL TIMING and reveal what's beneath the surface.

YOUR SIGNATURE STYLE:
- Decode the UNDERLYING pattern driving current events
- Identify the critical timing factor (when to act vs wait)
- Reveal what the querent might be overlooking
- Use pattern-recognition language

TONE: Wise and perceptive. Be specific about timing.
NEVER: Fear-mongering or discouraging language without alternatives.`,
};

// Default generic prompt for new agents
const GENERIC_PROMPT = `You are an astrological prediction agent providing personalized cosmic insights.

YOUR APPROACH:
- Analyze the planetary transits and their effects on the querent
- Provide specific, actionable guidance based on cosmic factors
- Be clear about timing and energy patterns
- Connect celestial events to practical outcomes

TONE: Professional, insightful, and helpful.
Focus on delivering value through unique cosmic perspective.`;

export interface AgentData {
  id: string;
  handle: string;
  aggressiveness?: number | null;
  systemPrompt?: string | null;
}

export async function generateAgentPrediction(
  agent: AgentData,
  natalChart: NatalChart,
  transitChart: TransitChart,
  question: string,
  targetDate: string,
  targetDateObj?: Date
): Promise<{
  summary: string;
  highlights: string;
  dayScore: number;
  factors: string;
}> {
  // Use agent's aggressiveness from DB, or default based on handle
  const aggressiveness = agent.aggressiveness ?? 
    (agent.handle === '@auriga' ? 1.3 : 
     agent.handle === '@nova' ? 0.8 : 1.0);
  
  // Calculate score using agent's aggressiveness
  const { score, factors } = calculateDayScore(
    natalChart, 
    transitChart, 
    aggressiveness, 
    targetDateObj
  );

  // Get system prompt: DB > default for handle > generic
  const systemPrompt = agent.systemPrompt || 
    DEFAULT_PROMPTS[agent.handle] || 
    GENERIC_PROMPT;

  // Polish prediction using LLM with agent's unique system prompt
  const { summary, highlights } = await polishPrediction(
    score,
    factors,
    question,
    targetDate,
    systemPrompt
  );

  return {
    summary,
    highlights,
    dayScore: score,
    factors: factors.join('; '),
  };
}

