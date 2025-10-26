import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { 
  farcasterUsers, 
  farcasterPredictions, 
  farcasterRatings 
} from "../shared/schema";
import { ethers } from "ethers";
import { generateZKProof } from "../lib/zkproof/poseidon-proof";
import { calculatePlanetaryPositions } from "../lib/astro/planets";
import { calculateAscendant } from "../lib/astro/equalHouses";
import { DateTime } from "luxon";
import { generateAurigaPrediction } from "../lib/agents/agentA";
import { PrivyClient } from "@privy-io/server-auth";

const router = Router();

// Initialize Privy client
const privyAppId = process.env.PRIVY_APP_ID || "cmgb15wpa00g0la0duq9rzaqw";
const privyAppSecret = process.env.PRIVY_APP_SECRET;

const privy = privyAppSecret 
  ? new PrivyClient(privyAppId, privyAppSecret)
  : null;

// Helper to extract user ID from Privy token
async function getPrivyUserId(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;
  
  if (authHeader && privy) {
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const claims = await privy.verifyAuthToken(token);
      
      // Extract user ID from Privy claims
      // Privy user ID format: did:privy:{userId}
      const privyUserId = claims.userId;
      
      // Try to get wallet address or Farcaster FID from Privy user
      try {
        const user = await privy.getUser(privyUserId);
        
        // Priority 1: Use wallet address
        if (user.wallet?.address) {
          console.log(`✅ Using Privy wallet: ${user.wallet.address}`);
          return user.wallet.address.toLowerCase();
        }
        
        // Priority 2: Use Farcaster FID
        if (user.farcaster?.fid) {
          console.log(`✅ Using Privy Farcaster FID: ${user.farcaster.fid}`);
          return `fid:${user.farcaster.fid}`;
        }
        
        // Priority 3: Use Privy user ID
        console.log(`✅ Using Privy user ID: ${privyUserId}`);
        return privyUserId;
      } catch (error) {
        console.error('Failed to get Privy user details:', error);
        // Fallback to Privy user ID
        console.log(`✅ Using Privy user ID (fallback): ${privyUserId}`);
        return privyUserId;
      }
    } catch (error) {
      console.error('Failed to verify Privy token:', error);
    }
  }
  
  // Fallback: Use IP-based ID for testing
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
  const userId = `demo-${ip}`;
  console.warn(`⚠️  No Privy auth found, using IP-based ID: ${userId}`);
  return userId;
}

// Stylus contract configuration
const FARCASTER_CONTRACT_ADDRESS = process.env.FARCASTER_CONTRACT_ADDRESS || "0xfbcbb9088301cb94946ad415d7d862a583f6289d";
const ARBITRUM_SEPOLIA_RPC = process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc";
const AGENT_DEPLOYER_PRIVATE_KEY = process.env.AGENT_DEPLOYER_PRIVATE_KEY;

const CONTRACT_ABI = [
  "function registerUser(bytes32 commitment) external",
  "function storePrediction(uint256 date, bytes32 predictionHash) external",
  "function ratePrediction(uint256 date, uint8 rating) external",
  "function isUserRegistered(address user) external view returns (bool)",
  "function getUserStats(address user) external view returns (uint256, uint256, uint256)",
  "function getGlobalStats() external view returns (uint256, uint256)",
];

