import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { 
  farcasterUsers, 
  farcasterPredictions, 
  farcasterRatings 
} from "../shared/schema";

const router = Router();

// Check if user has birth data
router.get("/check-data", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId || "demo-user"; // For testing
    
    const user = await db.query.farcasterUsers.findFirst({
      where: eq(farcasterUsers.userId, userId)
    });

    res.json({ hasData: !!user });
  } catch (error) {
    console.error("Error checking user data:", error);
    res.status(500).json({ error: "Failed to check user data" });
  }
});

// Save birth data
router.post("/save-birth-data", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId || "demo-user";
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
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving birth data:", error);
    res.status(500).json({ error: "Failed to save birth data" });
  }
});

// Get daily prediction
router.get("/daily-prediction", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId || "demo-user";
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
    const userId = req.session?.userId || "demo-user";
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
    const userId = req.session?.userId || "demo-user";

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

// Helper function to generate daily prediction
async function generateDailyPrediction(user: any) {
  // Calculate current planetary transits
  const transits = calculateTransits(user.dob, user.tob, user.lat, user.lon);
  
  // Generate prediction using AI
  const predictionText = await generatePredictionText(transits, user);
  
  // Generate lucky elements
  const luckyNumber = Math.floor(Math.random() * 99) + 1;
  const luckyColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"];
  const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
  const moods = ["Energetic", "Calm", "Focused", "Creative", "Social", "Reflective"];
  const mood = moods[Math.floor(Math.random() * moods.length)];

  return {
    text: predictionText,
    luckyNumber,
    luckyColor,
    mood
  };
}

// Helper function to calculate transits (simplified)
function calculateTransits(dob: string, tob: string, lat: number, lon: number) {
  // This is a simplified version - in production, use astronomia library
  const birthDate = new Date(dob);
  const today = new Date();
  const daysSinceBirth = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    sunSign: getSunSign(birthDate),
    moonPhase: getMoonPhase(today),
    daysSinceBirth
  };
}

// Helper function to generate prediction text
async function generatePredictionText(transits: any, user: any): Promise<string> {
  // In production, this would call your AI agent
  // For now, generate contextual predictions based on transits
  
  const predictions = [
    `Today brings excellent energy for ${transits.sunSign}. Focus on communication and new connections. Your natural charisma will shine through in social situations.`,
    `The cosmic alignment favors introspection for ${transits.sunSign} today. Take time to reflect on your goals and priorities. Trust your intuition.`,
    `A day of creativity and inspiration awaits ${transits.sunSign}. Express yourself through art, writing, or meaningful conversations. Your ideas will resonate with others.`,
    `Financial opportunities may present themselves to ${transits.sunSign} today. Stay alert for chances to improve your situation. Trust your judgment.`,
    `Relationships take center stage for ${transits.sunSign}. Reach out to loved ones and strengthen your bonds. Meaningful connections bring joy.`,
    `Your professional life gets a boost today, ${transits.sunSign}. Take initiative on projects and showcase your skills. Recognition is on the horizon.`,
    `Health and wellness are highlighted for ${transits.sunSign}. Focus on self-care and listen to your body's needs. Balance is key.`
  ];

  return predictions[Math.floor(Math.random() * predictions.length)];
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

