# Can't Open Localhost - Troubleshooting Guide

## Quick Diagnosis

Run this to check if server is running:
```cmd
node check-server.js
```

## Common Issues & Solutions

### ❌ Issue 1: Server Not Starting

**Symptoms:**
- Terminal shows errors
- No "serving on port 5000" message
- Browser shows "This site can't be reached"

**Solutions:**

1. **Check for errors in terminal**
   - Look for red error messages
   - Common errors:
     - "Cannot find module" → Run `npm install`
     - "DATABASE_URL must be set" → Check `.env.local`
     - "Port already in use" → Change PORT in `.env.local`

2. **Verify dependencies installed**
   ```cmd
   npm install
   ```

3. **Check .env.local exists**
   - File should be in project root
   - Should contain all required variables

### ❌ Issue 2: Server Starts But Can't Connect

**Symptoms:**
- Terminal shows "serving on port 5000"
- Browser shows "This site can't be reached"

**Solutions:**

1. **Check the URL**
   - Use: `http://localhost:5000`
   - NOT: `https://localhost:5000`
   - NOT: `localhost:5000` (missing http://)

2. **Try different URL**
   - `http://127.0.0.1:5000`

3. **Check firewall/antivirus**
   - Windows Firewall might be blocking
   - Antivirus might be blocking
   - Try temporarily disabling to test

4. **Check port is correct**
   - Look at terminal: "serving on port X"
   - Use that port number in URL

### ❌ Issue 3: Port Already in Use

**Symptoms:**
- Error: "Port 5000 is already in use"
- Or server won't start

**Solutions:**

1. **Find what's using the port**
   ```cmd
   netstat -ano | findstr :5000
   ```

2. **Kill the process** (replace PID with actual process ID)
   ```cmd
   taskkill /PID <PID> /F
   ```

3. **Or change port**
   - Edit `.env.local`
   - Change `PORT=5000` to `PORT=3000`
   - Restart server
   - Use `http://localhost:3000`

### ❌ Issue 4: Database Connection Error

**Symptoms:**
- Server starts but crashes
- Error about DATABASE_URL or connection

**Solutions:**

1. **Check .env.local has DATABASE_URL**
2. **Verify Supabase credentials**
3. **Test connection:**
   ```cmd
   node verify-supabase-setup.js
   ```

## Step-by-Step Debug

### Step 1: Check Server Status
```cmd
node check-server.js
```

### Step 2: Check Terminal Output
Look for:
- ✅ "serving on port 5000" = Server running
- ❌ Error messages = Server not running

### Step 3: Check Browser
- Open: `http://localhost:5000`
- Press F12 → Check Console tab for errors
- Check Network tab for failed requests

### Step 4: Verify Environment
```cmd
node verify-supabase-setup.js
```

## What to Share for Help

If still having issues, share:

1. **Terminal output** - Copy/paste error messages
2. **Browser console** - F12 → Console tab → Copy errors
3. **What you see** - Screenshot or description
4. **What you tried** - List of steps you took

## Quick Test

1. **Start server:**
   ```cmd
   npm run dev
   ```

2. **Wait for:**
   ```
   serving on port 5000
   ```

3. **Open browser:**
   ```
   http://localhost:5000
   ```

4. **Should see:** Landing page with "Data Salon" logo

If any step fails, check the error message and refer to solutions above.

