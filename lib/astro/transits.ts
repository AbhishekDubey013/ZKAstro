/**
 * Transit and aspect calculations for daily predictions
 */

export interface Aspect {
  type: 'conjunction' | 'opposition' | 'square' | 'trine' | 'sextile';
  orb: number;
  transitPlanet: string;
  natalPoint: string;
}

const ASPECT_ORBS = {
  conjunction: 6,
  opposition: 6,
  square: 6,
  trine: 4,
  sextile: 3,
};

const ASPECT_ANGLES = {
  conjunction: 0,
  opposition: 180,
  square: 90,
  trine: 120,
  sextile: 60,
};

export function findAspects(
  transitPlanets: Record<string, number>,
  natalPlanets: Record<string, number>,
  natalAsc: number
): Aspect[] {
  const aspects: Aspect[] = [];

  // Key natal points to check
  const natalPoints = {
    sun: natalPlanets.sun,
    moon: natalPlanets.moon,
    asc: natalAsc,
  };

  // Check each transit planet against each natal point
  for (const [transitName, transitPos] of Object.entries(transitPlanets)) {
    for (const [natalName, natalPos] of Object.entries(natalPoints)) {
      const foundAspects = checkAspect(transitPos, natalPos);
      foundAspects.forEach((aspect) => {
        aspects.push({
          ...aspect,
          transitPlanet: transitName,
          natalPoint: natalName,
        });
      });
    }
  }

  return aspects;
}

function checkAspect(
  pos1: number,
  pos2: number
): Array<{ type: Aspect['type']; orb: number }> {
  const aspects: Array<{ type: Aspect['type']; orb: number }> = [];

  // Convert centi-degrees to degrees
  const p1 = pos1 / 100;
  const p2 = pos2 / 100;

  // Calculate angular distance
  let distance = Math.abs(p1 - p2);
  if (distance > 180) distance = 360 - distance;

  // Check each aspect type
  for (const [aspectName, aspectAngle] of Object.entries(ASPECT_ANGLES)) {
    const orb = Math.abs(distance - aspectAngle);

    if (orb <= ASPECT_ORBS[aspectName as keyof typeof ASPECT_ORBS]) {
      aspects.push({
        type: aspectName as Aspect['type'],
        orb,
      });
    }
  }

  return aspects;
}

export function isHarmoniousAspect(type: Aspect['type']): boolean {
  return type === 'trine' || type === 'sextile' || type === 'conjunction';
}

export function isChallengingAspect(type: Aspect['type']): boolean {
  return type === 'square' || type === 'opposition';
}

export function isBenefic(planet: string): boolean {
  return planet === 'jupiter' || planet === 'venus';
}

export function isMalefic(planet: string): boolean {
  return planet === 'mars' || planet === 'saturn';
}

export function calculateLunarPhase(
  sunPos: number,
  moonPos: number
): { phase: string; isWaxing: boolean } {
  // Calculate angle between Sun and Moon
  const angle = ((moonPos - sunPos) / 100 + 360) % 360;

  let phase = '';
  let isWaxing = true;

  if (angle < 45) {
    phase = 'New Moon';
    isWaxing = true;
  } else if (angle < 90) {
    phase = 'Waxing Crescent';
    isWaxing = true;
  } else if (angle < 135) {
    phase = 'First Quarter';
    isWaxing = true;
  } else if (angle < 180) {
    phase = 'Waxing Gibbous';
    isWaxing = true;
  } else if (angle < 225) {
    phase = 'Full Moon';
    isWaxing = false;
  } else if (angle < 270) {
    phase = 'Waning Gibbous';
    isWaxing = false;
  } else if (angle < 315) {
    phase = 'Last Quarter';
    isWaxing = false;
  } else {
    phase = 'Waning Crescent';
    isWaxing = false;
  }

  return { phase, isWaxing };
}
