# Changelog

All notable changes to MAX-AII will be documented in this file.

## [2.0.0] - 2024-07-14

### ✨ Added

#### Core Systems
- **Voice Agent System**: Real-time speech-to-text and text-to-speech via NIM/Gemini API with WebRTC
- **Memory & Vector DB**: Local semantic memory with LanceDB for context retention
- **Screen Capture & OCR**: Intelligent text extraction from screen regions
- **Mobile ADB Telekinesis**: Complete Android automation (tap, swipe, file transfer, hardware control)
- **Desktop Window Manager**: Window movement, resizing, minimize/maximize operations
- **Advanced Terminal**: Non-blocking CLI execution with streaming output
- **File System Operations**: Read, write, create, search operations

#### UI Components
- **Glassmorphic Design**: Glass-effect panels with cyan/orange colors
- **Voice Widget**: Real-time voice capture (Ctrl+Space activation)
- **Mobile Control Panel**: Collapsible side panel
- **Terminal Widget**: Floating terminal
- **File Explorer**: Directory navigation
- **System Dashboard**: Real-time telemetry

#### DevOps
- **Automated Build Pipeline**: Multi-platform CI/CD
- **Size Monitoring**: Bundle size analysis
- **Auto-Release**: Automatic version releases
- **GitHub Actions**: Complete workflow automation

### 🎨 Design
- Deep Purple (#0D0221), Neon Cyan (#00F5FF), Orange (#FF6B35)
- Smooth animations (GSAP)
- Responsive layout

### 🔧 Technical Stack
- Electron 43.1 + Vite 6 + React 19 + TypeScript 5.8
- Express backend with WebSocket
- Tailwind CSS 4
- Google Gemini 3.1 Live

### 📊 Performance
- Cold Start: < 3 seconds
- Memory: 200-500MB
- Build Size: < 150MB per platform

### 🔐 Security
- API keys in OS keychain
- Local-first architecture
- IPC bridge isolation
- Context isolation enabled

## [1.0.0] - 2024-06-01

### Initial Release
- Basic Electron setup
- React UI framework
- Initial project structure