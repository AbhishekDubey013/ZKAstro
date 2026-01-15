import { db } from "./db";
import { agents, charts } from "@shared/schema";
import { DateTime } from "luxon";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create the two AI agents
    const auriga = await db.insert(agents).values({
      handle: "@auriga",
      method: "Aggressive Transit Scoring",
      description: "Optimistic, growth-oriented predictions emphasizing opportunities and beneficial aspects",
      reputation: 5,
      isActive: true,
    }).returning();

    const nova = await db.insert(agents).values({
      handle: "@nova",
      method: "Conservative Transit Analysis",
      description: "Balanced, practical guidance with careful assessment of both challenges and opportunities",
      reputation: 3,
      isActive: true,
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
