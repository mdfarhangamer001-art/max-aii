@echo off
title Max AI - Local Launch Suite
color 0B
cls

echo =====================================================================
echo                 🚀 MAX AI - LOCAL LAUNCHER SUITE 🚀
echo =====================================================================
echo.
echo  This launcher will verify your environment and launch Max AI.
echo  If you want to run the full, all-in-one automatic installer
echo  (which downloads ADB, configures Python and pip), please run:
echo.
echo  👉 setup_max_ai.bat
echo.
echo =====================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this system.
    echo Please run 'setup_max_ai.bat' to configure your system automatically.
    pause
    exit /b 1
)

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Python is not found in your PATH.
    echo The local desktop bridge will not auto-start.
    echo It is highly recommended to run 'setup_max_ai.bat' to set up Python and ADB automatically.
    echo.
) else (
    echo [INFO] Starting Local Desktop Control Bridge on Port 3002...
    start "Max AI Desktop Bridge" cmd /c "title Max AI Desktop Bridge && python local-desktop-bridge.py"
)

:: Install modules if missing
if not exist node_modules (
    echo [INFO] Installing required dependencies...
    npm install --omit=dev
)

:: Run the compiled server
echo [INFO] Starting Max AI Central Server...
echo [INFO] Access the web UI at: http://localhost:3000
echo ========================================================
echo.
npm start

pause
