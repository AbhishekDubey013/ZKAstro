/**
 * Migration script to link orphaned charts to a Privy user
 * 
 * Usage:
 * tsx migrate-user-charts.ts <privyUserId>
 * 
 * Example:
 * tsx migrate-user-charts.ts 0x2EDDFbD84A7D6c90CFd418d34228d5C077a83CF8
 */

import { db } from './server/db';
import { charts, users } from '@shared/schema';
import { eq, isNull } from 'drizzle-orm';

async function migrateCharts(privyUserId: string) {
  console.log(`🔄 Migrating orphaned charts to user: ${privyUserId}`);
  
  // 1. Ensure user exists
  const [user] = await db
    .insert(users)
    .values({
      id: privyUserId,
      email: privyUserId.startsWith('0x') ? `${privyUserId}@wallet` : privyUserId,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`✅ User ensured: ${user.id}`);

  // 2. Find all orphaned charts (userId is null)
  const orphanedCharts = await db
    .select()
    .from(charts)
    .where(isNull(charts.userId));

  console.log(`📊 Found ${orphanedCharts.length} orphaned charts`);

  if (orphanedCharts.length === 0) {
    console.log('✅ No charts to migrate');
    return;
  }

  // 3. Ask for confirmation
  console.log('\n📋 Charts to migrate:');
  orphanedCharts.forEach((chart, idx) => {
    console.log(`  ${idx + 1}. Chart ${chart.id.substring(0, 8)}... (created: ${chart.createdAt})`);
  });

  // 4. Update all orphaned charts to link to this user
  const result = await db
    .update(charts)
    .set({ userId: privyUserId })
    .where(isNull(charts.userId))
    .returning();

  console.log(`\n✅ Successfully migrated ${result.length} charts to user ${privyUserId}`);
  console.log(`\n🎉 Done! You can now login and see "Know Your Day"`);
}

// Main
const privyUserId = process.argv[2];

if (!privyUserId) {
  console.error('❌ Error: Please provide a Privy user ID');
  console.error('\nUsage:');
  console.error('  tsx migrate-user-charts.ts <privyUserId>');
  console.error('\nExample:');
  console.error('  tsx migrate-user-charts.ts 0x2EDDFbD84A7D6c90CFd418d34228d5C077a83CF8');
  process.exit(1);
}

migrateCharts(privyUserId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });

