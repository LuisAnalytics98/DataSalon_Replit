# Database Connection Fix

## Problem
The Neon serverless driver uses WebSocket connections which don't work well with Supabase. Error:
```
ENOTFOUND db.ujgdkuhztbtzseqotbpe.supabase.co
```

## Solution
Switched from Neon's serverless driver to standard `postgres` client which works with Supabase.

## Changes Made

1. **Added `postgres` package** to `package.json`
2. **Updated `server/db.ts`** to use `postgres` client instead of Neon's WebSocket driver
3. **Changed Drizzle adapter** from `drizzle-orm/neon-serverless` to `drizzle-orm/postgres-js`

## Next Steps

1. **Install the new package:**
   ```cmd
   npm install
   ```

2. **Restart the server:**
   ```cmd
   npm run dev
   ```

The database connection should now work with Supabase!

## Connection String Format

Your `.env.local` has the correct format:
```
DATABASE_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
```

This should now work with the standard postgres client.

