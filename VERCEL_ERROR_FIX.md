# Vercel 500 Error Fix

## Problem
```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

## Fixes Applied

### 1. Environment Variables Loading
- Added `dotenv` configuration to `api/index.ts` to load environment variables
- Ensures all required Supabase and database credentials are available

### 2. Static Files Handling
- Made `serveStatic` function more resilient
- It now tries multiple paths and doesn't throw errors if files don't exist
- On Vercel, static files are served separately, so this is expected

### 3. Error Handling
- Added comprehensive error handling in the API handler
- Added timeout protection (30 seconds)
- Better error logging for debugging

### 4. NODE_ENV Detection
- Automatically detects if running on Vercel
- Sets `NODE_ENV=production` when `VERCEL` environment variable is present

## Next Steps

1. **Verify Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Make sure ALL these are set for **Production**:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `DATABASE_URL`
     - `SESSION_SECRET`
     - `NODE_ENV=production`
     - `RESEND_API_KEY` (if using email)
     - `SUPER_ADMIN_EMAIL`

2. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Go to **Functions** tab
   - Click on the function that's failing
   - Check the logs for specific error messages

3. **Common Issues:**
   - **Missing environment variables** - Check Vercel environment variables
   - **Database connection issues** - Verify `DATABASE_URL` is correct
   - **Supabase connection issues** - Verify Supabase credentials
   - **Module import errors** - Check build logs for compilation errors

## Debugging

To see detailed error logs:

1. **In Vercel Dashboard:**
   - Go to your project → Deployments → Latest deployment
   - Click on **Functions** tab
   - Click on the failing function
   - Check the **Logs** section

2. **Common Error Messages:**
   - `Cannot find module` - Build issue, check build logs
   - `DATABASE_URL must be set` - Missing environment variable
   - `SUPABASE_URL must be set` - Missing environment variable
   - `Connection refused` - Database connection issue
   - `Invalid API key` - Supabase credentials issue

3. **Test Locally First:**
   ```bash
   npm run build
   npm start
   ```
   This will help identify issues before deploying to Vercel.

## After Fixing

1. Commit and push the changes
2. Vercel will automatically redeploy
3. Check the new deployment logs
4. Test the application

