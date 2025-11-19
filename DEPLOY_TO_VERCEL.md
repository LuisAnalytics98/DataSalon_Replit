# 🚀 Deploy to Vercel - Quick Guide

## Step 1: Push Code to GitHub

### If you haven't committed yet:

```cmd
git add .
git commit -m "Migrate to Supabase - ready for Vercel deployment"
git push origin migration/supabase-vercel
```

Or merge to main first:
```cmd
git checkout main
git merge migration/supabase-vercel
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel:**
   - Visit: https://vercel.com
   - Sign up/Login (use GitHub)

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select repository: `DataSalon_Replit`
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

4. **Add Environment Variables:**
   Click "Environment Variables" and add:

   ```
   SUPABASE_URL=https://ujgdkuhztbtzseqotbpe.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ2RrdWh6dGJ0enNlcW90YnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTYzNzksImV4cCI6MjA3OTA5MjM3OX0.CIIEmVlXpOILr8Fr_oAfm0FpqYT75l9GANvmh2l2kok
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ2RrdWh6dGJ0enNlcW90YnBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUxNjM3OSwiZXhwIjoyMDc5MDkyMzc5fQ.fYA8lCooNzX4jGhXcnV51TY0BQKVwoEMwuel_QG3q3I
   SUPABASE_STORAGE_BUCKET=salon-assets
   DATABASE_URL=postgresql://postgres.ujgdkuhztbtzseqotbpe:Comearroz.98@aws-1-us-west-1.pooler.supabase.com:5432/postgres
   SESSION_SECRET=b07e7d58871c97701fe35fda7b5ec3bdc92862d94b79830bf2b474b5940d1f15
   NODE_ENV=production
   PORT=5000
   SUPER_ADMIN_EMAIL=datasalon98@gmail.com
   RESEND_API_KEY=your-resend-api-key
   ```

   **Important:** For each variable, select:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-5 minutes for build

### Option B: Via Vercel CLI

```cmd
npm i -g vercel
vercel login
vercel
```

Follow the prompts and add environment variables.

## Step 3: Update Supabase Redirect URLs

After deployment, get your Vercel URL (e.g., `https://your-project.vercel.app`)

1. Go to: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/url-configuration

2. Add to **Redirect URLs**:
   ```
   https://your-project.vercel.app/api/callback
   ```

3. Update **Site URL** to:
   ```
   https://your-project.vercel.app
   ```

## Step 4: Test Production

1. Visit your Vercel URL
2. Test login
3. Test admin panel
4. Test booking flow

## 🎉 Done!

Your app is now live on Vercel! 🚀

## 📝 Environment Variables Quick Copy

Copy this entire block and paste into Vercel:

```
SUPABASE_URL=https://ujgdkuhztbtzseqotbpe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ2RrdWh6dGJ0enNlcW90YnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTYzNzksImV4cCI6MjA3OTA5MjM3OX0.CIIEmVlXpOILr8Fr_oAfm0FpqYT75l9GANvmh2l2kok
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ2RrdWh6dGJ0enNlcW90YnBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUxNjM3OSwiZXhwIjoyMDc5MDkyMzc5fQ.fYA8lCooNzX4jGhXcnV51TY0BQKVwoEMwuel_QG3q3I
SUPABASE_STORAGE_BUCKET=salon-assets
DATABASE_URL=postgresql://postgres.ujgdkuhztbtzseqotbpe:Comearroz.98@aws-1-us-west-1.pooler.supabase.com:5432/postgres
SESSION_SECRET=b07e7d58871c97701fe35fda7b5ec3bdc92862d94b79830bf2b474b5940d1f15
NODE_ENV=production
PORT=5000
SUPER_ADMIN_EMAIL=datasalon98@gmail.com
RESEND_API_KEY=your-resend-api-key
```

