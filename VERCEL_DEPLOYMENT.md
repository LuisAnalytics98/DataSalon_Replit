# Deploy to Vercel - Step by Step Guide

## Prerequisites

✅ Your code is ready
✅ Supabase is configured
✅ Admin panel is working locally

## Step 1: Push Code to GitHub

### Option A: If you haven't committed yet

1. **Check current branch:**
   ```cmd
   git branch
   ```
   You should be on `migration/supabase-vercel`

2. **Commit your changes:**
   ```cmd
   git add .
   git commit -m "Migrate to Supabase and Vercel"
   ```

3. **Push to GitHub:**
   ```cmd
   git push origin migration/supabase-vercel
   ```

### Option B: If you want to merge to main first

1. **Switch to main:**
   ```cmd
   git checkout main
   ```

2. **Merge migration branch:**
   ```cmd
   git merge migration/supabase-vercel
   ```

3. **Push to GitHub:**
   ```cmd
   git push origin main
   ```

## Step 2: Connect to Vercel

1. **Go to Vercel:**
   - Visit: https://vercel.com
   - Sign up or log in (use GitHub to connect)

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `DataSalon_Replit`
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset**: Other (or leave as auto-detected)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

## Step 3: Add Environment Variables

In Vercel project settings, add these environment variables:

### Required Variables

```
SUPABASE_URL=https://ujgdkuhztbtzseqotbpe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ2RrdWh6dGJ0enNlcW90YnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTYzNzksImV4cCI6MjA3OTA5MjM3OX0.CIIEmVlXpOILr8Fr_oAfm0FpqYT75l9GANvmh2l2kok
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ2RrdWh6dGJ0enNlcW90YnBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUxNjM3OSwiZXhwIjoyMDc5MDkyMzc5fQ.fYA8lCooNzX4jGhXcnV51TY0BQKVwoEMwuel_QG3q3I
SUPABASE_STORAGE_BUCKET=salon-assets
DATABASE_URL=postgresql://postgres.ujgdkuhztbtzseqotbpe:Comearroz.98@aws-1-us-west-1.pooler.supabase.com:5432/postgres
SESSION_SECRET=b07e7d58871c97701fe35fda7b5ec3bdc92862d94b79830bf2b474b5940d1f15
NODE_ENV=production
PORT=5000
```

### Optional Variables

```
RESEND_API_KEY=your-resend-api-key (if using email)
SUPER_ADMIN_EMAIL=datasalon98@gmail.com
```

### How to Add in Vercel

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: e.g., `SUPABASE_URL`
   - **Value**: paste the value
   - **Environment**: Select "Production", "Preview", and "Development"
4. Click **Save**
5. Repeat for all variables

## Step 4: Update Vercel Configuration

The `vercel.json` file should already be configured, but verify it's correct.

## Step 5: Deploy

1. **Click "Deploy"** in Vercel
2. Wait for build to complete (2-5 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

## Step 6: Update Supabase Redirect URLs

After deployment, update Supabase Auth redirect URLs:

1. Go to: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/url-configuration
2. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-project.vercel.app/api/callback
   ```
3. Update **Site URL** to your Vercel URL

## Step 7: Test Production

1. Visit your Vercel URL
2. Test login
3. Test admin panel
4. Test booking flow

## Troubleshooting

### Build Fails
- Check build logs in Vercel
- Verify all environment variables are set
- Check that `npm run build` works locally

### Database Connection Errors
- Verify `DATABASE_URL` is correct in Vercel
- Check Supabase project is active (not paused)

### Auth Not Working
- Verify redirect URLs in Supabase Dashboard
- Check `SUPABASE_URL` and keys are correct

### Images Not Loading
- Verify `SUPABASE_STORAGE_BUCKET` is set
- Check bucket is public in Supabase

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] All environment variables added
- [ ] Build successful
- [ ] Supabase redirect URLs updated
- [ ] Production site tested

Good luck with deployment! 🚀

