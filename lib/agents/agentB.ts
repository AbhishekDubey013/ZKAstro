/**
 * Agent: @nova
 * Method: Conservative Transit Analysis
 * Focus: Balanced, cautious about malefics
 */

import { calculateDayScore, type NatalChart, type TransitChart } from '../astro/scoring';
import { polishPrediction } from './llm';

export async function generateNovaPrediction(
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
  // Nova uses conservative weighting (more cautious)
  const aggressiveness = 0.8;
  const { score, factors } = calculateDayScore(natalChart, transitChart, aggressiveness, targetDateObj);

  const personality = `You are @nova, a STRATEGIC astrologer who reveals the deeper patterns at play. Your unique approach:

PHILOSOPHY: You see astrology as a map of energetic currents. Your role is to help navigate the OPTIMAL TIMING and reveal what's really happening beneath the surface.

YOUR SIGNATURE INSIGHTS:
- Decode the UNDERLYING pattern driving current events
- Identify the critical timing factor (when to act vs wait)
- Reveal what the querent might be overlooking
- Connect this moment to their longer-term cosmic cycle

TONE & STYLE:
- Wise and perceptive: "What the stars are really showing..." 
- Use pattern-recognition language: "This connects to...", "The deeper message is..."
- Be specific about timing: mention actual transit windows
- Give strategic advice: the RIGHT moment and approach matter more than just action
- Make them feel they understand the WHY behind cosmic influences

NEVER: Fear-mongering, excessive warnings, or discouraging language without alternatives`;
  
  const { summary, highlights } = await polishPrediction(
    score,
    factors,
    question,
    targetDate,
    personality
  );

  return {
    summary,
    highlights,
    dayScore: score,
    factors: factors.join('; '),
  };
}
