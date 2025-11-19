# Supabase Domain Configuration for Vercel

After deploying to Vercel, you need to configure your Supabase project to allow your Vercel domain for authentication.

## Step 1: Get Your Vercel Domain

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **DataSalon_Replit**
3. Go to **Settings** → **Domains** (or check the deployment URL)
4. Note your deployment URL. It will be something like:
   - `your-project-name.vercel.app`
   - Or your custom domain if you've added one

## Step 2: Configure Supabase Auth Redirect URLs

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **ujgdkuhztbtzseqotbpe**
3. Navigate to: **Authentication** → **URL Configuration**
   - Direct link: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/url-configuration

4. In the **Redirect URLs** section, add your Vercel domain(s):

   **For Production (Vercel):**
   ```
   https://your-project-name.vercel.app/api/callback
   https://your-project-name.vercel.app/*
   ```

   **If you have a custom domain:**
   ```
   https://yourdomain.com/api/callback
   https://yourdomain.com/*
   ```

   **Keep these for Local Development:**
   ```
   http://localhost:5000/api/callback
   http://127.0.0.1:5000/api/callback
   ```

5. Click **Save** at the bottom of the page

## Step 3: Configure Site URL

1. In the same **URL Configuration** page
2. Find the **Site URL** field
3. Set it to your production domain:
   ```
   https://your-project-name.vercel.app
   ```
   Or your custom domain:
   ```
   https://yourdomain.com
   ```

4. Click **Save**

## Step 4: Configure CORS (Optional but Recommended)

If your frontend makes direct API calls to Supabase:

1. Go to: **Settings** → **API**
   - Direct link: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/settings/api

2. Scroll down to **CORS** section
3. Add your Vercel domain(s):
   ```
   https://your-project-name.vercel.app
   https://yourdomain.com
   ```

4. Click **Save**

## Step 5: Update Environment Variables in Vercel

Make sure all your Supabase environment variables are set in Vercel:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add/verify these variables (for **Production** environment):
   - `SUPABASE_URL` = `https://ujgdkuhztbtzseqotbpe.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ2RrdWh6dGJ0enNlcW90YnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTYzNzksImV4cCI6MjA3OTA5MjM3OX0.CIIEmVlXpOILr8Fr_oAfm0FpqYT75l9GANvmh2l2kok`
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key - keep this secret!)
   - `DATABASE_URL` = (your database connection string)
   - `SESSION_SECRET` = (your session secret)
   - `RESEND_API_KEY` = (if using email)
   - `SUPER_ADMIN_EMAIL` = (your admin email)
   - `NODE_ENV` = `production`
   - `PORT` = (optional, Vercel sets this automatically)

3. Make sure to select **Production** (and optionally **Preview** and **Development**) environments
4. Click **Save** for each variable

## Step 6: Test the Configuration

1. After deploying to Vercel, visit your app: `https://your-project-name.vercel.app`
2. Try logging in
3. Check the browser console (F12) and network tab for any errors
4. Verify that after login, you're redirected back to your app correctly

## Quick Reference Links

**Supabase Dashboard:**
- Auth URL Configuration: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/url-configuration
- API Settings: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/settings/api
- Auth Providers: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/providers

**Vercel Dashboard:**
- Environment Variables: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
- Domains: https://vercel.com/dashboard → Your Project → Settings → Domains

## Important Notes

✅ **Use HTTPS for production URLs** - Vercel provides HTTPS by default
✅ **The wildcard `/*` allows any path** on your domain to receive auth callbacks
✅ **Keep localhost URLs** for local development
✅ **Changes may take a few minutes** to propagate after saving

## Troubleshooting

### Error: "Invalid redirect URL"
- Make sure the redirect URL in Supabase matches exactly (including `https://`)
- Check for trailing slashes - should be `/api/callback` not `/api/callback/`
- Verify the domain is correct (check Vercel deployment URL)

### Error: CORS issues
- Add your domain to CORS settings in Supabase API settings
- Check browser console for specific CORS errors
- Make sure you're using `https://` not `http://`

### Auth not working after deployment
- Verify all environment variables are set in Vercel (especially `SUPABASE_URL` and keys)
- Check Vercel function logs: Vercel Dashboard → Your Project → Deployments → Click on deployment → Functions tab
- Ensure the callback URL is correctly configured in Supabase
- Try redeploying after making changes

### Still having issues?
1. Check Vercel deployment logs for errors
2. Check browser console for JavaScript errors
3. Verify environment variables are set correctly
4. Make sure the Supabase project is active and not paused
