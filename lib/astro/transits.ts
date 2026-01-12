/**
 * Transit and aspect calculations for daily predictions
 */

import SunCalc from 'suncalc';

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

/**
 * Calculate lunar phase using SunCalc library for accurate results
 * Note: sunPos and moonPos parameters are kept for backward compatibility but not used
 * The date parameter is now required for accurate calculations
 */
export function calculateLunarPhase(
  sunPos: number,
  moonPos: number,
  date?: Date
): { phase: string; isWaxing: boolean } {
  // Use SunCalc for accurate moon phase calculation
  const targetDate = date || new Date();
  const moonIllum = SunCalc.getMoonIllumination(targetDate);
  
  // SunCalc returns phase as 0-1 where:
  // 0 (or 1) = New Moon
  // 0.25 = First Quarter
  // 0.5 = Full Moon
  // 0.75 = Last Quarter
  const phaseValue = moonIllum.phase;
  
  let phase = '';
  let isWaxing = phaseValue < 0.5;

  // Determine phase name based on phase value
  if (phaseValue < 0.03 || phaseValue > 0.97) {
    phase = 'New Moon';
    isWaxing = true;
  } 
  else if (phaseValue < 0.22) {
    phase = 'Waxing Crescent';
    isWaxing = true;
  } 
  else if (phaseValue < 0.28) {
    phase = 'First Quarter';
    isWaxing = true;
  } 
  else if (phaseValue < 0.47) {
    phase = 'Waxing Gibbous';
    isWaxing = true;
  } 
  else if (phaseValue < 0.53) {
    phase = 'Full Moon';
    isWaxing = false;
  } 
  else if (phaseValue < 0.72) {
    phase = 'Waning Gibbous';
    isWaxing = false;
  } 
  else if (phaseValue < 0.78) {
    phase = 'Last Quarter';
    isWaxing = false;
  } 
  else {
    phase = 'Waning Crescent';
    isWaxing = false;
  }

  return { phase, isWaxing };
}

/**
 * Calculate lunar phase directly from a Date object (preferred method)
 */
export function calculateLunarPhaseFromDate(date: Date): { phase: string; isWaxing: boolean; illumination: number } {
  const moonIllum = SunCalc.getMoonIllumination(date);
  const phaseValue = moonIllum.phase;
  
  let phase = '';
  let isWaxing = phaseValue < 0.5;

  if (phaseValue < 0.03 || phaseValue > 0.97) {
    phase = 'New Moon';
    isWaxing = true;
  } 
  else if (phaseValue < 0.22) {
    phase = 'Waxing Crescent';
    isWaxing = true;
  } 
  else if (phaseValue < 0.28) {
    phase = 'First Quarter';
    isWaxing = true;
  } 
  else if (phaseValue < 0.47) {
    phase = 'Waxing Gibbous';
    isWaxing = true;
  } 
  else if (phaseValue < 0.53) {
    phase = 'Full Moon';
    isWaxing = false;
  } 
  else if (phaseValue < 0.72) {
    phase = 'Waning Gibbous';
    isWaxing = false;
  } 
  else if (phaseValue < 0.78) {
    phase = 'Last Quarter';
    isWaxing = false;
  } 
  else {
    phase = 'Waning Crescent';
    isWaxing = false;
  }

  return { phase, isWaxing, illumination: moonIllum.fraction * 100 };
}
