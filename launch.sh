#!/usr/bin/env bash
# Max AI - Local Launch Suite for Unix

echo "====================================================================="
echo "                🚀 MAX AI - LOCAL LAUNCHER SUITE 🚀"
echo "====================================================================="
echo ""
echo " This launcher will verify your environment and launch Max AI."
echo " If you want to run the full, all-in-one automatic installer"
echo " (which downloads ADB, configures Python and pip), please run:"
echo ""
echo "  👉 ./setup_max_ai.sh"
echo ""
echo "====================================================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please run './setup_max_ai.sh' to configure your system."
    exit 1
fi

# Check for Python (for the desktop bridge)
if command -v python3 &> /dev/null; then
    echo "[INFO] Starting Local Desktop Control Bridge in background..."
    python3 local-desktop-bridge.py &
elif command -v python &> /dev/null; then
    echo "[INFO] Starting Local Desktop Control Bridge in background..."
    python local-desktop-bridge.py &
else
    echo "[WARNING] Python is not installed. Please run './setup_max_ai.sh' to set up Python and ADB automatically."
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing required dependencies..."
    npm install --omit=dev
fi

# Run the compiled server
echo "[INFO] Starting Max AI Central Server..."
echo "[INFO] Access the web UI at: http://localhost:3000"
echo "========================================================"
echo ""
npm start
