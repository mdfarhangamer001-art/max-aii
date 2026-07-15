#!/usr/bin/env bash
# Nova AI - All-in-One Automated Setup & Launcher for Mac/Linux
set -e

echo "====================================================================="
# Using Nova AI OS banner
echo "              🚀 NOVA AI - AUTOMATED ALL-IN-ONE SETUP SUITE 🚀"
echo "====================================================================="
echo ""
echo " This unified script will automatically:"
echo " 1. Check and install Python dependencies (pyautogui, pillow, requests)"
echo " 2. Automatically download and extract official Android ADB tools"
echo " 3. Setup Node.js dependencies"
echo " 4. Fire up the local PC Desktop Control Bridge (Port 3002)"
echo " 5. Launch the main Nova AI central server (Port 3000)"
echo ""
echo "====================================================================="
echo ""

# 1. CHECK NODE.JS
echo "[1/5] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed on this system. Please install Node.js (v18+) and retry."
    exit 1
fi
echo "[SUCCESS] Node.js is active."
echo ""

# 2. CHECK PYTHON & PIP DEPENDENCIES
echo "[2/5] Checking Python installation..."
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "[ERROR] Python 3 is required for the local desktop bridge. Please install Python 3."
    exit 1
fi

echo "[SUCCESS] Python found: $PYTHON_CMD. Installing bridge dependencies (pyautogui, pillow, requests)..."
$PYTHON_CMD -m pip install --upgrade pip || true
$PYTHON_CMD -m pip install pyautogui pillow requests || true
echo "[SUCCESS] Python dependencies successfully configured."
echo ""

# 3. AUTO-DOWNLOAD ANDROID ADB FOR USB PHONE SYNC
echo "[3/5] Setting up Android Debug Bridge (ADB) for USB Mobile pairing..."
if [ -f "platform-tools/adb" ]; then
    echo "[INFO] Local ADB tools already exist in platform-tools folder. Skipping download."
else
    SYS_NAME=$(uname -s)
    ADB_URL=""
    if [ "$SYS_NAME" = "Darwin" ]; then
        echo "[INFO] macOS detected. Downloading Mac platform-tools..."
        ADB_URL="https://dl.google.com/android/repository/platform-tools-latest-darwin.zip"
    else
        echo "[INFO] Linux detected. Downloading Linux platform-tools..."
        ADB_URL="https://dl.google.com/android/repository/platform-tools-latest-linux.zip"
    fi
    
    curl -L -o platform-tools.zip "$ADB_URL"
    unzip -q platform-tools.zip
    rm platform-tools.zip
    chmod +x platform-tools/adb || true
    echo "[SUCCESS] ADB is now integrated locally in platform-tools/ directory!"
fi
echo ""

# 4. NODE DEPENDENCIES SETUP
echo "[4/5] Checking frontend and backend web resources..."
if [ ! -d "node_modules" ]; then
    echo "[INFO] Running 'npm install' to fetch server libraries..."
    npm install
else
    echo "[INFO] Server modules verified."
fi
echo ""

# 5. STARTING THE CONTROL BRIDGES
echo "[5/5] Initiating Nova AI Core Engines..."
echo ""
echo "[Nova AI] Starting local desktop controller on Loopback Port 3002..."
$PYTHON_CMD local-desktop-bridge.py &

echo "[Nova AI] Booting central Node.js web server on Port 3000..."
echo "====================================================================="
echo ""
echo " 🚀 Nova AI is now ready to roll!"
echo " 👉 Open your browser and head to: http://localhost:3000"
echo ""
echo "====================================================================="
echo ""
npm start
