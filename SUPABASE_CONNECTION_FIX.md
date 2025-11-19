# Supabase Connection String Fix

## Problem
DNS lookup failing for `db.ujgdkuhztbtzseqotbpe.supabase.co`

## Possible Causes

1. **Supabase project is paused** - Free tier projects pause after inactivity
2. **Wrong connection string format** - Need to use correct format from Supabase
3. **Network/DNS issue** - Internet connection problem

## Solution Steps

### Step 1: Check Supabase Project Status

1. Go to: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe
2. Check if project shows as "Active" or "Paused"
3. If paused, click "Restore" to reactivate

### Step 2: Get Correct Connection String

1. In Supabase Dashboard, go to: **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab (not JDBC or others)
4. Copy the connection string
5. It should look like one of these formats:

**Direct connection:**
```
postgresql://postgres:[PASSWORD]@db.ujgdkuhztbtzseqotbpe.supabase.co:5432/postgres
```

**Connection pooler (recommended):**
```
postgresql://postgres.ujgdkuhztbtzseqotbpe:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 3: Update .env.local

Replace the `DATABASE_URL` in `.env.local` with the correct connection string from Supabase Dashboard.

### Step 4: Test Connection

Run:
```cmd
node test-db-connection.js
```

This will test:
- DNS lookup
- Connection string format
- Basic connectivity

## Alternative: Use Connection Pooler

If direct connection doesn't work, try the connection pooler URL from Supabase Dashboard. It's more reliable and handles connections better.

## Quick Fix

1. **Check Supabase Dashboard** - Make sure project is active
2. **Get fresh connection string** - Copy from Settings > Database
3. **Update .env.local** - Replace DATABASE_URL
4. **Test again** - Run `node test-db-connection.js`

