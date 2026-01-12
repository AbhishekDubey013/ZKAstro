/**
 * Cleanup script to delete old predictions and free up database memory
 * 
 * Usage:
 *   npx tsx --env-file=.env scripts/cleanup-old-predictions.ts [days]
 * 
 * Examples:
 *   npx tsx --env-file=.env scripts/cleanup-old-predictions.ts 30  # Delete predictions older than 30 days
 *   npx tsx --env-file=.env scripts/cleanup-old-predictions.ts 0     # Delete ALL predictions
 */

import 'dotenv/config';
import { db } from '../server/db';
import { predictionRequests, predictionAnswers, chatMessages, reputationEvents } from '@shared/schema';
import { lt, inArray, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';

async function cleanupOldPredictions(daysToKeep: number = 30) {
  console.log(`🧹 Starting cleanup of predictions older than ${daysToKeep} days...\n`);

  try {
    // Calculate cutoff date
    const cutoffDate = DateTime.now().minus({ days: daysToKeep }).toJSDate();
    
    if (daysToKeep === 0) {
      console.log('⚠️  WARNING: Deleting ALL predictions!');
    } else {
      console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}\n`);
    }

    // Step 1: Find prediction requests to delete
    const requestsToDelete = daysToKeep === 0
      ? await db.select({ id: predictionRequests.id })
          .from(predictionRequests)
      : await db.select({ id: predictionRequests.id })
          .from(predictionRequests)
          .where(lt(predictionRequests.createdAt, cutoffDate));

    const requestIds = requestsToDelete.map(r => r.id);
    
    if (requestIds.length === 0) {
      console.log('✅ No old predictions found to delete.');
      return;
    }

    console.log(`📊 Found ${requestIds.length} prediction request(s) to delete\n`);

    // Step 2: Delete related data in correct order (respecting foreign keys)
    
    // Delete chat messages
    console.log('🗑️  Deleting chat messages...');
    if (requestIds.length > 0) {
      await db
        .delete(chatMessages)
        .where(inArray(chatMessages.predictionRequestId, requestIds));
    }
    console.log(`   ✅ Deleted chat messages for ${requestIds.length} request(s)`);

    // Delete reputation events
    console.log('🗑️  Deleting reputation events...');
    if (requestIds.length > 0) {
      await db
        .delete(reputationEvents)
        .where(inArray(reputationEvents.requestId, requestIds));
    }
    console.log(`   ✅ Deleted reputation events for ${requestIds.length} request(s)`);

    // Delete prediction answers
    console.log('🗑️  Deleting prediction answers...');
    if (requestIds.length > 0) {
      await db
        .delete(predictionAnswers)
        .where(inArray(predictionAnswers.requestId, requestIds));
    }
    console.log(`   ✅ Deleted prediction answers for ${requestIds.length} request(s)`);

    // Step 3: Delete prediction requests
    console.log('🗑️  Deleting prediction requests...');
    const deletedRequests = daysToKeep === 0
      ? await db.delete(predictionRequests)
      : await db.delete(predictionRequests)
          .where(lt(predictionRequests.createdAt, cutoffDate));
    console.log(`   ✅ Deleted ${requestIds.length} prediction request(s)\n`);

    // Summary
    console.log('✨ Cleanup complete!');
    console.log(`   📉 Deleted ${requestIds.length} prediction request(s) and all related data`);
    console.log(`   💾 Database memory freed up\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const daysArg = process.argv[2];
const daysToKeep = daysArg ? parseInt(daysArg, 10) : 30;

if (isNaN(daysToKeep) || daysToKeep < 0) {
  console.error('❌ Invalid days argument. Must be a number >= 0');
  console.log('\nUsage: tsx scripts/cleanup-old-predictions.ts [days]');
  console.log('  days: Number of days to keep (0 = delete all)');
  process.exit(1);
}

// Run cleanup
cleanupOldPredictions(daysToKeep)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

