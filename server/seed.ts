import { db } from "./db";
import { agents, charts } from "@shared/schema";
import { DateTime } from "luxon";

async function seed() {
  console.log("🌱 Seeding database...");

  // Get agent wallet addresses from environment (x402 direct payments)
  const aurigaWallet = process.env.AURIGA_WALLET_ADDRESS?.toLowerCase() || null;
  const novaWallet = process.env.NOVA_WALLET_ADDRESS?.toLowerCase() || null;

  if (aurigaWallet) {
    console.log(`💰 @auriga payment wallet: ${aurigaWallet}`);
  } else {
    console.log('⚠️  AURIGA_WALLET_ADDRESS not set - agent payments will go to platform');
  }

  if (novaWallet) {
    console.log(`💰 @nova payment wallet: ${novaWallet}`);
  } else {
    console.log('⚠️  NOVA_WALLET_ADDRESS not set - agent payments will go to platform');
  }

  try {
    // Create the two AI agents with payment wallets and unique system prompts
    const auriga = await db.insert(agents).values({
      handle: "@auriga",
      method: "Aggressive Transit Scoring",
      description: "Optimistic, growth-oriented predictions emphasizing opportunities and beneficial aspects",
      reputation: 5,
      isActive: true,
      aggressiveness: 1.3,
      paymentWallet: aurigaWallet,
      systemPrompt: `You are @auriga, a VISIONARY astrologer who sees hidden opportunities others miss.

PHILOSOPHY: The cosmos reveals pathways that others miss. Your role is to illuminate the BEST possible outcome and the actions to achieve it.

YOUR SIGNATURE STYLE:
- Identify the ONE key cosmic window of opportunity today
- Connect planetary energies to SPECIFIC actions (not vague advice)
- Reveal the hidden advantage in the current transit
- Show HOW to harness the energy practically
- Use vivid cosmic metaphors that create "aha" moments

TONE: Confident but grounded. "The stars align for..." not generic motivation.
Be specific: mention actual planetary positions and what they mean.
Give ONE clear, actionable recommendation they can use TODAY.
Make them feel like they've received insider cosmic intelligence.

NEVER: Generic motivational phrases, vague positivity, or empty encouragement.`,
    }).returning();

    const nova = await db.insert(agents).values({
      handle: "@nova",
      method: "Conservative Transit Analysis",
      description: "Balanced, practical guidance with careful assessment of both challenges and opportunities",
      reputation: 3,
      isActive: true,
      aggressiveness: 0.8,
      paymentWallet: novaWallet,
      systemPrompt: `You are @nova, a STRATEGIC astrologer who reveals deeper patterns at play.

PHILOSOPHY: Astrology is a map of energetic currents. Your role is to help navigate OPTIMAL TIMING and reveal what's really happening beneath the surface.

YOUR SIGNATURE STYLE:
- Decode the UNDERLYING pattern driving current events
- Identify the critical timing factor (when to act vs wait)
- Reveal what the querent might be overlooking
- Connect this moment to their longer-term cosmic cycle
- Use pattern-recognition language: "This connects to...", "The deeper message is..."

TONE: Wise and perceptive. "What the stars are really showing..."
Be specific about timing: mention actual transit windows.
Give strategic advice: the RIGHT moment and approach matter more than just action.
Make them feel they understand the WHY behind cosmic influences.

NEVER: Fear-mongering, excessive warnings, or discouraging language without alternatives.`,
    }).returning();

    console.log("✓ Created agents:", auriga[0].handle, nova[0].handle);

    // Create demo charts for testing
    const demoChart1 = await db.insert(charts).values({
      userId: null,
      inputsHash: "demo_chart_1_hash",
      algoVersion: "western-equal-v1",
      paramsJson: {
        quant: "centi-deg",
        zodiac: "tropical",
        houseSystem: "equal",
        planets: {
          sun: 8321, // ~83° = Gemini
          moon: 19732, // ~197° = Libra
          mercury: 9217, // ~92° = Cancer
          venus: 15544, // ~155° = Leo
          mars: 4711, // ~47° = Taurus
          jupiter: 30122, // ~301° = Aquarius
          saturn: 33029, // ~330° = Pisces
        },
        retro: {
          mercury: false,
          venus: false,
          mars: false,
          jupiter: false,
          saturn: true,
        },
        asc: 1230, // ~12° = Aries
        mc: 900, // ~9° = Capricorn
      },
    }).returning();

    const demoChart2 = await db.insert(charts).values({
      userId: null,
      inputsHash: "demo_chart_2_hash",
      algoVersion: "western-equal-v1",
      paramsJson: {
        quant: "centi-deg",
        zodiac: "tropical",
        houseSystem: "equal",
        planets: {
          sun: 24500, // ~245° = Sagittarius
          moon: 7800, // ~78° = Gemini
          mercury: 25100, // ~251° = Sagittarius
          venus: 22200, // ~222° = Scorpio
          mars: 10500, // ~105° = Cancer
          jupiter: 5400, // ~54° = Taurus
          saturn: 27000, // ~270° = Capricorn
        },
        retro: {
          mercury: true,
          venus: false,
          mars: false,
          jupiter: false,
          saturn: false,
        },
        asc: 18000, // ~180° = Libra
        mc: 9000, // ~90° = Cancer
      },
    }).returning();

    console.log("✓ Created demo charts:", demoChart1[0].id, demoChart2[0].id);

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
