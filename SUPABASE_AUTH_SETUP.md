# Supabase Auth Setup - Fix Required

## Problem
Error: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: Provider  could not be found"}`

## Solution

The Supabase Auth needs to be configured in the Supabase Dashboard. Follow these steps:

### Step 1: Configure Auth Providers

1. Go to: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/providers
2. Enable **Email** provider (if not already enabled)
3. Configure email settings:
   - Enable "Confirm email" (optional, but recommended)
   - Set up email templates if needed

### Step 2: Configure Redirect URLs

1. Go to: **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   ```
   http://localhost:5000/api/callback
   http://127.0.0.1:5000/api/callback
   ```
3. For production, add your production URL too

### Step 3: Configure Site URL

1. In **URL Configuration**, set **Site URL** to:
   ```
   http://localhost:5000
   ```

### Step 4: Test the Flow

After configuring:
1. Restart your server: `npm run dev`
2. Try accessing: `http://localhost:5000/api/login?returnTo=/admin`
3. You should be redirected to Supabase Auth login page
4. Sign up or sign in with email
5. You'll be redirected back to `/admin`

## Alternative: Use Supabase Auth UI

If the direct auth flow doesn't work, we can implement Supabase's Auth UI component on the client side instead of server-side redirects.

## Quick Fix Applied

I've updated the login endpoint to specify `provider=email` in the auth URL. This should help, but you still need to configure the redirect URLs in Supabase Dashboard.

