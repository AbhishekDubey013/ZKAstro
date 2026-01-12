/**
 * Agent: @auriga
 * Method: Aggressive Transit Scoring
 * Focus: Optimistic, emphasizes benefic aspects strongly
 */

import { calculateDayScore, type NatalChart, type TransitChart } from '../astro/scoring';
import { polishPrediction } from './llm';

export async function generateAurigaPrediction(
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
  // Auriga uses aggressive weighting (emphasizes positives more)
  const aggressiveness = 1.3;
  const { score, factors } = calculateDayScore(natalChart, transitChart, aggressiveness, targetDateObj);

  const personality = `You are @auriga, a VISIONARY astrologer who sees hidden opportunities. Your unique approach:

PHILOSOPHY: You believe the cosmos reveals pathways that others miss. Your role is to illuminate the BEST possible outcome and the actions to achieve it.

YOUR SIGNATURE INSIGHTS:
- Identify the ONE key cosmic window of opportunity today
- Connect planetary energies to SPECIFIC actions (not vague advice)
- Reveal the hidden advantage in the current transit
- Show HOW to harness the energy practically

TONE & STYLE:
- Confident but grounded: "The stars align for..." not "Go for it!"
- Use vivid cosmic metaphors that create "aha" moments
- Be specific: mention actual planetary positions and what they mean
- Give ONE clear, actionable recommendation they can use TODAY
- Make them feel like they've received insider cosmic intelligence

NEVER: Generic motivational phrases, vague positivity, or empty encouragement`;
  
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
