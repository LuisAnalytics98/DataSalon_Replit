@echo off
echo ========================================
echo   DataSalon - Starting Application
echo ========================================
echo.

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed!
) else (
    echo Dependencies found.
)
echo.

echo [2/3] Verifying setup...
call node verify-supabase-setup.js
if errorlevel 1 (
    echo WARNING: Setup verification had issues
    echo Continuing anyway...
)
echo.

echo [3/3] Starting development server...
echo.
echo ========================================
echo   Server will start on:
echo   http://localhost:5000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.
echo Starting...
echo.

call npm run dev

pause

