# How to Run and Open the App - Step by Step

## 🚀 Easy Way (Automated)

### Option 1: Double-click the batch file
1. In File Explorer, go to: `C:\Users\MADRIL10\DataSalon_Replit`
2. Double-click: **`START_APP.bat`**
3. Wait for server to start
4. Browser should open automatically, or go to: `http://localhost:5000`

### Option 2: Run from Command Prompt
1. Open **Command Prompt** (cmd.exe)
2. Type:
   ```cmd
   cd C:\Users\MADRIL10\DataSalon_Replit
   START_APP.bat
   ```

## 📝 Manual Way (Step by Step)

### Step 1: Open Command Prompt
- Press `Win + R`
- Type `cmd` and press Enter
- Or search "Command Prompt" in Start menu

### Step 2: Navigate to Project
```cmd
cd C:\Users\MADRIL10\DataSalon_Replit
```

### Step 3: Install Dependencies (if not done)
```cmd
npm install
```
Wait for it to finish (may take 1-2 minutes)

### Step 4: Start the Server
```cmd
npm run dev
```

You should see:
```
serving on port 5000
```

### Step 5: Open in Browser
1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Go to: **http://localhost:5000**
3. You should see the DataSalon landing page!

## ✅ What You Should See

### In Terminal:
```
serving on port 5000
```

### In Browser:
- Landing page with "Data Salon" logo
- "Panel Admin" and "Panel Empleado" buttons
- "Solicitar Información" button

## 🐛 Troubleshooting

### Problem: "npm is not recognized"
**Solution**: Install Node.js from https://nodejs.org

### Problem: "Cannot find module"
**Solution**: Run `npm install` first

### Problem: "Port 5000 already in use"
**Solution**: 
- Close other apps using port 5000
- Or change PORT in `.env.local` to 3000

### Problem: Server starts but browser shows error
**Solution**:
- Make sure you use: `http://localhost:5000` (with http://)
- Try: `http://127.0.0.1:5000`
- Check browser console (F12) for errors

### Problem: "DATABASE_URL must be set"
**Solution**: Check `.env.local` file exists and has DATABASE_URL

## 🎯 Quick Test

1. Run: `npm run dev`
2. Wait for: "serving on port 5000"
3. Open: `http://localhost:5000`
4. Should see: Landing page

## 💡 Tips

- **Keep terminal open** - Server needs to keep running
- **Don't close terminal** - That stops the server
- **Check terminal for errors** - Red text = problem
- **Use Command Prompt** - Not PowerShell (for npm commands)

## 📞 Need Help?

If something doesn't work:
1. Copy the error message from terminal
2. Check what step failed
3. Share the error message for help

Good luck! 🚀

