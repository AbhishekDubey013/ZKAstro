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
  aggressiveness: number = 1.0, // 1.0 = normal, >1.0 = more aggressive, <1.0 = more conservative
  targetDate?: Date // Optional target date for accurate moon phase calculation
): DayScore {
  let score = 50; // Start at neutral
  const factors: string[] = [];

  // Find all aspects between transit planets and natal points
  const aspects = findAspects(transitChart.planets, natalChart.planets, natalChart.asc);

  // Increased point values for more score variance (was 3, now 8)
  const BENEFIC_POINTS = 8;
  const SUNMOON_POINTS = 5;
  const MALEFIC_POINTS = 8;
  const RETROGRADE_PENALTY = 5;
  const LUNAR_POINTS = 3;

  // Score benefic aspects (Jupiter/Venus harmonious = very positive)
  const beneficAspects = aspects.filter(
    (a) => isBenefic(a.transitPlanet) && isHarmoniousAspect(a.type)
  );
  beneficAspects.forEach((aspect) => {
    score += BENEFIC_POINTS * aggressiveness;
    factors.push(`${formatPlanet(aspect.transitPlanet)} ${formatAspect(aspect.type)} ${formatPoint(aspect.natalPoint)}`);
  });

  // Score harmonious Sun/Moon aspects (luminaries = important)
  const sunMoonAspects = aspects.filter(
    (a) =>
      (a.transitPlanet === 'sun' || a.transitPlanet === 'moon') &&
      isHarmoniousAspect(a.type)
  );
  sunMoonAspects.forEach((aspect) => {
    if (!beneficAspects.some(ba => ba.transitPlanet === aspect.transitPlanet && ba.natalPoint === aspect.natalPoint)) {
      score += SUNMOON_POINTS * aggressiveness;
      factors.push(`${formatPlanet(aspect.transitPlanet)} ${formatAspect(aspect.type)} ${formatPoint(aspect.natalPoint)}`);
    }
  });

  // Score challenging Sun/Moon aspects (opposition, square)
  const sunMoonChallengingAspects = aspects.filter(
    (a) =>
      (a.transitPlanet === 'sun' || a.transitPlanet === 'moon') &&
      isChallengingAspect(a.type)
  );
  sunMoonChallengingAspects.forEach((aspect) => {
    score -= SUNMOON_POINTS * aggressiveness;
    factors.push(`${formatPlanet(aspect.transitPlanet)} ${formatAspect(aspect.type)} ${formatPoint(aspect.natalPoint)} (tension)`);
  });

  // Score malefic hard aspects (Mars/Saturn squares/oppositions = challenging)
  const maleficAspects = aspects.filter(
    (a) => isMalefic(a.transitPlanet) && isChallengingAspect(a.type)
  );
  maleficAspects.forEach((aspect) => {
    score -= MALEFIC_POINTS * aggressiveness;
    factors.push(`${formatPlanet(aspect.transitPlanet)} ${formatAspect(aspect.type)} ${formatPoint(aspect.natalPoint)}`);
  });

  // Score benefic aspects from malefics (Saturn trine = stability, Mars trine = drive)
  const maleficHarmoniousAspects = aspects.filter(
    (a) => isMalefic(a.transitPlanet) && isHarmoniousAspect(a.type)
  );
  maleficHarmoniousAspects.forEach((aspect) => {
    score += 4 * aggressiveness;
    factors.push(`${formatPlanet(aspect.transitPlanet)} ${formatAspect(aspect.type)} ${formatPoint(aspect.natalPoint)} (constructive)`);
  });

  // Mercury retrograde penalty
  if (transitChart.retro.mercury) {
    score -= RETROGRADE_PENALTY * aggressiveness;
    factors.push('Mercury retrograde');
  }

  // Venus retrograde affects relationships/values
  if (transitChart.retro.venus) {
    score -= 3 * aggressiveness;
    factors.push('Venus retrograde');
  }

  // Mars retrograde affects energy/action
  if (transitChart.retro.mars) {
    score -= 3 * aggressiveness;
    factors.push('Mars retrograde');
  }

  // Lunar phase bonus/penalty (using SunCalc for accurate results)
  const lunarPhase = calculateLunarPhase(transitChart.planets.sun, transitChart.planets.moon, targetDate);
  
  // Full Moon and New Moon don't need (waxing)/(waning) labels
  const isSpecialPhase = lunarPhase.phase === 'Full Moon' || lunarPhase.phase === 'New Moon' || 
                          lunarPhase.phase === 'First Quarter' || lunarPhase.phase === 'Last Quarter';
  
  // Full Moon = peak energy, New Moon = new beginnings
  if (lunarPhase.phase === 'Full Moon') {
    score += LUNAR_POINTS * 2;
    factors.push('Full Moon (peak energy)');
  } else if (lunarPhase.phase === 'New Moon') {
    score += LUNAR_POINTS;
    factors.push('New Moon (fresh starts)');
  } else if (lunarPhase.isWaxing) {
    score += LUNAR_POINTS;
    factors.push(isSpecialPhase ? lunarPhase.phase : `${lunarPhase.phase} (waxing)`);
  } else {
    score -= LUNAR_POINTS;
    factors.push(isSpecialPhase ? lunarPhase.phase : `${lunarPhase.phase} (waning)`);
  }

  // Add base variance based on day of week (subtle influence)
  if (targetDate) {
    const dayOfWeek = targetDate.getDay();
    // Sunday (Sun day) and Friday (Venus day) slightly favorable
    if (dayOfWeek === 0 || dayOfWeek === 5) {
      score += 2;
    }
    // Saturday (Saturn day) slightly challenging
    if (dayOfWeek === 6) {
      score -= 2;
    }
  }

  // Clamp score to 0-100 range
  score = Math.max(0, Math.min(100, Math.round(score)));

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
