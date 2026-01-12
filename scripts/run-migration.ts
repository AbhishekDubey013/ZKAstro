/**
 * Run Database Migration Script
 * 
 * Applies pending migrations to the database.
 * 
 * Usage: npx tsx --env-file=.env scripts/run-migration.ts
 */

import { db } from '../server/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Running database migration...\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '0002_add_system_prompt.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('');

    // Execute migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Migration applied successfully!');
    console.log('   Column "system_prompt" added to agents table');
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('ℹ️  Migration already applied (column exists)');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

