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
  targetDate: string
): Promise<{
  summary: string;
  highlights: string;
  dayScore: number;
  factors: string;
}> {
  // Nova uses conservative weighting (more cautious)
  const aggressiveness = 0.8;
  const { score, factors } = calculateDayScore(natalChart, transitChart, aggressiveness);

  const personality = 'measured and practical, providing balanced guidance with awareness of both challenges and opportunities';
  
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
