# Testing Guide - Supabase Migration

## Step 1: Install Dependencies

First, you need to install the new Supabase dependency. Due to PowerShell execution policy, try one of these:

### Option A: Use Command Prompt (Recommended)
1. Open **Command Prompt** (cmd.exe) - NOT PowerShell
2. Navigate to the project:
   ```cmd
   cd C:\Users\MADRIL10\DataSalon_Replit
   ```
3. Install dependencies:
   ```cmd
   npm install
   ```

### Option B: Fix PowerShell Execution Policy
1. Open PowerShell as Administrator
2. Run:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
3. Then run:
   ```powershell
   npm install
   ```

## Step 2: Verify Setup

After installing, verify everything is configured:

```bash
node verify-supabase-setup.js
```

This should show:
- ✅ All 10 tables exist
- ✅ Storage bucket exists
- ✅ Database connection works
- ✅ Supabase API accessible

## Step 3: Start Development Server

```bash
npm run dev
```

The server should start on `http://localhost:5000`

## Step 4: Test Authentication Flow

### Test 1: Landing Page
1. Open `http://localhost:5000`
2. You should see the landing page
3. Click "Panel Admin" or "Panel Empleado"
4. Should redirect to Supabase Auth login

### Test 2: First Login
1. When redirected to Supabase Auth:
   - If you don't have an account, click "Sign up"
   - Create an account with your email
   - Verify email if required
2. After login, you should be redirected back to `/admin` or `/employee`

### Test 3: Admin Panel
1. After logging in, you should see:
   - Tablero (Kanban board)
   - Calendario
   - Análisis
   - Servicios
   - Profesionales
   - Configuración

### Test 4: Create Demo Data
The app should automatically create a demo salon on first startup. Check:
- Go to "Servicios" tab - should be able to add services
- Go to "Profesionales" tab - should be able to add stylists

### Test 5: Public Booking Flow
1. Navigate to: `http://localhost:5000/book/demo-salon`
2. Should see public booking form (no auth required)
3. Try creating a booking:
   - Fill in client info
   - Select service
   - Select stylist
   - Select date/time
   - Confirm booking

## Step 5: Test Image Uploads

1. Go to Admin Panel → Servicios
2. Click "Agregar Servicio"
3. Fill in service details
4. Try uploading an image
5. Should upload to Supabase Storage

## Common Issues & Solutions

### Issue: "Cannot find package '@supabase/supabase-js'"
**Solution**: Run `npm install` to install dependencies

### Issue: "DATABASE_URL must be set"
**Solution**: Make sure `.env.local` exists and has all required variables

### Issue: "Storage bucket not found"
**Solution**: 
1. Go to Supabase Dashboard → Storage
2. Create bucket named `salon-assets`
3. Make it public

### Issue: "Authentication failed"
**Solution**: 
1. Check Supabase Auth is enabled in dashboard
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
3. Check browser console for errors

### Issue: "Tables don't exist"
**Solution**: Run the SQL script in Supabase SQL Editor again

## Expected Behavior

✅ **Working:**
- Login redirects to Supabase Auth
- After login, redirects back to app
- Admin/Employee panels load
- API calls work (check Network tab)
- Database queries work
- Image uploads work

❌ **Not Working:**
- Login redirects but shows error
- Can't access protected routes
- API calls return 401 Unauthorized
- Database queries fail
- Image uploads fail

## Debug Tips

1. **Check Server Logs**: Look at terminal output for errors
2. **Check Browser Console**: F12 → Console tab
3. **Check Network Tab**: F12 → Network tab, see API calls
4. **Check Supabase Dashboard**: 
   - Auth → Users (should see your user)
   - Storage → salon-assets (should see uploaded files)
   - Table Editor (should see data)

## Next Steps After Testing

Once everything works:
1. ✅ Test all features
2. ✅ Verify data persistence
3. ✅ Test on different browsers
4. ✅ Prepare for deployment to Vercel

