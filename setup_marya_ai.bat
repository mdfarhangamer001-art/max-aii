@echo off
title Marya AI - All-in-One Automated Setup & Launcher
color 0B
cls

echo =====================================================================
echo               🚀 MARYA AI - AUTOMATED ALL-IN-ONE SETUP SUITE 🚀
echo =====================================================================
echo.
echo  This unified script will automatically:
echo  1. Check and install Python dependencies (pyautogui, pillow, requests)
echo  2. Automatically download and extract official Android ADB tools
echo  3. Setup Node.js dependencies
echo  4. Fire up the local PC Desktop Control Bridge (Port 3002)
echo  5. Launch the main Marya AI central server (Port 3000)
echo.
echo =====================================================================
echo.

:: 1. CHECK NODE.JS
echo [1/5] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this PC.
    echo Please download and install Node.js (v18+) to continue.
    echo Direct Link: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [SUCCESS] Node.js is active.
echo.

:: 2. CHECK PYTHON & PIP DEPENDENCIES
echo [2/5] Checking Python installation...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Python was not found in your system PATH.
    echo Attempting to install Python via Windows Package Manager (Winget)...
    where winget >nul 2>nul
    if %errorlevel% eq 0 (
        winget install Python.Python.3 --silent --accept-package-agreements --accept-source-agreements
        echo Please restart this script after the installer completes.
        pause
        exit /b 0
    ) else (
        echo [ERROR] Python 3 is required for the local PC control bridge.
        echo Please download and install Python 3.10+ (Make sure to check "Add Python to PATH").
        echo Link: https://www.python.org/downloads/
        echo.
        pause
        exit /b 1
    )
)

echo [SUCCESS] Python is active. Installing bridge dependencies (pyautogui, pillow, requests)...
python -m pip install --upgrade pip >nul 2>nul
python -m pip install pyautogui pillow requests
echo [SUCCESS] Python dependencies successfully configured.
echo.

:: 3. AUTO-DOWNLOAD ANDROID ADB FOR USB PHONE SYNC
echo [3/5] Setting up Android Debug Bridge (ADB) for USB Mobile pairing...
if exist "platform-tools\adb.exe" (
    echo [INFO] Local ADB tools already exist in platform-tools folder. Skipping download.
) else (
    echo [INFO] Local ADB tools not found. Downloading official Google platform-tools package...
    curl -L -o platform-tools.zip "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
    if %errorlevel% neq 0 (
        echo [WARNING] Direct download failed. Attempting alternative secure mirror...
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip' -OutFile 'platform-tools.zip'"
    )
    
    echo [INFO] Extracting ADB archive...
    powershell -Command "Expand-Archive -Path 'platform-tools.zip' -DestinationPath '.' -Force"
    
    if exist platform-tools.zip (
        del platform-tools.zip
    )
    echo [SUCCESS] ADB is now integrated locally in platform-tools/ directory!
)
echo.

:: 4. NODE DEPENDENCIES SETUP
echo [4/5] Checking frontend and backend web resources...
if not exist node_modules (
    echo [INFO] Running 'npm install' to fetch server libraries...
    call npm install
) else (
    echo [INFO] Server modules verified.
)
echo.

:: 5. STARTING THE CONTROL BRIDGES
echo [5/5] Initiating MARYA AI Core Engines...
echo.
echo [Marya-AI] Starting local desktop controller on Loopback Port 3002...
start "Marya AI Desktop Bridge" cmd /k "title Marya AI Desktop Bridge (Port 3002) && python local-desktop-bridge.py"

echo [Marya-AI] Booting central Node.js web server on Port 3000...
echo =====================================================================
echo.
echo  🚀 Marya AI is now ready to roll!
echo  👉 Open your browser and head to: http://localhost:3000
echo.
echo =====================================================================
echo.
call npm start

pause
