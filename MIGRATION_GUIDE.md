# Migration Guide: Replit → Supabase + Vercel

This document outlines the migration from Replit services to Supabase and Vercel.

## Overview

**From:**
- Replit Auth (OIDC)
- Neon PostgreSQL (via Replit)
- Replit Object Storage
- Replit Hosting

**To:**
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Vercel Deployment

## Prerequisites

1. **Supabase Account**: Create account at https://supabase.com
2. **Vercel Account**: Create account at https://vercel.com
3. **Backup Current Data**: Export your database before migration

## Step-by-Step Migration

### 1. Set Up Supabase Project

1. Go to https://supabase.com and create a new project
2. Note down:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key (for client-side)
   - Service Role Key (for server-side, keep secret!)
   - Database Connection String (PostgreSQL)

### 2. Database Migration

#### Export Current Database
```bash
# From your Neon dashboard or using pg_dump
pg_dump $DATABASE_URL > backup.sql
```

#### Import to Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Run your schema migrations (from `migrations/` folder)
3. Import data using Supabase's import tool or SQL Editor

#### Update Connection
- Update `DATABASE_URL` environment variable to Supabase connection string
- Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

### 3. Authentication Migration

**Changes Made:**
- Replaced `server/replitAuth.ts` with `server/supabaseAuth.ts`
- Updated client-side auth calls
- Migrated user data to Supabase Auth

**User Migration:**
- Existing users need to sign up again (or use Supabase Admin API to migrate)
- User IDs will change (Supabase uses UUIDs)

### 4. Storage Migration

**Changes Made:**
- Replaced `server/objectStorage.ts` with `server/supabaseStorage.ts`
- Updated upload/download endpoints
- Migrated existing images to Supabase Storage

**Image Migration:**
1. List all images from Replit Object Storage
2. Download each image
3. Upload to Supabase Storage bucket
4. Update database records with new paths

### 5. Environment Variables

Create `.env.local` file with:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Session
SESSION_SECRET=your-random-secret-key

# Email (Resend - keep existing)
RESEND_API_KEY=your-resend-key

# App
NODE_ENV=production
PORT=5000
```

### 6. Vercel Deployment

#### Option A: Serverless Functions (Recommended)
- Convert Express routes to Vercel API routes
- Deploy frontend as static site
- Use Vercel Edge Functions for auth

#### Option B: Express on Vercel
- Use `@vercel/node` to wrap Express app
- Deploy as serverless function
- Less optimal but faster migration

## Testing Checklist

- [ ] User registration/login works
- [ ] Admin panel accessible
- [ ] Employee panel accessible
- [ ] Booking flow works (public)
- [ ] Image uploads work
- [ ] Image downloads work
- [ ] Database queries work
- [ ] Email confirmations work
- [ ] Multi-tenant isolation works

## Rollback Plan

If migration fails:
1. Switch back to `main` branch: `git checkout main`
2. Restore database from backup
3. Revert environment variables
4. Continue using Replit until issues resolved

## Post-Migration

1. Update DNS if using custom domain
2. Monitor Supabase usage (free tier limits)
3. Set up Supabase backups
4. Update documentation
5. Delete old Replit project (after confirming everything works)

## Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Migration Issues: Check GitHub issues or Supabase Discord

