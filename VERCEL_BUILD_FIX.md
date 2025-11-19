# Vercel Build Fix

## Problem
```
sh: line 1: vite: command not found
Error: Command "npm run build" exited with 127
```

## Solution Applied

✅ Updated `package.json` build scripts to use `npx`:
- `build:client`: Now uses `npx vite build`
- `build:server`: Now uses `npx esbuild ...`

✅ Updated `vercel.json` to ensure dependencies are installed:
- Build command now includes `npm install && npm run build`

## Next Steps

1. **Commit and push the fix:**
   ```cmd
   git add package.json vercel.json
   git commit -m "Fix Vercel build - use npx for vite and esbuild"
   git push origin migration/supabase-vercel
   ```

2. **Redeploy on Vercel:**
   - Go to your Vercel project
   - Click "Redeploy" or push again to trigger automatic deployment

## Alternative: Vercel Settings

If it still doesn't work, in Vercel Dashboard:

1. Go to **Settings** → **General**
2. Under **Build & Development Settings**:
   - **Install Command**: `npm install` (or `npm ci`)
   - **Build Command**: `npm run build`
   - Make sure **Node.js Version** is set to 20.x

3. Under **Environment Variables**:
   - Make sure `NODE_ENV=production` is set

The build should now work! 🚀

