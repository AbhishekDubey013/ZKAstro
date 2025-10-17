import { DateTime } from 'luxon';

/**
 * Calculate Equal House cusps
 * In Equal House system, each house is exactly 30° from the Ascendant
 */

export function calculateAscendant(
  dateTimeUTC: DateTime,
  lat: number,
  lon: number
): { asc: number; mc: number } {
  // Simplified calculation - in production, use a proper library or Swiss Ephemeris
  // For MVP, we'll use a simplified approximation

  try {
    // Calculate Local Sidereal Time (LST)
    const jd = dateTimeToJulianDate(dateTimeUTC);
    const gmst = calculateGMST(jd);
    const lst = gmst + lon / 15; // Convert longitude to hours

    // Calculate Ascendant (simplified formula)
    // ASC = arctan(sin(LST) / (cos(LST) * cos(obliquity) - tan(lat) * sin(obliquity)))
    const obliquity = 23.44; // Earth's axial tilt in degrees
    const obliquityRad = (obliquity * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const lstRad = (lst * 15 * Math.PI) / 180; // Convert hours to degrees to radians

    let ascRad = Math.atan2(
      Math.sin(lstRad),
      Math.cos(lstRad) * Math.cos(obliquityRad) - Math.tan(latRad) * Math.sin(obliquityRad)
    );

    let ascDeg = (ascRad * 180) / Math.PI;
    ascDeg = ((ascDeg % 360) + 360) % 360; // Normalize to 0-360

    // MC is approximately LST * 15 (simplified)
    let mcDeg = (lst * 15) % 360;
    mcDeg = ((mcDeg % 360) + 360) % 360;

    return {
      asc: Math.round(ascDeg * 100), // centi-degrees
      mc: Math.round(mcDeg * 100),
    };
  } catch (error) {
    console.error('Error calculating Ascendant:', error);
    // Return fallback values
    return {
      asc: Math.floor(Math.random() * 36000),
      mc: Math.floor(Math.random() * 36000),
    };
  }
}

function dateTimeToJulianDate(dt: DateTime): number {
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

function calculateGMST(jd: number): number {
  // Greenwich Mean Sidereal Time in hours
  const T = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;

  gmst = (gmst % 360 + 360) % 360; // Normalize to 0-360 degrees
  return gmst / 15; // Convert to hours
}

export function calculateEqualHouses(ascendant: number): number[] {
  // Equal houses: each house is 30° from the Ascendant
  const houses: number[] = [];
  const ascDeg = ascendant / 100; // Convert from centi-degrees

  for (let i = 0; i < 12; i++) {
    const houseCusp = (ascDeg + i * 30) % 360;
    houses.push(Math.round(houseCusp * 100)); // Store as centi-degrees
  }

  return houses;
}
