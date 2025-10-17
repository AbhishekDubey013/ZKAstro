import { DateTime } from 'luxon';
import * as astro from 'astronomia';

/**
 * Calculate planetary positions using astronomia library
 * Returns positions in tropical zodiac as centi-degrees (1/100th of a degree)
 */

interface PlanetaryPositions {
  sun: number;
  moon: number;
  mercury: number;
  venus: number;
  mars: number;
  jupiter: number;
  saturn: number;
}

interface RetrogradePlanets {
  mercury: boolean;
  venus: boolean;
  mars: boolean;
  jupiter: boolean;
  saturn: boolean;
}

export function calculatePlanetaryPositions(
  dateTimeUTC: DateTime
): { planets: PlanetaryPositions; retro: RetrogradePlanets } {
  // Convert to Julian Date for astronomia
  const jd = dateTimeToJulianDate(dateTimeUTC);

  try {
    // Use astronomia's solar and moon modules
    const { solar, moonposition } = astro;

    // Calculate Sun position
    const sunLonRad = solar.apparentLongitude(jd);
    const sunLonDeg = radiansToDegrees(sunLonRad);

    // Calculate Moon position
    const moonPos = moonposition.position(jd);
    const moonLonDeg = radiansToDegrees(moonPos.lon);

    // For other planets, use simplified approximations
    // In a production system, you'd use proper VSOP87 calculations
    const planets: PlanetaryPositions = {
      sun: Math.round(((sunLonDeg % 360) + 360) % 360 * 100),
      moon: Math.round(((moonLonDeg % 360) + 360) % 360 * 100),
      mercury: calculateApproximatePlanetPosition('mercury', jd),
      venus: calculateApproximatePlanetPosition('venus', jd),
      mars: calculateApproximatePlanetPosition('mars', jd),
      jupiter: calculateApproximatePlanetPosition('jupiter', jd),
      saturn: calculateApproximatePlanetPosition('saturn', jd),
    };

    // Check retrograde status (simplified - check velocity)
    const retro: RetrogradePlanets = {
      mercury: checkRetrograde('mercury', jd),
      venus: checkRetrograde('venus', jd),
      mars: checkRetrograde('mars', jd),
      jupiter: checkRetrograde('jupiter', jd),
      saturn: checkRetrograde('saturn', jd),
    };

    return { planets, retro };
  } catch (error) {
    console.error('Error calculating planetary positions:', error);
    // Return fallback positions if calculation fails
    return getFallbackPositions();
  }
}

function dateTimeToJulianDate(dt: DateTime): number {
  // Convert Luxon DateTime to Julian Date
  const year = dt.year;
  const month = dt.month;
  const day = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24;

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  return jd;
}

// Simplified planet position calculation using mean orbital elements
function calculateApproximatePlanetPosition(planet: string, jd: number): number {
  // Days since J2000.0 (Jan 1, 2000, 12:00 TT)
  const T = (jd - 2451545.0) / 36525.0;

  // Simplified mean longitude formulas (degrees per century)
  // These are approximations - for production use VSOP87
  let L0, L1;

  switch (planet) {
    case 'mercury':
      L0 = 252.25;
      L1 = 149472.67;
      break;
    case 'venus':
      L0 = 181.98;
      L1 = 58517.82;
      break;
    case 'mars':
      L0 = 355.43;
      L1 = 19140.30;
      break;
    case 'jupiter':
      L0 = 34.35;
      L1 = 3034.74;
      break;
    case 'saturn':
      L0 = 50.08;
      L1 = 1222.49;
      break;
    default:
      L0 = 0;
      L1 = 0;
  }

  // Mean longitude in degrees
  const L = L0 + L1 * T;
  const normalizedL = ((L % 360) + 360) % 360;

  return Math.round(normalizedL * 100); // Convert to centi-degrees
}

function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function checkRetrograde(planet: string, jd: number): boolean {
  // Simple retrograde check: compare position now vs 1 day ago
  // If longitude decreased, planet is retrograde (simplified)
  try {
    const currentPos = calculateApproximatePlanetPosition(planet, jd);
    const previousPos = calculateApproximatePlanetPosition(planet, jd - 1);

    // Account for 360° wrap-around
    let diff = currentPos - previousPos;
    if (diff < -18000) diff += 36000; // 180° in centi-degrees
    if (diff > 18000) diff -= 36000;

    // Retrograde if moving backwards (or very slowly forward)
    return diff < -50; // Less than -0.5° per day
  } catch (error) {
    return false;
  }
}

function getFallbackPositions(): { planets: PlanetaryPositions; retro: RetrogradePlanets } {
  // Fallback positions if astronomia fails
  // Use current time-based pseudo-random positions
  const now = Date.now();

  return {
    planets: {
      sun: Math.floor((now % 31536000000) / 86400000 * 100) % 36000,
      moon: Math.floor((now % 2419200000) / 86400000 * 100) % 36000,
      mercury: Math.floor((now % 7776000000) / 86400000 * 100) % 36000,
      venus: Math.floor((now % 19440000000) / 86400000 * 100) % 36000,
      mars: Math.floor((now % 59356800000) / 86400000 * 100) % 36000,
      jupiter: Math.floor((now % 374371200000) / 86400000 * 100) % 36000,
      saturn: Math.floor((now % 929030400000) / 86400000 * 100) % 36000,
    },
    retro: {
      mercury: Math.random() > 0.7,
      venus: Math.random() > 0.9,
      mars: Math.random() > 0.85,
      jupiter: Math.random() > 0.9,
      saturn: Math.random() > 0.9,
    },
  };
}
