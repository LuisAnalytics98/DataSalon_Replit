# Database Migration Guide

## Option 1: Use Drizzle to Push Schema (Recommended)

The easiest way is to use Drizzle's `db:push` command, which will automatically create all tables based on your schema:

```bash
npm run db:push
```

This will:
- Read your schema from `shared/schema.ts`
- Compare it with your Supabase database
- Create any missing tables/columns
- **WARNING**: It won't delete columns, but be careful with data

## Option 2: Use the SQL Schema File

I've created `database-schema.sql` which contains all the table definitions.

### Steps:

1. **Go to Supabase SQL Editor:**
   - https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/sql/new

2. **Copy and paste the contents of `database-schema.sql`**

3. **Run the SQL** - This will create all tables

4. **Verify tables were created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

## Option 3: Export Current Database Structure

If you want to see what's currently in your Replit/Neon database:

1. **Set your current DATABASE_URL** (temporarily in .env.local or as environment variable)
2. **Run the export script:**
   ```bash
   node export-database-schema.js
   ```

This will create:
- `database-export.json` - Full schema with constraints, indexes, row counts
- `database-export.sql` - SQL CREATE statements

## Database Tables Overview

Your application uses these tables:

1. **sessions** - Express session storage
2. **users** - Custom users table (Supabase Auth uses `auth.users`)
3. **salons** - Multi-tenant salon data
4. **salon_users** - User-salon relationships with roles
5. **clients** - Client information
6. **services** - Services offered by salons
7. **stylists** - Stylists/professionals
8. **stylist_availability** - Stylist working hours
9. **bookings** - Appointment bookings
10. **salon_inquiries** - Inquiries from salon owners

## Important Notes

### Supabase Auth Integration

- Supabase has its own `auth.users` table
- Your `users` table is a custom table that stores additional user info
- When a user signs up via Supabase Auth, you'll need to sync their data to your `users` table
- The `supabaseAuth.ts` file handles this automatically

### Data Migration

If you have existing data in Replit/Neon:

1. **Export data from Replit/Neon:**
   ```bash
   pg_dump $DATABASE_URL --data-only > data-export.sql
   ```

2. **Import to Supabase:**
   - Use Supabase's import tool, or
   - Run the SQL in Supabase SQL Editor

### User IDs

- **Replit Auth**: Uses custom user IDs
- **Supabase Auth**: Uses UUIDs
- You'll need to migrate user IDs when moving data
- New users will get Supabase UUIDs automatically

## Quick Start

1. **Create schema in Supabase:**
   ```bash
   npm run db:push
   ```

2. **Or use SQL file:**
   - Open `database-schema.sql` in Supabase SQL Editor
   - Run it

3. **Verify:**
   - Check tables in Supabase Dashboard > Table Editor
   - You should see all 10 tables

## Troubleshooting

### "relation does not exist"
- Run the schema creation first
- Check that you're connected to the right database

### "permission denied"
- Make sure you're using the service role key for admin operations
- Check Supabase project settings

### "duplicate key value"
- Tables might already exist
- Use `CREATE TABLE IF NOT EXISTS` (included in SQL file)
- Or drop tables first if you want a fresh start

