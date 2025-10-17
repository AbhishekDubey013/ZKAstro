import {
  findAspects,
  isHarmoniousAspect,
  isChallengingAspect,
  isBenefic,
  isMalefic,
  calculateLunarPhase,
  type Aspect,
} from './transits';

export interface DayScore {
  score: number;
  factors: string[];
}

export interface NatalChart {
  planets: {
    sun: number;
    moon: number;
    mercury: number;
    venus: number;
    mars: number;
    jupiter: number;
    saturn: number;
  };
  retro: {
    mercury: boolean;
    venus: boolean;
    mars: boolean;
    jupiter: boolean;
    saturn: boolean;
  };
  asc: number;
  mc: number;
}

export interface TransitChart {
  planets: {
    sun: number;
    moon: number;
    mercury: number;
    venus: number;
    mars: number;
    jupiter: number;
    saturn: number;
  };
  retro: {
    mercury: boolean;
    venus: boolean;
    mars: boolean;
    jupiter: boolean;
    saturn: boolean;
  };
}

/**
 * Calculate daily score based on transits
 * 
 * Scoring system:
 * +3: Benefic (Jupiter/Venus) aspects to natal Sun/Moon/ASC
 * +2: Sun/Moon harmonious aspects to natal Sun/Moon/ASC
 * -3: Malefic (Mars/Saturn) hard aspects to Sun/Moon/ASC
 * -2: Mercury retrograde on this day
 * +1: Waxing Moon
 * -1: Waning Moon
 */
export function calculateDayScore(
  natalChart: NatalChart,
  transitChart: TransitChart,
  aggressiveness: number = 1.0 // 1.0 = normal, >1.0 = more aggressive, <1.0 = more conservative
): DayScore {
  let score = 50; // Start at neutral
  const factors: string[] = [];

  // Find all aspects between transit planets and natal points
  const aspects = findAspects(transitChart.planets, natalChart.planets, natalChart.asc);

  // Score benefic aspects
  const beneficAspects = aspects.filter(
    (a) => isBenefic(a.transitPlanet) && isHarmoniousAspect(a.type)
  );
  beneficAspects.forEach((aspect) => {
    score += 3 * aggressiveness;
    factors.push(`${formatPlanet(aspect.transitPlanet)} ${formatAspect(aspect.type)} ${formatPoint(aspect.natalPoint)}`);
  });

  // Score harmonious Sun/Moon aspects
  const sunMoonAspects = aspects.filter(
    (a) =>
      (a.transitPlanet === 'sun' || a.transitPlanet === 'moon') &&
      isHarmoniousAspect(a.type)
  );
  sunMoonAspects.forEach((aspect) => {
    if (!beneficAspects.some(ba => ba.transitPlanet === aspect.transitPlanet && ba.natalPoint === aspect.natalPoint)) {
      score += 2 * aggressiveness;
      factors.push(`${formatPlanet(aspect.transitPlanet)} ${formatAspect(aspect.type)} ${formatPoint(aspect.natalPoint)}`);
    }
  });

  // Score malefic hard aspects
  const maleficAspects = aspects.filter(
    (a) => isMalefic(a.transitPlanet) && isChallengingAspect(a.type)
  );
  maleficAspects.forEach((aspect) => {
    score -= 3 * aggressiveness;
    factors.push(`${formatPlanet(aspect.transitPlanet)} ${formatAspect(aspect.type)} ${formatPoint(aspect.natalPoint)}`);
  });

  // Mercury retrograde penalty
  if (transitChart.retro.mercury) {
    score -= 2 * aggressiveness;
    factors.push('Mercury retrograde');
  }

  // Lunar phase bonus/penalty
  const lunarPhase = calculateLunarPhase(transitChart.planets.sun, transitChart.planets.moon);
  if (lunarPhase.isWaxing) {
    score += 1;
    factors.push(`${lunarPhase.phase} (waxing)`);
  } else {
    score -= 1;
    factors.push(`${lunarPhase.phase} (waning)`);
  }

  // Clamp score to 0-100 range
  score = Math.max(0, Math.min(100, score));

  return { score, factors };
}

function formatPlanet(planet: string): string {
  const names: Record<string, string> = {
    sun: 'Sun',
    moon: 'Moon',
    mercury: 'Mercury',
    venus: 'Venus',
    mars: 'Mars',
    jupiter: 'Jupiter',
    saturn: 'Saturn',
  };
  return names[planet] || planet;
}

function formatPoint(point: string): string {
  const names: Record<string, string> = {
    sun: 'natal Sun',
    moon: 'natal Moon',
    asc: 'Ascendant',
  };
  return names[point] || point;
}

function formatAspect(aspect: string): string {
  const symbols: Record<string, string> = {
    conjunction: '☌',
    opposition: '☍',
    square: '□',
    trine: '△',
    sextile: '⚹',
  };
  return symbols[aspect] || aspect;
}
