# Tehzeeb AI OS (2080 Edition)
### Ultra Intelligence Master Operating System Core

Welcome to **Tehzeeb AI OS**, the world's most advanced, fully functional cognitive assistant operating system. Inspired by futuristic virtual assistants (like JARVIS), Tehzeeb orchestrates **10 specialized intelligence agents** to handle real-time voice conversations, screen sharing vision, memory persistence, autonomous browsing, and full-scale local desktop control.

---

## 🚀 Core Brain & Agent Hierarchy

Tehzeeb AI OS operates as a unified multi-agent orchestrator:
1. **Brain Core**: Central cognitive routing and semantic reasoning.
2. **Memory Agent**: Durable, non-volatile recollection persistence.
3. **Vision Agent**: Real-time video frame and OCR screen analysis.
4. **Voice Agent**: High-fidelity, low-latency 24kHz raw PCM speech streams.
5. **Research Agent**: Deep web crawling, scraping, and article summarization.
6. **Automation Agent**: Background cron tasks, daily agendas, and notifications.
7. **Coding Agent**: Syntax tree parsing, bug diagnosis, and code writing.
8. **Planning Agent**: Intelligent task decomposition and plan checklists.
9. **Browser Agent**: High-fidelity iframe-based web navigation and proxy bypasses.
10. **Device Control Agent**: Local system hardware tracking and immersive UI customizer.

---

## 🖥️ Local Desktop Control Bridge (`local-desktop-bridge.py`)

The **Local Desktop Control Bridge** is a lightweight, secure loopback Python microservice. It allows Tehzeeb AI OS to perform physical actions on your computer (keyboard typing, mouse movements, clicking, and full-desktop screenshot grabs) based on voice commands.

### 🔒 Security Design
* **Loopback-Only Binding**: Binds exclusively to `127.0.0.1`. No external computers or internet clients can access the bridge.
* **Fail-Safe Mode Enabled**: If the automation behaves unexpectedly, immediately move your physical mouse cursor to any corner of your computer screen to abort all operations instantly.

### 🛠️ Desktop Bridge Setup & Launch
1. Ensure Python 3.x is installed on your computer.
2. Install the lightweight system dependencies:
   ```bash
   pip install pyautogui pillow
   ```
3. Run the bridge:
   ```bash
   python local-desktop-bridge.py
   ```
4. Check the **System HUD -> Agents** tab on the web dashboard; it will instantly display **Connected** with live screen coordinates and local system event telemetry logs.

---

## ⚡ Deployment & Installation (Full System)

To host and run the entire full-stack system locally:

### 1. Clone & Extract
```bash
# Extract the release bundle
tar -xzf tehzeeb-ai-os-prod.tar.gz
cd tehzeeb-ai-os-prod
```

### 2. Configure Environment Keys
Create a `.env` file in the root directory and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_secured_google_gemini_api_key_here
```

### 3. Install Server Dependencies
```bash
npm install --omit=dev
```

### 4. Launch the Central Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your web browser. Enable screen sharing, connect your microphone link, and wake the core matrix!

---

## 🎨 Immersive User Interface
* **Atmospheric Waveforms**: High-fidelity reactive canvas renderings.
* **Projection Modes**: Toggle between 2D Waveform, 3D Sphere, Orbital Core, Glassmorphism, or the System Dashboard.
* **Secure API Storage**: AES-XOR ciphered local API vault for secondary model configurations.
