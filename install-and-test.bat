@echo off
echo ========================================
echo DataSalon - Supabase Migration Testing
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed!
    echo Make sure Node.js is installed and npm is available.
    pause
    exit /b 1
)

echo.
echo Step 2: Verifying Supabase setup...
call node verify-supabase-setup.js
if errorlevel 1 (
    echo.
    echo WARNING: Setup verification had issues. Check the output above.
    echo.
) else (
    echo.
    echo Setup verification passed!
    echo.
)

echo Step 3: Starting development server...
echo.
echo The server will start on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
call npm run dev

pause

