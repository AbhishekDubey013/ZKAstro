/**
 * Test script to verify moon phase calculation for today
 */

import 'dotenv/config';
import { DateTime } from 'luxon';
import { calculatePlanetaryPositions } from '../lib/astro/planets';
import { calculateLunarPhase } from '../lib/astro/transits';

// Test for today (Jan 10, 2026)
const today = DateTime.fromObject({ 
  year: 2026, 
  month: 1, 
  day: 10, 
  hour: 12, 
  minute: 0 
}, { zone: 'utc' });

console.log(`📅 Testing moon phase for: ${today.toISO()}\n`);

// Calculate planetary positions
const { planets } = calculatePlanetaryPositions(today);

console.log('Planetary Positions (in centi-degrees):');
console.log(`  Sun:  ${planets.sun} (${(planets.sun / 100).toFixed(2)}°)`);
console.log(`  Moon: ${planets.moon} (${(planets.moon / 100).toFixed(2)}°)\n`);

// Calculate moon phase
const lunarPhase = calculateLunarPhase(planets.sun, planets.moon);

// Calculate the angle
const angle = ((planets.moon - planets.sun) / 100 + 360) % 360;

console.log('Moon Phase Calculation:');
console.log(`  Angle between Sun and Moon: ${angle.toFixed(2)}°`);
console.log(`  Phase: ${lunarPhase.phase}`);
console.log(`  Is Waxing: ${lunarPhase.isWaxing}\n`);

// Expected: Last Quarter (270° ± 10°)
// Full Moon was Jan 3, so 7 days later = ~91° from 180° = ~271°
console.log('Expected:');
console.log(`  Last Quarter (angle should be ~260°-280°)\n`);

if (lunarPhase.phase === 'Full Moon') {
  console.log('❌ ERROR: Showing Full Moon but should be Last Quarter!');
  console.log(`   Angle ${angle.toFixed(2)}° is in Full Moon range (170°-190°), but Full Moon was 7 days ago.`);
  console.log(`   This suggests the angle calculation or astronomia positions may be incorrect.`);
} else if (lunarPhase.phase === 'Last Quarter') {
  console.log('✅ CORRECT: Showing Last Quarter as expected!');
} else {
  console.log(`⚠️  Showing ${lunarPhase.phase} - verify if this is correct for Jan 10, 2026`);
}


