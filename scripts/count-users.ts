import "dotenv/config";
import { db } from "../server/db";
import { users, charts, predictionRequests } from "../shared/schema";
import { count, sql } from "drizzle-orm";

async function countUsers() {
  try {
    console.log("📊 Fetching user statistics...\n");

    // Count total users
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);
    const totalUsers = totalUsersResult.count;

    // Count users with charts
    const [usersWithChartsResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${charts.userId})` })
      .from(charts)
      .where(sql`${charts.userId} IS NOT NULL`);
    const usersWithCharts = Number(usersWithChartsResult.count);

    // Count users with prediction requests
    const [usersWithRequestsResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${predictionRequests.userId})` })
      .from(predictionRequests)
      .where(sql`${predictionRequests.userId} IS NOT NULL`);
    const usersWithRequests = Number(usersWithRequestsResult.count);

    // Get users created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [recentUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${sevenDaysAgo}`);
    const recentUsers = recentUsersResult.count;

    console.log("═══════════════════════════════════════");
    console.log("👥 USER STATISTICS");
    console.log("═══════════════════════════════════════");
    console.log(`Total Users:              ${totalUsers}`);
    console.log(`Users with Charts:        ${usersWithCharts}`);
    console.log(`Users with Predictions:   ${usersWithRequests}`);
    console.log(`New Users (Last 7 days):  ${recentUsers}`);
    console.log("═══════════════════════════════════════\n");

    // Additional breakdown
    if (totalUsers > 0) {
      const activeUsers = Math.max(usersWithCharts, usersWithRequests);
      const engagementRate = ((activeUsers / totalUsers) * 100).toFixed(1);
      console.log(`Active Users:            ${activeUsers}`);
      console.log(`Engagement Rate:         ${engagementRate}%\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error counting users:", error);
    process.exit(1);
  }
}

countUsers();

