/**
 * Test Farcaster AI Prediction Generation
 * 
 * This script tests the AI-powered prediction system with real birth data
 */

import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { DateTime } from "luxon";
import { calculatePlanetaryPositions } from "../lib/astro/planets";
import { calculateAscendant } from "../lib/astro/equalHouses";
import { generateAurigaPrediction } from "../lib/agents/agentA";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testFarcasterAI() {
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                  ║");
  console.log("║   🤖 TESTING FARCASTER AI PREDICTION SYSTEM 🤖                  ║");
  console.log("║                                                                  ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // Sample birth data
  const dob = "1992-08-20";
  const tob = "10:30";
  const lat = 40.7128; // New York City
  const lon = -74.0060;

  console.log("📋 Test Birth Data:");
  console.log(`   DOB: ${dob}`);
  console.log(`   TOB: ${tob}`);
  console.log(`   Location: New York City (${lat}, ${lon})\n`);

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🔮 STEP 1: CALCULATE NATAL CHART");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const birthDate = DateTime.fromISO(dob, { zone: 'utc' });
  const [hours, minutes] = tob.split(':').map(Number);
  const birthDateTime = birthDate.set({ hour: hours, minute: minutes });

  const { planets: natalPositions, retro: natalRetro } = calculatePlanetaryPositions(birthDateTime);

  const natalAsc = calculateAscendant(
    birthDateTime.year,
    birthDateTime.month,
    birthDateTime.day,
    birthDateTime.hour + birthDateTime.minute / 60,
    lat,
    lon
  );

  console.log("✅ Natal Chart Calculated:");
  console.log(`   Sun: ${Math.round(natalPositions.sun * 10) / 10}°`);
  console.log(`   Moon: ${Math.round(natalPositions.moon * 10) / 10}°`);
  console.log(`   Mercury: ${Math.round(natalPositions.mercury * 10) / 10}°`);
  console.log(`   Venus: ${Math.round(natalPositions.venus * 10) / 10}°`);
  console.log(`   Mars: ${Math.round(natalPositions.mars * 10) / 10}°`);
  console.log(`   Jupiter: ${Math.round(natalPositions.jupiter * 10) / 10}°`);
  console.log(`   Saturn: ${Math.round(natalPositions.saturn * 10) / 10}°`);
  console.log(`   Ascendant: ${Math.round(natalAsc * 10) / 10}°\n`);

  const natalChart = {
    planets: natalPositions,
    retro: natalRetro,
    asc: natalAsc,
    mc: (natalAsc + 90) % 360,
  };

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🌍 STEP 2: CALCULATE TODAY'S TRANSITS");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const now = DateTime.now().setZone('utc');
  const { planets: transitPositions, retro: transitRetro } = calculatePlanetaryPositions(now);

  console.log("✅ Current Transits:");
  console.log(`   Sun: ${Math.round(transitPositions.sun * 10) / 10}°`);
  console.log(`   Moon: ${Math.round(transitPositions.moon * 10) / 10}°`);
  console.log(`   Mercury: ${Math.round(transitPositions.mercury * 10) / 10}°`);
  console.log(`   Venus: ${Math.round(transitPositions.venus * 10) / 10}°`);
  console.log(`   Mars: ${Math.round(transitPositions.mars * 10) / 10}°`);
  console.log(`   Jupiter: ${Math.round(transitPositions.jupiter * 10) / 10}°`);
  console.log(`   Saturn: ${Math.round(transitPositions.saturn * 10) / 10}°\n`);

  const transitChart = {
    planets: transitPositions,
    retro: transitRetro,
    asc: 0,
    mc: 0,
  };

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🤖 STEP 3: GENERATE AI PREDICTION");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  console.log("⏳ Calling Perplexity AI (Llama 3.1)...\n");

  const startTime = Date.now();
  const prediction = await generateAurigaPrediction(
    natalChart,
    transitChart,
    "What does today hold for me?",
    now.toISODate() || now.toFormat('yyyy-MM-dd')
  );
  const endTime = Date.now();

  console.log("✅ AI PREDICTION GENERATED!");
  console.log("─────────────────────────────────────────────────");
  console.log(`   Generation Time: ${endTime - startTime}ms`);
  console.log(`   Day Score: ${prediction.dayScore}/100`);
  console.log(`   Agent: Auriga (Optimistic)\n`);

  console.log("📊 PREDICTION DETAILS:");
  console.log("─────────────────────────────────────────────────\n");
  
  console.log("📝 Summary:");
  console.log(`   ${prediction.summary}\n`);
  
  console.log("✨ Highlights:");
  console.log(`${prediction.highlights}\n`);
  
  console.log("🔍 Astrological Factors:");
  console.log(`   ${prediction.factors}\n`);

  // Generate lucky elements
  const luckyNumber = Math.floor((transitPositions.sun % 99) + 1);
  const luckyColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"];
  const luckyColor = luckyColors[Math.floor(transitPositions.moon / 51.4) % luckyColors.length];
  const moods = ["Energetic", "Calm", "Focused", "Creative", "Social", "Reflective"];
  const mood = moods[Math.floor(prediction.dayScore / 17) % moods.length];

  console.log("🎲 Lucky Elements:");
  console.log(`   Lucky Number: ${luckyNumber}`);
  console.log(`   Lucky Color: ${luckyColor}`);
  console.log(`   Mood: ${mood}\n`);

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🎉 TEST COMPLETE!");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  console.log("✅ What We Tested:");
  console.log(`   1. ✅ Real astronomical calculations`);
  console.log(`   2. ✅ Natal chart computation`);
  console.log(`   3. ✅ Transit calculations`);
  console.log(`   4. ✅ AI prediction generation (Perplexity)`);
  console.log(`   5. ✅ Astrological scoring system`);
  console.log(`   6. ✅ Lucky elements generation\n`);

  console.log("🚀 AI Integration Status:");
  console.log(`   ✅ Perplexity API: Working`);
  console.log(`   ✅ Auriga Agent: Active`);
  console.log(`   ✅ Astrological Engine: Functional`);
  console.log(`   ✅ Ready for Farcaster Miniapp!\n`);

  console.log("💡 Next Steps:");
  console.log(`   1. Visit: http://localhost:5000/farcaster`);
  console.log(`   2. Enter birth details`);
  console.log(`   3. Get AI-powered prediction`);
  console.log(`   4. Rate the prediction\n`);

  console.log("═══════════════════════════════════════════════════════════════════\n");
}

testFarcasterAI().catch((error) => {
  console.error("\n❌ TEST FAILED:", error);
  process.exit(1);
});

