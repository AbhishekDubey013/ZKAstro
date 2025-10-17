/**
 * Client-side astrology calculations for ZK privacy
 * Calculates planetary positions in browser, never sends raw birth data to server
 */

import { DateTime } from 'luxon';

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

interface ChartCalculation {
  planets: PlanetaryPositions;
  retro: RetrogradePlanets;
  asc: number;
  mc: number;
}

/**
 * Calculate chart parameters from birth data (client-side only)
 */
export async function calculateChartClientSide(
  dob: string,
  tob: string,
  tz: string,
  lat: number,
  lon: number
): Promise<ChartCalculation> {
  // Convert to UTC
  const localDateTime = DateTime.fromFormat(
    `${dob} ${tob}`,
    "yyyy-MM-dd HH:mm",
    { zone: tz }
  );

  if (!localDateTime.isValid) {
    throw new Error("Invalid date/time or timezone");
  }

  const utcDateTime = localDateTime.toUTC();

  // Calculate Julian Date
  const jd = dateTimeToJulianDate(utcDateTime);

  // Calculate positions (simplified for client-side)
  const planets = calculatePlanetaryPositions(jd);
  const retro = detectRetrogrades(jd);
  const { asc, mc } = calculateAngles(jd, lat, lon);

  return { planets, retro, asc, mc };
}

/**
 * Generate ZK proof using Poseidon hash (ZK-friendly cryptography)
 * Creates a cryptographically sound commitment and proof
 */
export async function generateZKProof(
  dob: string,
  tob: string,
  tz: string,
  lat: number,
  lon: number,
  calculatedPositions: ChartCalculation
): Promise<{
  commitment: string;
  proof: string;
  salt: string;
}> {
  // Import Poseidon ZK proof system
  const { generateZKProof: generatePoseidonProof } = await import('@/../../lib/zkproof/poseidon-proof');
  
  // Prepare inputs
  const inputs = {
    dob,
    tob,
    tz,
    lat,
    lon
  };
  
  // Prepare positions (cast to generic object for ZK proof)
  const positions = {
    planets: calculatedPositions.planets as unknown as { [key: string]: number },
    asc: calculatedPositions.asc,
    mc: calculatedPositions.mc
  };
  
  // Generate Poseidon-based ZK proof
  const zkProof = await generatePoseidonProof(inputs, positions);
  
  return {
    commitment: zkProof.commitment,
    proof: zkProof.proof,
    salt: zkProof.nonce
  };
}

// ============ Helper Functions ============

function dateTimeToJulianDate(dt: DateTime): number {
  const year = dt.year;
  const month = dt.month;
  const day = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24;

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function calculatePlanetaryPositions(jd: number): PlanetaryPositions {
  const T = (jd - 2451545.0) / 36525.0;

  // Simplified mean longitudes (approximation for client-side)
  return {
    sun: Math.round(((280.46646 + 36000.76983 * T) % 360) * 100),
    moon: Math.round(((218.316 + 481267.8813 * T) % 360) * 100),
    mercury: Math.round(((252.25 + 149472.68 * T) % 360) * 100),
    venus: Math.round(((181.98 + 58517.82 * T) % 360) * 100),
    mars: Math.round(((355.43 + 19140.30 * T) % 360) * 100),
    jupiter: Math.round(((34.35 + 3034.91 * T) % 360) * 100),
    saturn: Math.round(((50.08 + 1222.11 * T) % 360) * 100),
  };
}

function detectRetrogrades(jd: number): RetrogradePlanets {
  // Simplified retrograde detection
  const positions1 = calculatePlanetaryPositions(jd);
  const positions2 = calculatePlanetaryPositions(jd + 1);

  return {
    mercury: positions2.mercury < positions1.mercury,
    venus: positions2.venus < positions1.venus,
    mars: positions2.mars < positions1.mars,
    jupiter: positions2.jupiter < positions1.jupiter,
    saturn: positions2.saturn < positions1.saturn,
  };
}

function calculateAngles(jd: number, lat: number, lon: number): { asc: number; mc: number } {
  const T = (jd - 2451545.0) / 36525.0;
  
  // Simplified RAMC calculation
  const gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360;
  const ramc = (gmst + lon) % 360;

  // Simplified MC (approximately RAMC)
  const mc = Math.round(ramc * 100);

  // Simplified ASC (very rough approximation)
  const latRad = (lat * Math.PI) / 180;
  const ramcRad = (ramc * Math.PI) / 180;
  const asc = Math.round(((Math.atan2(Math.cos(ramcRad), -Math.sin(ramcRad) * Math.cos(latRad)) * 180) / Math.PI + 360) % 360 * 100);

  return { asc, mc };
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
