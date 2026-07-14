# 🖥️ Tehzeeb AI OS (2080 Edition) - Local Laptop Installation Guide

Welcome to the **Tehzeeb AI OS** portable local launcher setup! This document details how to install, configure, and secure your personal instance of the application on your laptop while keeping your private API keys completely hidden from external view.

---

## 🚀 Quick Start: Single-Click Setup

Your workspace contains pre-packaged portable orchestrator files:
- **Windows**: Run `launch.bat`
- **Mac/Linux**: Run `bash launch.sh`

These scripts will automatically:
1. Verify Node.js (v18+) is present on your laptop.
2. Initialize and run the **Python Local Desktop Control Bridge** (`local-desktop-bridge.py`) in the background.
3. Automatically install secure production dependencies.
4. Fire up the local web UI on: **`http://localhost:3000`**

---

## 🔑 Secure API Keys Configuration (Omni Route)

To hide your private keys and use custom models (like OpenRouter or custom API proxies), use the integrated `.env` environment file.

### Step 1: Initialize the Environment
Copy the configuration template to your active local workspace:
```bash
cp .env.example .env
```

### Step 2: Set your Custom API Keys
Open `.env` in any text editor. It is stored locally on your machine and will **never** be committed to public code:

```env
# Standard Google Gemini Key for reasoning
GEMINI_API_KEY="AIzaSyYourGeminiKeyHere..."

# Your Omni Route API Key (OpenRouter, DeepSeek, or other endpoints)
OMNI_API_KEY="sk-or-v1-YourOmniKeyHere..."

# Custom API endpoint gateway
OMNI_API_URL="https://api.openrouter.ai/v1"

# Target Omni model name of your choice
OMNI_MODEL_NAME="google/gemini-3.5-flash"
```

The system will read these keys natively in the background and encrypt transaction messages before syncing them.

---

## 📱 Establishing the Secure Android Companion Link

To use the **Advanced Android Remote Control & Automation** suite:

1. **Local Web Interface**: Open the app at `http://localhost:3000`.
2. **Access Control**: Click on the **Connect Android (QR Link)** button in the Phone tab.
3. **QR Generation**: A secure pairing QR code containing the encrypted pairing hash, session token, and local public key will generate immediately.
4. **Link Setup**: Scan the QR using the companion app. Once scanned, keys are exchanged, and the device will automatically save as a **trusted companion node**.
5. **Autoreconnect**: Next time you open both applications, they will securely discover each other and re-establish the connection automatically without requiring a name dependency or manual scan!

---

## 🛡️ Security Policies

- **All Transactions Are Free**: Payment gates, subscription models, and PIN validations have been completely stripped. The suite is fully unlocked for personal lifetime development.
- **Explicit User Confirmations**: Sensitive tasks (file deletion, media uploading, system commands execution) will trigger a mandatory override dialog box on the screen before execution.
