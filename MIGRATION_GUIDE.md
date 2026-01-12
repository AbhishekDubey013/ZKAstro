# Database Migration Guide

## Fix: `column "system_prompt" does not exist`

The `system_prompt` column was added to the schema but needs to be added to your database.

## Option 1: Run Migration Script (Recommended)

### On Railway:

1. **Go to Railway Dashboard** → Your Project → Your Service
2. **Click "Deployments"** → Click the latest deployment
3. **Click "View Logs"** or use **Railway CLI**:

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration
railway run npm run db:migrate
```

### Or via Railway Dashboard:

1. Go to your service → **Settings** → **Deploy**
2. Add a **one-off command**:
   ```
   npm run db:migrate
   ```
3. Click **"Deploy"**

## Option 2: Run SQL Directly

### Via Neon Console (if using Neon):

1. Go to [Neon Console](https://console.neon.tech)
2. Select your database
3. Open **SQL Editor**
4. Run:

```sql
ALTER TABLE "zkastro"."agents" ADD COLUMN IF NOT EXISTS "system_prompt" text;
```

### Via Railway Database:

1. Railway Dashboard → Your Project → **Database** service
2. Click **"Connect"** → Copy connection string
3. Use any PostgreSQL client (psql, DBeaver, etc.):

```sql
ALTER TABLE "zkastro"."agents" ADD COLUMN IF NOT EXISTS "system_prompt" text;
```

## Option 3: Use Drizzle Push (Development)

**⚠️ Warning**: Only use in development. This will sync schema but may cause data loss.

```bash
npm run db:push
```

## Verify Migration

After running the migration, verify it worked:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'zkastro' 
  AND table_name = 'agents' 
  AND column_name = 'system_prompt';
```

Should return:
```
column_name   | data_type
--------------|----------
system_prompt | text
```

## Update Existing Agents (Optional)

After migration, update existing agents with system prompts:

```bash
npm run update-agent-prompts
```

Or run the script:
```bash
npx tsx --env-file=.env scripts/update-agent-prompts.ts
```

---

## Quick Fix for Railway

**Fastest way on Railway:**

1. Railway Dashboard → Your Service → **Settings** → **Variables**
2. Add temporary variable: `RUN_MIGRATION=true`
3. In your `server/index.ts` or create a startup script that checks this and runs migration
4. Or use Railway's **"Deploy"** → **"Run Command"** feature

**One-liner via Railway CLI:**
```bash
railway run --service your-service-name -- "npx tsx scripts/run-migration.ts"
```

