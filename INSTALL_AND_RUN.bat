@echo off
echo ========================================
echo   Installing Dependencies
echo ========================================
echo.

call npm install

if errorlevel 1 (
    echo.
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Dependencies Installed Successfully!
echo ========================================
echo.
echo Starting server...
echo.
echo ========================================
echo   Server will start on:
echo   http://localhost:5000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause

