# Troubleshooting: Can't Open Localhost

## Quick Checks

### 1. Is the server running?

Check your terminal/command prompt. You should see:
```
serving on port 5000
```

If you see errors instead, note them down.

### 2. What URL are you trying?

The server runs on: **http://localhost:5000**

Make sure you're using:
- ✅ `http://localhost:5000`
- ✅ `http://127.0.0.1:5000`

NOT:
- ❌ `https://localhost:5000` (no https in development)
- ❌ `localhost:5000` (missing http://)

### 3. Common Issues

#### Issue: "Port 5000 already in use"
**Solution**: 
- Close other applications using port 5000
- Or change PORT in `.env.local` to a different number (e.g., 3000)

#### Issue: "Cannot find module" errors
**Solution**: 
- Run `npm install` again
- Make sure all dependencies are installed

#### Issue: "DATABASE_URL must be set"
**Solution**: 
- Check `.env.local` exists
- Verify DATABASE_URL is set correctly

#### Issue: Server starts but browser shows "This site can't be reached"
**Solution**:
- Check firewall settings
- Try `http://127.0.0.1:5000` instead
- Check if antivirus is blocking

#### Issue: Server crashes on startup
**Solution**:
- Check terminal for error messages
- Verify Supabase credentials in `.env.local`
- Check database connection

## Debug Steps

1. **Check server logs** - Look at terminal output
2. **Check browser console** - F12 → Console tab
3. **Check network tab** - F12 → Network tab
4. **Try different browser** - Chrome, Firefox, Edge
5. **Check port** - Verify server is on port 5000

## Get Help

Share:
- Terminal output (error messages)
- Browser console errors (F12)
- What happens when you try to open localhost

