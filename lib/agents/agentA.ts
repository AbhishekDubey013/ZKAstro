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
  targetDate: string
): Promise<{
  summary: string;
  highlights: string;
  dayScore: number;
  factors: string;
}> {
  // Auriga uses aggressive weighting (emphasizes positives more)
  const aggressiveness = 1.3;
  const { score, factors } = calculateDayScore(natalChart, transitChart, aggressiveness);

  const personality = 'optimistic and growth-oriented, emphasizing opportunities and positive potential';
  
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
