# Vercel Environment Variables Checklist

Use this checklist to ensure all required environment variables are set in your Vercel project.

## Required Environment Variables

### 1. Supabase Configuration (REQUIRED)
- **`SUPABASE_URL`** - Your Supabase project URL
  - Example: `https://ujgdkuhztbtzseqotbpe.supabase.co`
  - Find in: Supabase Dashboard → Settings → API → Project URL

- **`SUPABASE_ANON_KEY`** - Your Supabase anonymous/public key
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Find in: Supabase Dashboard → Settings → API → Project API keys → anon/public

- **`SUPABASE_SERVICE_ROLE_KEY`** - Your Supabase service role key (KEEP SECRET!)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Find in: Supabase Dashboard → Settings → API → Project API keys → service_role
  - ⚠️ **WARNING**: This key has admin access. Never expose it publicly.

- **`SUPABASE_STORAGE_BUCKET`** - Your Supabase storage bucket name
  - Example: `salon-assets`
  - Default: `salon-assets` (optional, has default)
  - Find in: Supabase Dashboard → Storage → Buckets

### 2. Database Configuration (REQUIRED)
- **`DATABASE_URL`** - PostgreSQL connection string
  - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
  - Example: `postgresql://postgres.ujgdkuhztbtzseqotbpe:password@aws-1-us-west-1.pooler.supabase.com:5432/postgres`
  - Find in: Supabase Dashboard → Settings → Database → Connection string → Connection pooling
  - Use the **Connection pooling** URL (not the direct connection)

### 3. Session & Security (REQUIRED)
- **`SESSION_SECRET`** - Secret key for session encryption
  - Generate a random string (at least 32 characters)
  - Example: `b07e7d58871c97701fe35fda7b5ec3bdc92862d94b79830bf2b474b5940d1f15`
  - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4. Application Configuration
- **`NODE_ENV`** - Environment mode
  - Value: `production` (for Vercel)
  - This is usually set automatically by Vercel, but you can set it explicitly

- **`PORT`** - Server port (optional)
  - Default: `5000`
  - Vercel sets this automatically, but you can specify it

### 5. Super Admin (REQUIRED for admin access)
- **`SUPER_ADMIN_EMAIL`** - Email address of the super admin user
  - Example: `datasalon98@gmail.com`
  - This email will have super admin privileges

### 6. Email Service (OPTIONAL but recommended)
- **`RESEND_API_KEY`** - Resend API key for sending emails
  - Get from: https://resend.com/api-keys
  - Required if you want booking confirmation emails to work
  - If not set, email functionality will be disabled

## Optional Environment Variables

These are not required but may be useful:

- **`VERCEL`** - Automatically set by Vercel (don't set manually)
- **`VERCEL_URL`** - Automatically set by Vercel (don't set manually)

## How to Set Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter the variable name and value
6. Select the environments (Production, Preview, Development)
7. Click **Save**
8. **Redeploy** your application for changes to take effect

## Quick Checklist

Copy this checklist and check off each variable as you add it:

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_STORAGE_BUCKET` (optional, defaults to `salon-assets`)
- [ ] `DATABASE_URL`
- [ ] `SESSION_SECRET`
- [ ] `NODE_ENV` (set to `production`)
- [ ] `SUPER_ADMIN_EMAIL`
- [ ] `RESEND_API_KEY` (optional, for email functionality)

## Important Notes

1. **After adding environment variables, you MUST redeploy** for them to take effect
2. The `SUPABASE_SERVICE_ROLE_KEY` should be kept secret - never commit it to git
3. Make sure `DATABASE_URL` uses the **Connection Pooling** URL, not the direct connection
4. Generate a strong `SESSION_SECRET` - don't use the example value
5. All variables should be set for **Production** environment at minimum

## Testing Your Configuration

After setting all variables and redeploying, test:
1. Visit your Vercel URL
2. Try clicking "Panel Admin" or "Panel Empleado"
3. Check Vercel Function Logs if you encounter errors
4. Verify database connection is working