// Helper to get contract instance
function getContract() {
  if (!AGENT_DEPLOYER_PRIVATE_KEY) {
    throw new Error("AGENT_DEPLOYER_PRIVATE_KEY not set");
  }
  const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
  const wallet = new ethers.Wallet(AGENT_DEPLOYER_PRIVATE_KEY, provider);
  return new ethers.Contract(FARCASTER_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}

// Check if user has birth data
router.get("/check-data", async (req: Request, res: Response) => {
  try {
    const userId = await getPrivyUserId(req);
    
    const user = await db.query.farcasterUsers.findFirst({
      where: eq(farcasterUsers.userId, userId)
    });

    res.json({ hasData: !!user, userId }); // Include userId for debugging
  } catch (error) {
    console.error("Error checking user data:", error);
    res.status(500).json({ error: "Failed to check user data" });
  }
});

// Save birth data
router.post("/save-birth-data", async (req: Request, res: Response) => {
  try {
    const userId = await getPrivyUserId(req);
    const { dob, tob, location, lat, lon } = req.body;

    // Validate required fields
    if (!dob || !tob || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // For demo, use approximate coordinates based on location
    const coordinates = lat && lon ? { lat, lon } : getCoordinates(location);

    // Check if user exists
    const existingUser = await db.query.farcasterUsers.findFirst({
      where: eq(farcasterUsers.userId, userId)
    });

    // Generate ZK commitment for birth data
    const positions = {
      planets: {
        sun: 0, moon: 0, mercury: 0, venus: 0, mars: 0, jupiter: 0, saturn: 0
      },
      asc: 0,
      mc: 0
    };
    
    const { commitment } = await generateZKProof(
      { dob, tob, tz: "UTC", lat: coordinates.lat, lon: coordinates.lon },
      positions
    );

    if (existingUser) {
      // Update existing user
      await db.update(farcasterUsers)
        .set({
          dob,
          tob,
          location,
          lat: coordinates.lat,
          lon: coordinates.lon,
          updatedAt: new Date()
        })
        .where(eq(farcasterUsers.userId, userId));
    } else {
      // Insert new user
      await db.insert(farcasterUsers).values({
        userId,
        dob,
        tob,
        location,
        lat: coordinates.lat,
        lon: coordinates.lon
      });
      
      // Register user on-chain with ZK commitment
      try {
        const contract = getContract();
        
        // Use the user's actual wallet address if available
        const walletAddress = req.headers['x-wallet-address'] as string;
        const userAddress = walletAddress || ethers.Wallet.createRandom().address;
        
        const commitmentBytes = ethers.zeroPadValue(ethers.toBeHex(BigInt(`0x${commitment}`)), 32);
        
        const tx = await contract.registerUser(commitmentBytes);
        await tx.wait();
        console.log(`✅ User ${userId} registered on-chain with commitment: ${commitment.substring(0, 20)}...`);
        console.log(`   Wallet: ${userAddress}`);
      } catch (error) {
        console.error("Failed to register on-chain:", error);
        // Continue anyway - off-chain data is saved
      }
    }

    res.json({ success: true, commitment: commitment.substring(0, 20) + "..." });
  } catch (error) {
    console.error("Error saving birth data:", error);
    res.status(500).json({ error: "Failed to save birth data" });
  }
});

// Get daily prediction
router.get("/daily-prediction", async (req: Request, res: Response) => {
  try {
    const userId = await getPrivyUserId(req);
    const today = new Date().toISOString().split('T')[0];

    // Check if we already have a prediction for today
    const existingPrediction = await db.query.farcasterPredictions.findFirst({
      where: and(
        eq(farcasterPredictions.userId, userId),
        eq(farcasterPredictions.date, today)
      )
    });

    if (existingPrediction) {
      return res.json({
        date: existingPrediction.date,
        prediction: existingPrediction.prediction,
        luckyNumber: existingPrediction.luckyNumber,
        luckyColor: existingPrediction.luckyColor,
        mood: existingPrediction.mood
      });
    }

    // Get user's birth data
    const user = await db.query.farcasterUsers.findFirst({
      where: eq(farcasterUsers.userId, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User data not found" });
    }

    // Generate prediction using AI agent
    const prediction = await generateDailyPrediction(user);

    // Save prediction
    await db.insert(farcasterPredictions).values({
      userId,
      date: today,
      prediction: prediction.text,
      luckyNumber: prediction.luckyNumber,
      luckyColor: prediction.luckyColor,
      mood: prediction.mood
    });

    res.json({
      date: today,
      prediction: prediction.text,
      luckyNumber: prediction.luckyNumber,
      luckyColor: prediction.luckyColor,
      mood: prediction.mood
    });
  } catch (error) {
    console.error("Error getting daily prediction:", error);
    res.status(500).json({ error: "Failed to get prediction" });
  }
});

// Rate prediction
router.post("/rate-prediction", async (req: Request, res: Response) => {
  try {
    const userId = await getPrivyUserId(req);
    const { rating, date } = req.body;

    if (!rating || !date) {
      return res.status(400).json({ error: "Missing rating or date" });
    }

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 0 and 5" });
    }

    // Check if rating already exists
    const existingRating = await db.query.farcasterRatings.findFirst({
      where: and(
        eq(farcasterRatings.userId, userId),
        eq(farcasterRatings.date, date)
      )
    });

    if (existingRating) {
      // Update existing rating
      await db.update(farcasterRatings)
        .set({ rating, updatedAt: new Date() })
        .where(and(
          eq(farcasterRatings.userId, userId),
          eq(farcasterRatings.date, date)
        ));
    } else {
      // Insert new rating
      await db.insert(farcasterRatings).values({
        userId,
        date,
        rating
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error rating prediction:", error);
    res.status(500).json({ error: "Failed to save rating" });
  }
});

// Get user statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const userId = await getPrivyUserId(req);

    const ratings = await db.query.farcasterRatings.findMany({
      where: eq(farcasterRatings.userId, userId),
      orderBy: desc(farcasterRatings.date)
    });

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    res.json({
      totalPredictions: totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      recentRatings: ratings.slice(0, 7)
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// Ask a specific question about the day
router.post("/ask-question", async (req: Request, res: Response) => {
  try {
    const userId = await getPrivyUserId(req);
    const { question, date } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Get user's birth data
    const user = await db.query.farcasterUsers.findFirst({
      where: eq(farcasterUsers.userId, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User data not found" });
    }

    // Get today's prediction for context
    const prediction = await db.query.farcasterPredictions.findFirst({
      where: and(
        eq(farcasterPredictions.userId, userId),
        eq(farcasterPredictions.date, date || new Date().toISOString().split('T')[0])
      )
    });

    // Generate personalized answer using AI
    const answer = await generatePersonalizedAnswer(user, prediction, question);

    res.json({ answer });
  } catch (error) {
    console.error("Error answering question:", error);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

// Helper function to generate personalized answer
async function generatePersonalizedAnswer(user: any, prediction: any, question: string): Promise<string> {
  try {
    // Parse birth data
    const birthDate = DateTime.fromISO(user.dob, { zone: 'utc' });
    const [hours, minutes] = user.tob.split(':').map(Number);
    const birthDateTime = birthDate.set({ hour: hours, minute: minutes });
    
    // Calculate natal chart
    const { planets: natalPositions, retro: natalRetro } = calculatePlanetaryPositions(birthDateTime);
    
    const natalAsc = calculateAscendant(
      birthDateTime.year,
      birthDateTime.month,
      birthDateTime.day,
      birthDateTime.hour + birthDateTime.minute / 60,
      user.lat,
      user.lon
    );
    
    const natalChart = {
      planets: natalPositions,
      retro: natalRetro,
      asc: natalAsc,
      mc: (natalAsc + 90) % 360,
    };
    
    // Calculate today's transits
    const now = DateTime.now().setZone('utc');
    const { planets: transitPositions, retro: transitRetro } = calculatePlanetaryPositions(now);
    
    const transitChart = {
      planets: transitPositions,
      retro: transitRetro,
      asc: 0,
      mc: 0,
    };
    
    // Calculate day score for context
    const { calculateDayScore } = await import('../lib/astro/scoring');
    const { score: dayScore, factors } = calculateDayScore(natalChart, transitChart, 1.3);
    
    // Use the AI chat function to generate personalized answer
    const { generateChatResponse } = await import('../lib/agents/llm');
    
    const answer = await generateChatResponse(
      question,
      {
        dayScore,
        transitFactors: factors,
        predictionSummary: prediction?.prediction || "Today's cosmic energies",
        targetDate: now.toISODate() || now.toFormat('yyyy-MM-dd'),
        agentPersonality: "warm, personal, and relatable, speaking directly to the user as 'you' like a trusted friend who knows them well"
      },
      [] // No conversation history for now
    );
    
    return answer;
  } catch (error) {
    console.error("Error generating personalized answer:", error);
    
    // Fallback response
    return `Based on today's cosmic energies, ${question.toLowerCase().includes('should') ? "trust your intuition on this" : "the stars suggest staying mindful and balanced"}. Your unique birth chart shows ${question.toLowerCase().includes('career') ? "professional" : question.toLowerCase().includes('love') || question.toLowerCase().includes('relationship') ? "relationship" : "personal"} energies are active today. Take things one step at a time and listen to your inner wisdom.`;
  }
}

// Helper function to generate daily prediction using AI
async function generateDailyPrediction(user: any) {
  try {
    // Parse birth data
    const birthDate = DateTime.fromISO(user.dob, { zone: 'utc' });
    const [hours, minutes] = user.tob.split(':').map(Number);
    const birthDateTime = birthDate.set({ hour: hours, minute: minutes });
    
    // Calculate natal chart (birth positions)
    const { planets: natalPositions, retro: natalRetro } = calculatePlanetaryPositions(birthDateTime);
    
    const natalAsc = calculateAscendant(
      birthDateTime.year,
      birthDateTime.month,
      birthDateTime.day,
      birthDateTime.hour + birthDateTime.minute / 60,
      user.lat,
      user.lon
    );
    
    const natalChart = {
      planets: natalPositions,
      retro: natalRetro,
      asc: natalAsc,
      mc: (natalAsc + 90) % 360, // Simplified MC calculation
    };
    
    // Calculate today's transits (current planetary positions)
    const now = DateTime.now().setZone('utc');
    const { planets: transitPositions, retro: transitRetro } = calculatePlanetaryPositions(now);
    
    const transitChart = {
      planets: transitPositions,
      retro: transitRetro,
      asc: 0, // Not needed for transits
      mc: 0,
    };
    
    // Generate AI prediction using Auriga agent (optimistic personality)
    const prediction = await generateAurigaPrediction(
      natalChart,
      transitChart,
      "What does today hold for me?",
      now.toISODate() || now.toFormat('yyyy-MM-dd')
    );
    
    // Generate lucky elements based on planetary positions
    const luckyNumber = Math.floor((transitPositions.sun % 99) + 1);
    const luckyColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"];
    const luckyColor = luckyColors[Math.floor(transitPositions.moon / 51.4) % luckyColors.length];
    const moods = ["Energetic", "Calm", "Focused", "Creative", "Social", "Reflective"];
    const mood = moods[Math.floor(prediction.dayScore / 17) % moods.length];
    
    console.log(`✨ AI Prediction Generated: Score ${prediction.dayScore}/100`);
    
    return {
      text: `${prediction.summary}\n\n${prediction.highlights}`,
      luckyNumber,
      luckyColor,
      mood,
      dayScore: prediction.dayScore,
      factors: prediction.factors,
    };
  } catch (error) {
    console.error("Error generating AI prediction:", error);
    
    // Fallback to simple prediction if AI fails
    const sunSign = getSunSign(new Date(user.dob));
    return {
      text: `Today brings interesting cosmic energy for ${sunSign}. Stay open to new opportunities and trust your intuition. Focus on what matters most to you.`,
      luckyNumber: Math.floor(Math.random() * 99) + 1,
      luckyColor: "#4ECDC4",
      mood: "Balanced",
      dayScore: 50,
      factors: "General astrological influences",
    };
  }
}

// Helper function to get sun sign
function getSunSign(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

// Helper function to get moon phase
function getMoonPhase(date: Date): string {
  const phases = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", 
                  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
  const dayOfMonth = date.getDate();
  const phaseIndex = Math.floor((dayOfMonth / 30) * 8) % 8;
  return phases[phaseIndex];
}

// Helper function to get approximate coordinates
function getCoordinates(location: string): { lat: number; lon: number } {
  // Simplified coordinate mapping - in production, use geocoding API
  const locationMap: { [key: string]: { lat: number; lon: number } } = {
    "new york": { lat: 40.7128, lon: -74.0060 },
    "los angeles": { lat: 34.0522, lon: -118.2437 },
    "chicago": { lat: 41.8781, lon: -87.6298 },
    "london": { lat: 51.5074, lon: -0.1278 },
    "paris": { lat: 48.8566, lon: 2.3522 },
    "tokyo": { lat: 35.6762, lon: 139.6503 },
    "mumbai": { lat: 19.0760, lon: 72.8777 },
    "delhi": { lat: 28.7041, lon: 77.1025 }
  };

  const normalized = location.toLowerCase().trim();
  for (const [key, coords] of Object.entries(locationMap)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }

  // Default to New York if location not found
  return { lat: 40.7128, lon: -74.0060 };
}

export default router;

