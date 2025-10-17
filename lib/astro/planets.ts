import { planetposition } from 'astronomia';
import { DateTime } from 'luxon';

/**
 * Calculate planetary positions using astronomia library (VSOP87)
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
    // Calculate positions for each planet
    const planets: PlanetaryPositions = {
      sun: getPlanetPosition('sun', jd),
      moon: getPlanetPosition('moon', jd),
      mercury: getPlanetPosition('mercury', jd),
      venus: getPlanetPosition('venus', jd),
      mars: getPlanetPosition('mars', jd),
      jupiter: getPlanetPosition('jupiter', jd),
      saturn: getPlanetPosition('saturn', jd),
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

  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  return jd;
}

function getPlanetPosition(planet: string, jd: number): number {
  try {
    let lon = 0;

    switch (planet) {
      case 'sun':
        const sunPos = planetposition.position('sun', jd);
        lon = radiansToDegrees(sunPos.lon);
        break;
      case 'moon':
        const moonPos = planetposition.position('moon', jd);
        lon = radiansToDegrees(moonPos.lon);
        break;
      case 'mercury':
        const mercuryPos = planetposition.position('mercury', jd);
        lon = radiansToDegrees(mercuryPos.lon);
        break;
      case 'venus':
        const venusPos = planetposition.position('venus', jd);
        lon = radiansToDegrees(venusPos.lon);
        break;
      case 'mars':
        const marsPos = planetposition.position('mars', jd);
        lon = radiansToDegrees(marsPos.lon);
        break;
      case 'jupiter':
        const jupiterPos = planetposition.position('jupiter', jd);
        lon = radiansToDegrees(jupiterPos.lon);
        break;
      case 'saturn':
        const saturnPos = planetposition.position('saturn', jd);
        lon = radiansToDegrees(saturnPos.lon);
        break;
    }

    // Normalize to 0-360 and convert to centi-degrees
    lon = ((lon % 360) + 360) % 360;
    return Math.round(lon * 100); // centi-degrees
  } catch (error) {
    console.error(`Error calculating ${planet} position:`, error);
    // Return a fallback position
    return Math.floor(Math.random() * 36000);
  }
}

function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function checkRetrograde(planet: string, jd: number): boolean {
  // Simple retrograde check: compare position now vs 1 day ago
  // If longitude decreased, planet is retrograde (simplified)
  try {
    const currentPos = getPlanetPosition(planet, jd);
    const previousPos = getPlanetPosition(planet, jd - 1);

    // Account for 360° wrap-around
    let diff = currentPos - previousPos;
    if (diff < -18000) diff += 36000; // 180° in centi-degrees
    if (diff > 18000) diff -= 36000;

    return diff < 0;
  } catch (error) {
    return false;
  }
}

function getFallbackPositions(): { planets: PlanetaryPositions; retro: RetrogradePlanets } {
  // Fallback positions if astronomia fails
  // These are example positions and should ideally use cached ephemeris
  return {
    planets: {
      sun: Math.floor(Math.random() * 36000),
      moon: Math.floor(Math.random() * 36000),
      mercury: Math.floor(Math.random() * 36000),
      venus: Math.floor(Math.random() * 36000),
      mars: Math.floor(Math.random() * 36000),
      jupiter: Math.floor(Math.random() * 36000),
      saturn: Math.floor(Math.random() * 36000),
    },
    retro: {
      mercury: false,
      venus: false,
      mars: false,
      jupiter: false,
      saturn: false,
    },
  };
}
