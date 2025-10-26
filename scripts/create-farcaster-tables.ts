import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createFarcasterTables() {
  console.log("🔧 Creating Farcaster tables...\n");

  try {
    // Create farcaster_users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS zkastro.farcaster_users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT UNIQUE NOT NULL,
        dob TEXT NOT NULL,
        tob TEXT NOT NULL,
        location TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log("✅ Created farcaster_users table");

    // Create farcaster_predictions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS zkastro.farcaster_predictions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        prediction TEXT NOT NULL,
        lucky_number INTEGER NOT NULL,
        lucky_color TEXT NOT NULL,
        mood TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log("✅ Created farcaster_predictions table");

    // Create farcaster_ratings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS zkastro.farcaster_ratings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        rating INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log("✅ Created farcaster_ratings table");

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_farcaster_users_user_id ON zkastro.farcaster_users(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_farcaster_predictions_user_id ON zkastro.farcaster_predictions(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_farcaster_predictions_date ON zkastro.farcaster_predictions(date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_farcaster_ratings_user_id ON zkastro.farcaster_ratings(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_farcaster_ratings_date ON zkastro.farcaster_ratings(date)`);
    console.log("✅ Created indexes");

    console.log("\n🎉 All Farcaster tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

createFarcasterTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

