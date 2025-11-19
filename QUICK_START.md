# Quick Start - Testing Your App

## 🚀 Fastest Way to Test

### Option 1: Use Command Prompt (Easiest)

1. **Open Command Prompt** (not PowerShell):
   - Press `Win + R`
   - Type `cmd` and press Enter
   - Or search for "Command Prompt" in Start menu

2. **Navigate to your project**:
   ```cmd
   cd C:\Users\MADRIL10\DataSalon_Replit
   ```

3. **Run the automated script**:
   ```cmd
   install-and-test.bat
   ```

This will:
- ✅ Install dependencies
- ✅ Verify Supabase setup
- ✅ Start the development server

### Option 2: Manual Steps

1. **Open Command Prompt** (cmd.exe)

2. **Navigate to project**:
   ```cmd
   cd C:\Users\MADRIL10\DataSalon_Replit
   ```

3. **Install dependencies**:
   ```cmd
   npm install
   ```

4. **Verify setup** (optional):
   ```cmd
   node verify-supabase-setup.js
   ```

5. **Start server**:
   ```cmd
   npm run dev
   ```

## 🧪 Testing Checklist

Once the server is running on `http://localhost:5000`:

### ✅ Basic Tests

- [ ] **Landing Page**: Open `http://localhost:5000` - should see landing page
- [ ] **Login**: Click "Panel Admin" - should redirect to Supabase Auth
- [ ] **Sign Up**: Create account if you don't have one
- [ ] **After Login**: Should redirect back to `/admin` panel
- [ ] **Admin Panel**: Should see tabs (Tablero, Calendario, etc.)

### ✅ Feature Tests

- [ ] **Demo Salon**: Should be created automatically
- [ ] **Add Service**: Go to Servicios tab → Add a service
- [ ] **Add Stylist**: Go to Profesionales tab → Add a stylist
- [ ] **Upload Image**: Try uploading an image for service/stylist
- [ ] **Public Booking**: Go to `/book/demo-salon` → Create a booking

### ✅ Database Tests

- [ ] **Check Supabase Dashboard** → Table Editor → Should see data
- [ ] **Check Storage** → `salon-assets` bucket → Should see uploaded images

## 🐛 Troubleshooting

### "npm is not recognized"
- Install Node.js from https://nodejs.org
- Restart Command Prompt after installation

### "Cannot find package '@supabase/supabase-js'"
- Run `npm install` first

### "DATABASE_URL must be set"
- Check `.env.local` file exists
- Verify all environment variables are set

### "Authentication failed"
- Check Supabase Dashboard → Settings → API
- Verify your keys are correct in `.env.local`

### Server won't start
- Check if port 5000 is already in use
- Look at error messages in terminal
- Check `.env.local` has all required variables

## 📊 What to Look For

### ✅ Success Indicators:
- Server starts without errors
- Can access landing page
- Login redirects to Supabase
- After login, can access admin panel
- Can create services/stylists
- Images upload successfully
- Data appears in Supabase dashboard

### ❌ Error Indicators:
- Server crashes on startup
- "Cannot find module" errors
- "401 Unauthorized" errors
- Database connection errors
- Storage upload failures

## 🎯 Next Steps After Testing

If everything works:
1. ✅ Test all features thoroughly
2. ✅ Check data persistence (refresh page, data should remain)
3. ✅ Test on different browsers
4. ✅ Prepare for Vercel deployment

If something doesn't work:
1. Check error messages
2. Review `TESTING_GUIDE.md` for detailed troubleshooting
3. Check Supabase dashboard for issues
4. Verify environment variables

## 💡 Pro Tips

- **Keep terminal open**: Server logs show useful information
- **Use browser DevTools**: F12 → Console and Network tabs
- **Check Supabase Dashboard**: Real-time view of your data
- **Test incrementally**: Test one feature at a time

Good luck! 🚀

