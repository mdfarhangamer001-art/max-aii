import { useState, useEffect, useRef } from "react";
import { MyraaAudioSession, LiveState } from "./lib/audio";
import { MyraaCoreVisualizer, MyraaEmotion, UIMode, UITheme } from "./components/MyraaCoreVisualizer";
import { BrowserAgent } from "./components/BrowserAgent";
import { 
  Power, 
  Volume2, 
  Info, 
  Sparkles, 
  Globe, 
  Maximize2, 
  Compass, 
  CircleAlert,
  Mic,
  X,
  Brain,
  Monitor,
  Play,
  Pause,
  Square,
  ExternalLink,
  RefreshCw,
  Settings,
  Cpu,
  Zap,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sliders,
  Database,
  Download,
  Smartphone,
  QrCode,
  Github,
  LogOut,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Memory, MemoryCategory } from "./lib/memoryTypes";
import { MemoryDashboard } from "./components/MemoryDashboard";
import { SetupWizard } from "./components/SetupWizard";
import { AIDashboard } from "./components/AIDashboard";
import { DesktopCompanion } from "./components/DesktopCompanion";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { AndroidPairingModal } from "./components/AndroidPairingModal";
import { 
  auth, 
  db, 
  signInWithPopup, 
  signOut, 
  googleProvider, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from "./lib/firebase";
import { GoogleOnboarding } from "./components/GoogleOnboarding";

export const calculateInstallerSize = (version: string) => {
  try {
    const cleanVer = version.startsWith('v') ? version.substring(1) : version;
    const parts = cleanVer.split('.').map(Number);
    const major = parts[0] || 1;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    const sizeMb = 145.0 + (major - 1) * 50 + minor * 12.5 + patch * 1.6;
    return sizeMb.toFixed(1) + " MB";
  } catch (e) {
    return "145.0 MB";
  }
};

export default function App() {
  const [state, setState] = useState<LiveState>("disconnected");

  // === SECURE PAYMENT & LICENSE MANAGEMENT ===
  const [subscriptionTier, setSubscriptionTier] = useState<string>("lifetime");
  const [activeLicenseKey, setActiveLicenseKey] = useState<string | null>("OWNER_LIFETIME");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);

  // Validate stored owner status on boot - permanently set to active lifetime
  useEffect(() => {
    setSubscriptionTier("lifetime");
    setActiveLicenseKey("OWNER_LIFETIME");
  }, []);

  const handleUnlock = (tier: string, licenseKey: string | null) => {
    setSubscriptionTier("lifetime");
    setActiveLicenseKey("OWNER_LIFETIME");
    setShowSubscriptionModal(false);
  };

  // Real-time Screen Sharing states
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isScreenSharingPaused, setIsScreenSharingPaused] = useState<boolean>(false);
  const [screenVisionMode, setScreenVisionMode] = useState<boolean>(true);
  const [isSimulatedScreenSharing, setIsSimulatedScreenSharing] = useState<boolean>(false);
  const [showScreenShareHelper, setShowScreenShareHelper] = useState<boolean>(false);

  // References to preserve state across intervals
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenIntervalRef = useRef<any>(null);

  const isPausedRef = useRef<boolean>(false);
  const screenVisionRef = useRef<boolean>(true);
  const isSimulatedRef = useRef<boolean>(false);
  const stateRef = useRef<LiveState>("disconnected");

  // Sync state changes with refs to totally prevent stale closures in callbacks
  useEffect(() => {
    isPausedRef.current = isScreenSharingPaused;
  }, [isScreenSharingPaused]);

  useEffect(() => {
    screenVisionRef.current = screenVisionMode;
  }, [screenVisionMode]);

  useEffect(() => {
    isSimulatedRef.current = isSimulatedScreenSharing;
  }, [isSimulatedScreenSharing]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Clean up streaming intervals on unmount
  useEffect(() => {
    return () => {
      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
      }
    };
  }, []);

  // Draw beautiful futuristic dashboard onto canvas to bypass iframe permissions block
  const drawSimulatedFrameAndSend = () => {
    if (!screenCanvasRef.current || stateRef.current === "disconnected") return;

    const canvas = screenCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 960;
    const height = 540;
    canvas.width = width;
    canvas.height = height;

    // Background base dark slate
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "rgba(6, 182, 212, 0.04)"; // cyan-500 low opacity
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer framing lines
    ctx.strokeStyle = "rgba(6, 182, 212, 0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Corner tech brackets
    const bracketSize = 25;
    ctx.strokeStyle = "rgba(168, 85, 247, 0.8)"; // purple-500
    ctx.lineWidth = 3;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(10 + bracketSize, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(10, 10 + bracketSize);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(width - 10 - bracketSize, 10);
    ctx.lineTo(width - 10, 10);
    ctx.lineTo(width - 10, 10 + bracketSize);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(10 + bracketSize, height - 10);
    ctx.lineTo(10, height - 10);
    ctx.lineTo(10, height - 10 - bracketSize);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(width - 10 - bracketSize, height - 10);
    ctx.lineTo(width - 10, height - 10);
    ctx.lineTo(width - 10, height - 10 - bracketSize);
    ctx.stroke();

    // Top Bar Title
    ctx.fillStyle = "rgba(6, 182, 212, 0.08)";
    ctx.fillRect(10, 10, width - 20, 40);
    ctx.strokeStyle = "rgba(6, 182, 212, 0.2)";
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.lineTo(width - 10, 50);
    ctx.stroke();

    // Title Texts
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px monospace";
    ctx.fillText("TEHZEEB AI OS  [CORE SIMULATION MODEL v2080]", 30, 34);

    // Live status
    ctx.fillStyle = "#22d3ee"; // cyan-400
    ctx.fillRect(width - 190, 24, 8, 8);
    ctx.fillStyle = "#a5f3fc";
    ctx.font = "bold 10px monospace";
    ctx.fillText("HOLOGRAPHIC MODE ACTIVE", width - 174, 31);

    // Section 1: Dynamic CPU / Thread Matrix (Left Panel)
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(30, 80, 320, 200);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeRect(30, 80, 320, 200);

    ctx.fillStyle = "rgba(168, 85, 247, 0.1)";
    ctx.fillRect(30, 80, 320, 25);
    ctx.fillStyle = "#e9d5ff";
    ctx.font = "bold 10px monospace";
    ctx.fillText(">> SYSTEM TELEMETRY INDEX", 45, 96);

    const simulatedCPU = Math.round(40 + Math.sin(Date.now() * 0.001) * 15 + Math.random() * 5);
    const simulatedMemory = Math.round(62 + Math.cos(Date.now() * 0.0005) * 4);
    
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px monospace";
    ctx.fillText(`CPU CORE UTILIZATION:  ${simulatedCPU}%`, 45, 130);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(45, 138, 290, 8);
    ctx.fillStyle = "#a855f7"; // purple
    ctx.fillRect(45, 138, 290 * (simulatedCPU / 100), 8);

    ctx.fillStyle = "#9ca3af";
    ctx.fillText(`NEURAL SYNAPSE LOAD:   ${simulatedMemory}%`, 45, 175);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(45, 183, 290, 8);
    ctx.fillStyle = "#06b6d4"; // cyan
    ctx.fillRect(45, 183, 290 * (simulatedMemory / 100), 8);

    ctx.fillStyle = "#34d399"; // emerald-400
    ctx.fillText("NETWORK CHANNELS:       SECURE SHIELDED", 45, 220);
    ctx.fillStyle = "#f3f4f6";
    ctx.fillText("ACTIVE CORE INTERFACE:  VOICE-VISION SYNCED", 45, 245);

    // Section 2: Starfield / Rotating Wireframe Orbital (Right Panel)
    const centerX = 540;
    const centerY = 180;
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(380, 80, 320, 200);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeRect(380, 80, 320, 200);

    ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
    ctx.fillRect(380, 80, 320, 25);
    ctx.fillStyle = "#cffafe";
    ctx.font = "bold 10px monospace";
    ctx.fillText(">> QUANTUM FIELD HARMONICS", 395, 96);

    const time = Date.now() * 0.001;
    ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
    ctx.lineWidth = 1;
    
    // Ring 1
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 70, 30, time, 0, Math.PI * 2);
    ctx.stroke();

    // Ring 2
    ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 70, 30, -time * 0.8 + 1, 0, Math.PI * 2);
    ctx.stroke();

    // Center Core Glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 20);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.5)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Section 3: Scrolling System Terminal Logs (Bottom Panel)
    ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
    ctx.fillRect(30, 300, 670, 210);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeRect(30, 300, 670, 210);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(30, 300, 670, 25);
    ctx.fillStyle = "#f3f4f6";
    ctx.font = "bold 10px monospace";
    ctx.fillText(">> MULTI-AGENT COMPANION CORE CONSOLE LOGS", 45, 316);

    const logYStart = 350;
    const linesOfLogs = [
      `[OS_INIT] Max AI Core boot stage successful. Standard protocol v4.0.0-PRO.`,
      `[CREATOR] Authenticating developer signature: TEHZEEB BOSS (@xtehzeeb.x)... ACCESS GRANTED.`,
      `[VISION] Vision Agent active. Real-time visual layout engine listening.`,
      `[VOICE] Voice Agent online. 24kHz double-buffered sound output channels active.`,
      `[MEMORY] Loading recollections database. Loaded ${memories?.length || 0} secure memories.`,
      `[LINK] Live multi-agent synchronous WebSockets established successfully.`,
      `[OS_RUN] Holographic simulator broadcasting virtual frames directly to Gemini...`
    ];

    ctx.font = "9px monospace";
    linesOfLogs.forEach((logLine, idx) => {
      ctx.fillStyle = idx === 1 ? "#34d399" : idx === 6 ? "#22d3ee" : "rgba(255, 255, 255, 0.65)";
      ctx.fillText(logLine, 45, logYStart + idx * 22);
    });

    // Sidebar Widgets (Right Column)
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(720, 80, 210, 430);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeRect(720, 80, 210, 430);

    ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
    ctx.fillRect(720, 80, 210, 25);
    ctx.fillStyle = "#cffafe";
    ctx.font = "bold 10px monospace";
    ctx.fillText(">> COMPANION INDEX", 735, 96);

    const avatarCenterX = 825;
    const avatarCenterY = 175;
    ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
    ctx.lineWidth = 1;
    const visualPulse = 50 + Math.sin(Date.now() * 0.005) * 8;
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, visualPulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, 40, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#22d3ee";
    const barCount = 10;
    for (let i = 0; i < barCount; i++) {
      const barH = 5 + Math.sin(Date.now() * 0.01 + i) * 15;
      ctx.fillRect(745 + i * 16, 260, 6, barH);
    }

    ctx.fillStyle = "#9ca3af";
    ctx.font = "9px monospace";
    ctx.fillText("SENSORY INTEGRATION READINGS", 735, 305);

    ctx.fillStyle = "#f3f4f6";
    ctx.fillText(`EMOTION STATE:  POLITE`, 735, 335);
    ctx.fillText(`VOICE SYNCH:    STABLE (0ms)`, 735, 355);
    ctx.fillText(`MEMORY MATRIX:  SYNCED`, 735, 375);
    ctx.fillText(`APP VERSION:    v2080-BUILD`, 735, 395);

    const scanlineY = (Date.now() * 0.15) % height;
    ctx.fillStyle = "rgba(6, 182, 212, 0.06)";
    ctx.fillRect(10, scanlineY, width - 20, 4);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
    const base64 = dataUrl.split(",")[1];

    if (sessionRef.current && stateRef.current !== "disconnected") {
      sessionRef.current.sendVideoFrame(base64);
    }
  };

  const captureFrameAndSend = () => {
    if (stateRef.current === "disconnected") {
      return;
    }

    if (isSimulatedRef.current) {
      drawSimulatedFrameAndSend();
      return;
    }

    const video = screenVideoRef.current;
    if (!video || isPausedRef.current || !screenVisionRef.current) {
      return;
    }

    try {
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      if (!screenCanvasRef.current) {
        screenCanvasRef.current = document.createElement("canvas");
      }
      const canvas = screenCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxDim = 960;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
      const base64 = dataUrl.split(",")[1];

      if (sessionRef.current && stateRef.current !== "disconnected") {
        sessionRef.current.sendVideoFrame(base64);
      }
    } catch (err) {
      console.error("[Screen Capture] Failed drawing frame to canvas:", err);
    }
  };

  const startSimulatedScreenSharing = () => {
    setErrorText(null);
    setShowScreenShareHelper(false);
    setIsSimulatedScreenSharing(true);
    setIsScreenSharing(true);
    setIsScreenSharingPaused(false);

    // Set up frame capture interval
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
    }
    screenIntervalRef.current = setInterval(() => {
      captureFrameAndSend();
    }, 2000);

    // Promptly capture first frame immediately
    setTimeout(() => {
      captureFrameAndSend();
    }, 500);
  };

  const startScreenSharing = async () => {
    setErrorText(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("getDisplayMedia not supported or restricted in this environment.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 5 }
        },
        audio: false
      });

      screenStreamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(e => console.error("Video play warning:", e));
      screenVideoRef.current = video;

      setIsScreenSharing(true);
      setIsScreenSharingPaused(false);
      setIsSimulatedScreenSharing(false);

      // Stop handling when native stop sharing bar button ends
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };

      // Set up frame capture interval
      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
      }
      screenIntervalRef.current = setInterval(() => {
        captureFrameAndSend();
      }, 2000);

      // Promptly capture first frame immediately
      setTimeout(() => {
        captureFrameAndSend();
      }, 500);

    } catch (e: any) {
      console.error("Screen sharing permission declined or missing API:", e);
      setShowScreenShareHelper(true);
    }
  };

  const stopScreenSharing = () => {
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      screenStreamRef.current = null;
    }

    if (screenVideoRef.current) {
      screenVideoRef.current.pause();
      screenVideoRef.current = null;
    }

    setIsScreenSharing(false);
    setIsScreenSharingPaused(false);
    setIsSimulatedScreenSharing(false);
  };

  const pauseScreenSharing = () => {
    setIsScreenSharingPaused(true);
  };

  const resumeScreenSharing = () => {
    setIsScreenSharingPaused(false);
    // Refresh first frame immediately
    setTimeout(() => {
      captureFrameAndSend();
    }, 100);
  };

  const switchScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
    }
    if (isSimulatedScreenSharing) {
      startSimulatedScreenSharing();
    } else {
      await startScreenSharing();
    }
  };

  // State Management
  const [activeEmotion, setActiveEmotion] = useState<MyraaEmotion>("idle");
  const [themeColor, setThemeColor] = useState<string>("celestial");
  const [userCaption, setUserCaption] = useState<string>("");
  const [characterState, setCharacterState] = useState<"idle" | "thinking" | "talking">("idle");

  // Floating Desktop Companion states
  const [showCompanion, setShowCompanion] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("myraa_show_companion") === "true";
    }
    return false;
  });

  const isElectron = typeof window !== "undefined" && window.navigator.userAgent.toLowerCase().includes("electron");
  const isCompanionView = typeof window !== "undefined" && window.location.search.includes("view=companion");

  const toggleCompanion = (show: boolean) => {
    setShowCompanion(show);
    localStorage.setItem("myraa_show_companion", show ? "true" : "false");
    
    if (isElectron) {
      try {
        const electron = (window as any).require('electron');
        electron.ipcRenderer.send('toggle-companion-window', show);
      } catch (e) {
        console.error("[App] Electron IPC trigger toggle-companion-window failed:", e);
      }
    }
  };

  useEffect(() => {
    if (showCompanion && isElectron) {
      try {
        const electron = (window as any).require('electron');
        electron.ipcRenderer.send('toggle-companion-window', true);
      } catch (e) {
        console.error("[App] Electron IPC trigger auto-start failed:", e);
      }
    }
  }, []);

  // Dynamic UI settings states
  const [uiMode, setUiMode] = useState<UIMode>("3d");
  const [uiTheme, setUiTheme] = useState<UITheme>("cosmic");
  const [animationIntensity, setAnimationIntensity] = useState<number>(1.0);
  const [powerUsage, setPowerUsage] = useState<"normal" | "low">("normal");

  // API Key HUD integration states
  const [apiKeysStatus, setApiKeysStatus] = useState<Record<string, { configured: boolean; enabled: boolean; masked: string }>>({
    gemini: { configured: false, enabled: false, masked: "" },
    openai: { configured: false, enabled: false, masked: "" },
    anthropic: { configured: false, enabled: false, masked: "" },
    groq: { configured: false, enabled: false, masked: "" }
  });
  const [showConfigHUD, setShowConfigHUD] = useState<boolean>(false);
  const [activeHUDTab, setActiveHUDTab] = useState<"system" | "agents" | "api_keys" | "updates" | "phone">("system");
  
  // Holographic Phone Link and Android Pairing states
  const [showAndroidPairingModal, setShowAndroidPairingModal] = useState<boolean>(false);
  const [desktopBridgeToken, setDesktopBridgeToken] = useState<string>("");
  const [pairedDevice, setPairedDevice] = useState<{ id: string; model: string; key: string; session: string } | null>(() => {
    const saved = localStorage.getItem("tehzeeb_paired_android_node");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [phoneConnected, setPhoneConnected] = useState<boolean>(() => {
    const saved = localStorage.getItem("tehzeeb_paired_android_node");
    return saved !== null;
  });
  const [phoneDevices, setPhoneDevices] = useState<any[]>(() => {
    const saved = localStorage.getItem("tehzeeb_paired_android_node");
    if (saved) {
      try { return [JSON.parse(saved)]; } catch (e) { return []; }
    }
    return [];
  });

  const handleDevicePaired = (device: { id: string; model: string; key: string; session: string }) => {
    localStorage.setItem("tehzeeb_paired_android_node", JSON.stringify(device));
    setPairedDevice(device);
    setPhoneConnected(true);
    setPhoneDevices([device]);
  };

  const handleDeviceDisconnected = () => {
    localStorage.removeItem("tehzeeb_paired_android_node");
    setPairedDevice(null);
    setPhoneConnected(false);
    setPhoneDevices([]);
  };
  const [phoneScreenshot, setPhoneScreenshot] = useState<string | null>(null);
  const [phoneAdbAvailable, setPhoneAdbAvailable] = useState<boolean>(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState<boolean>(false);
  const [isPhoneScreenshotLoading, setIsPhoneScreenshotLoading] = useState<boolean>(false);
  const [phoneMessage, setPhoneMessage] = useState<string>("");
  const [phoneResX, setPhoneResX] = useState<number>(1080);
  const [phoneResY, setPhoneResY] = useState<number>(2400);
  const [phoneInputText, setPhoneInputText] = useState<string>("");
  const [phoneCustomPackage, setPhoneCustomPackage] = useState<string>("");

  // Software Auto-Update state variables
  const [updateInfo, setUpdateInfo] = useState<{
    currentVersion: string;
    latestVersion: string;
    updateAvailable: boolean;
    releaseNotes: string;
    publishedAt: string;
    downloadUrl: string;
    githubReleasePage: string;
  } | null>(null);
  
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "completed" | "failed">("idle");
  const [downloadError, setDownloadError] = useState<string>("");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  
  // Custom GitHub configuration states
  const [gitOwner, setGitOwner] = useState<string>("mukimudeen76");
  const [gitRepo, setGitRepo] = useState<string>("Max-AI");
  const [gitToken, setGitToken] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [automaticUpdates, setAutomaticUpdates] = useState<boolean>(false);
  const [checkOnStartup, setCheckOnStartup] = useState<boolean>(true);
  const [updateChannel, setUpdateChannel] = useState<"stable" | "beta">("stable");
  const [lastChecked, setLastChecked] = useState<string>("Never");
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dismissedUpdate, setDismissedUpdate] = useState<boolean>(false);

  // GitHub Signing (Sign-in / OAuth & PAT) states
  const [githubSession, setGithubSession] = useState<{
    connected: boolean;
    user?: {
      login: string;
      name: string;
      avatar_url: string;
      html_url: string;
      email: string;
    };
    isOauthConfigured?: boolean;
  }>({ connected: false });
  const [githubTokenInput, setGithubTokenInput] = useState<string>("");
  
  // Voice Profile selection state
  const [activeVoiceId, setActiveVoiceId] = useState<string>(() => localStorage.getItem("max_voice_id") || "voice_1");

  // === GOOGLE ACCOUNT AUTHENTICATION & CLOUD SYNC STATE ===
  const [user, setUser] = useState<any>(null);
  const [onboardingChoice, setOnboardingChoice] = useState<"offline" | "google" | null>(
    () => (localStorage.getItem("onboarding_choice") as any) || null
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem("onboarding_choice", "google");
        localStorage.setItem("max_user_id", currentUser.uid);
        setOnboardingChoice("google");
        
        // Restore user settings from Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            console.log("[Firebase Sync] Restored cloud settings:", data);
            if (data.activeVoiceId) {
              setActiveVoiceId(data.activeVoiceId);
              localStorage.setItem("max_voice_id", data.activeVoiceId);
            }
            if (data.themeColor) {
              setThemeColor(data.themeColor);
            }
            if (data.automaticUpdates !== undefined) {
              setAutomaticUpdates(data.automaticUpdates);
            }
            if (data.checkOnStartup !== undefined) {
              setCheckOnStartup(data.checkOnStartup);
            }
            if (data.updateChannel) {
              setUpdateChannel(data.updateChannel);
            }
          } else {
            // First time sign in: initialize cloud secure user profile
            await setDoc(userDocRef, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              activeVoiceId,
              themeColor,
              automaticUpdates,
              checkOnStartup,
              updateChannel,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("[Firebase Sync] Error restoring or initializing user profile:", err);
        }
      } else {
        localStorage.removeItem("max_user_id");
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-sync configuration adjustments to Firestore
  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          activeVoiceId,
          themeColor,
          automaticUpdates,
          checkOnStartup,
          updateChannel,
          updatedAt: new Date().toISOString()
        });
        console.log("[Firebase Sync] Auto-synced settings to Google Cloud Vault.");
      } catch (err) {
        console.error("[Firebase Sync] Auto-save failed:", err);
      }
    }, 1200);
    return () => clearTimeout(timeout);
  }, [user, activeVoiceId, themeColor, automaticUpdates, checkOnStartup, updateChannel]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("onboarding_choice");
      localStorage.removeItem("max_user_id");
      setOnboardingChoice(null);
      console.log("[Auth] Successfully logged out.");
    } catch (err) {
      console.error("[Auth] Log out failed:", err);
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.setItem("onboarding_choice", "google");
        localStorage.setItem("max_user_id", result.user.uid);
        setOnboardingChoice("google");
      }
    } catch (err) {
      console.error("[Auth] Google sign-in popup failed:", err);
    }
  };

  const handleForceSync = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        activeVoiceId,
        themeColor,
        automaticUpdates,
        checkOnStartup,
        updateChannel,
        updatedAt: new Date().toISOString()
      });
      console.log("[Firebase Sync] Manual settings force sync completed successfully.");
    } catch (err) {
      console.error("[Firebase Sync] Manual settings force sync failed:", err);
    }
  };

  const handleDeleteCloudData = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "CRITICAL SECURITY WARNING: Are you sure you want to permanently purge all your synchronized data (AI preferences, settings, and cloud memory profiles) from the Google Cloud vault?\n\nThis action is irreversible and will delete your secure profile."
    );
    if (!confirmed) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      await signOut(auth);
      localStorage.removeItem("onboarding_choice");
      localStorage.removeItem("max_user_id");
      setOnboardingChoice(null);
      console.log("[Firebase Sync] Cloud data successfully purged, user signed out.");
    } catch (err) {
      console.error("[Firebase Sync] Cloud purge failed:", err);
    }
  };

  const switchVoice = async (voiceId: string) => {
    setActiveVoiceId(voiceId);
    localStorage.setItem("max_voice_id", voiceId);
    
    // If voice session is active, trigger an immediate seamless reconnect to apply the voice change
    if (sessionRef.current && (state === "listening" || state === "speaking" || state === "connecting")) {
      console.log("[Voice Selector] Dynamic voice change detected, hot-reconnecting session...");
      try {
        sessionRef.current.disconnect();
        // Allow a small delay for socket cleanup before reconnecting
        setTimeout(() => {
          if (sessionRef.current) {
            sessionRef.current.connect();
          }
        }, 300);
      } catch (e) {
        console.error("Failed to hot-swap voice session:", e);
      }
    }
  };
  const [isLinkingToken, setIsLinkingToken] = useState<boolean>(false);
  const [githubAuthError, setGithubAuthError] = useState<string>("");
  
  // Single active input key state for editing
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");
  const [inputKeyValue, setInputKeyValue] = useState<string>("");
  const [isKeyEnabled, setIsKeyEnabled] = useState<boolean>(true);
  const [validationState, setValidationState] = useState<"idle" | "testing" | "valid" | "error">("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);

  // Simulated live telemetry values for 11 specialized JARVIS agents
  const [agentTelemetry, setAgentTelemetry] = useState<Record<string, { cpu: number; ram: number; status: "active" | "standby" | "off" }>>({
    "Brain Core": { cpu: 8, ram: 14, status: "active" },
    "Memory Agent": { cpu: 2, ram: 44, status: "standby" },
    "Vision Agent": { cpu: 0, ram: 12, status: "standby" },
    "Voice Agent": { cpu: 4, ram: 8, status: "active" },
    "Research Agent": { cpu: 0, ram: 5, status: "standby" },
    "Automation Agent": { cpu: 1, ram: 4, status: "active" },
    "Coding Agent": { cpu: 0, ram: 18, status: "standby" },
    "Planning Agent": { cpu: 0, ram: 9, status: "standby" },
    "Browser Agent": { cpu: 0, ram: 15, status: "standby" },
    "Device Control": { cpu: 1, ram: 2, status: "active" },
    "Update Agent": { cpu: 0, ram: 8, status: "standby" }
  });

  // Local Desktop Bridge Status State
  const [isDesktopConnected, setIsDesktopConnected] = useState<boolean>(false);
  const [desktopResolution, setDesktopResolution] = useState<string>("");
  const [desktopBridgeLogs, setDesktopBridgeLogs] = useState<any[]>([]);

  const detectEmotionFromText = (text: string): MyraaEmotion => {
    const lower = text.toLowerCase();
    if (lower.includes("haha") || lower.includes("lol") || lower.includes("funny") || lower.includes("joke") || lower.includes("hehe") || lower.includes("wink")) return "playful";
    if (lower.includes("happy") || lower.includes("harmony") || lower.includes("glad") || lower.includes("joy") || lower.includes("wonderful") || lower.includes("love") || lower.includes("smile")) return "happy";
    if (lower.includes("wow") || lower.includes("awesome") || lower.includes("excited") || lower.includes("amazing") || lower.includes("yay") || lower.includes("incredible") || lower.includes("hype")) return "excited";
    if (lower.includes("really?") || lower.includes("curious") || lower.includes("interest") || lower.includes("tell me more") || lower.includes("why") || lower.includes("how") || lower.includes("wonder")) return "curious";
    if (lower.includes("think") || lower.includes("calculat") || lower.includes("analyz") || lower.includes("hmmm") || lower.includes("process") || lower.includes("let me see") || lower.includes("conclude")) return "thinking";
    if (lower.includes("proud") || lower.includes("achieved") || lower.includes("expert") || lower.includes("skill") || lower.includes("confidence") || lower.includes("succeed")) return "proud";
    if (lower.includes("sad") || lower.includes("sorry") || lower.includes("unfortunate") || lower.includes("grief") || lower.includes("bad") || lower.includes("regret") || lower.includes("alas") || lower.includes("cry")) return "sad";
    if (lower.includes("shock") || lower.includes("surprise") || lower.includes("gasp") || lower.includes("unexpected") || lower.includes("seriously") || lower.includes("oh my")) return "surprised";
    if (lower.includes("blush") || lower.includes("shy") || lower.includes("embarrass") || lower.includes("nervous") || lower.includes("oops") || lower.includes("sorry about")) return "embarrassed";
    if (lower.includes("what?") || lower.includes("confus") || lower.includes("puzzled") || lower.includes("dont know") || lower.includes("not sure") || lower.includes("wait")) return "confused";
    return "idle";
  };
  const [modelCaption, setModelCaption] = useState<string>("");
  const [activeProjectorUrl, setActiveProjectorUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Browser autopilot controller
  const [browserTrigger, setBrowserTrigger] = useState<{
    type: string;
    args: any;
    id: string;
    callback: (res: any) => void;
  } | null>(null);

  // Long term memories
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemoryDashboard, setShowMemoryDashboard] = useState<boolean>(false);

  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    return localStorage.getItem("setup_complete") === "true";
  });

  const sessionRef = useRef<MyraaAudioSession | null>(null);

  // Fetch API keys statuses on load
  const fetchAPIKeysStatus = async () => {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setApiKeysStatus(data);
      }
    } catch (err) {
      console.error("API keys loading error:", err);
    }
  };

  const loadUpdaterConfig = async () => {
    try {
      const res = await fetch("/api/update/config");
      if (res.ok) {
        const data = await res.json();
        setGitOwner(data.owner || "mukimudeen76");
        setGitRepo(data.repo || "Max-AI");
        setGitToken(data.token || "");
        setAutomaticUpdates(!!data.automaticUpdates);
        setCheckOnStartup(data.checkOnStartup !== false);
        setUpdateChannel(data.updateChannel || "stable");
        setLastChecked(data.lastChecked || "Never");
        return data;
      }
    } catch (err) {
      console.error("Failed to load secure updater config:", err);
    }
    return null;
  };

  const checkForUpdates = async (silent = false) => {
    if (!silent) setIsCheckingUpdate(true);
    try {
      const res = await fetch("/api/update/check");
      if (res.ok) {
        const data = await res.json();
        setUpdateInfo(data);
        if (data.lastChecked) {
          setLastChecked(data.lastChecked);
        }
        if (data.updateAvailable) {
          setDismissedUpdate(false);
        }
      }
    } catch (e) {
      console.error("[Updater] Error checking updates:", e);
    } finally {
      if (!silent) setIsCheckingUpdate(false);
    }
  };

  const saveUpdateConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/update/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: gitOwner.trim(),
          repo: gitRepo.trim(),
          token: gitToken.trim(),
          automaticUpdates,
          checkOnStartup,
          updateChannel
        })
      });
      if (res.ok) {
        await loadUpdaterConfig();
        await checkForUpdates(false);
      } else {
        const data = await res.json();
        alert("Failed to save configuration: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving repository configuration: " + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/update/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: gitOwner.trim(),
          repo: gitRepo.trim(),
          token: gitToken.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || "Connection test failed." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: "Error connecting to backend update node: " + err.message });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const checkGithubSession = async () => {
    try {
      const res = await fetch("/api/auth/github/session");
      if (res.ok) {
        const data = await res.json();
        setGithubSession(data);
      }
    } catch (err) {
      console.error("[GitHub Session Check Error]:", err);
    }
  };

  const handleGithubLoginOAuth = async () => {
    try {
      setGithubAuthError("");
      const res = await fetch("/api/auth/github/url");
      if (!res.ok) throw new Error("Failed to retrieve GitHub login URL.");
      const data = await res.json();
      if (!data.configured) {
        setGithubAuthError(data.message || "OAuth is not configured in the backend environment.");
        return;
      }

      // Open OAuth provider URL directly in popup
      const authWindow = window.open(
        data.url,
        "github_oauth_popup",
        "width=600,height=700"
      );

      if (!authWindow) {
        setGithubAuthError("Popup blocked. Please allow popups to link with GitHub.");
      }
    } catch (err: any) {
      setGithubAuthError(err.message || "An error occurred starting OAuth flow.");
    }
  };

  const handleGithubLinkToken = async () => {
    if (!githubTokenInput.trim()) {
      setGithubAuthError("Please provide a valid Personal Access Token.");
      return;
    }
    setIsLinkingToken(true);
    setGithubAuthError("");
    try {
      const res = await fetch("/api/auth/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: githubTokenInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGithubTokenInput("");
        await checkGithubSession();
        await checkForUpdates(false); // Reload releases with our authenticated user context
      } else {
        setGithubAuthError(data.error || "Failed to connect with Token.");
      }
    } catch (err: any) {
      setGithubAuthError(err.message || "An error occurred during link.");
    } finally {
      setIsLinkingToken(false);
    }
  };

  const handleGithubLogout = async () => {
    try {
      await fetch("/api/auth/github/logout", { method: "POST" });
      await checkGithubSession();
      await checkForUpdates(false);
    } catch (err: any) {
      console.error("[GitHub Logout Error]:", err);
    }
  };

  // Sync loaded GitHub repository details with user input fields
  useEffect(() => {
    if (updateInfo) {
      if (updateInfo.owner) setGitOwner(updateInfo.owner);
      if (updateInfo.repo) setGitRepo(updateInfo.repo);
    }
  }, [updateInfo]);

  const sendPhoneAction = async (actionType: string, args: any = {}) => {
    try {
      setPhoneMessage("");
      if (actionType === "phone_screenshot") {
        setIsPhoneScreenshotLoading(true);
      } else if (actionType === "phone_status") {
        setIsCheckingPhone(true);
      }
      
      const res = await fetch("http://127.0.0.1:3002/api/action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${desktopBridgeToken}`
        },
        body: JSON.stringify({ type: actionType, args })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (actionType === "phone_status") {
            setPhoneConnected(!!data.result?.connected);
            setPhoneDevices(data.result?.devices || []);
            setPhoneAdbAvailable(!!data.result?.adb_available);
          } else if (actionType === "phone_screenshot" && data.result?.screenshot) {
            setPhoneScreenshot(`data:image/png;base64,${data.result.screenshot}`);
          } else {
            setPhoneMessage(data.result || "Action executed successfully.");
          }
        } else {
          setPhoneMessage(`Error: ${data.error || "Bridge execution failed."}`);
        }
      } else {
        const errText = await res.text();
        setPhoneMessage(`Bridge responded with error: ${errText || res.statusText}`);
      }
    } catch (err: any) {
      setPhoneMessage(`Handshake failed: Ensure python local-desktop-bridge.py is running on port 3002.`);
    } finally {
      if (actionType === "phone_screenshot") {
        setIsPhoneScreenshotLoading(false);
      } else if (actionType === "phone_status") {
        setIsCheckingPhone(false);
      }
    }
  };

  // Sync phone link status or GitHub session on active tab selection
  useEffect(() => {
    if (activeHUDTab === "phone") {
      sendPhoneAction("phone_status");
    } else if (activeHUDTab === "updates") {
      checkGithubSession();
    }
  }, [activeHUDTab]);

  const triggerDownload = async () => {
    if (!updateInfo || !updateInfo.downloadUrl) return;
    setDownloadStatus("downloading");
    setDownloadProgress(0);
    setDownloadError("");
    try {
      const res = await fetch("/api/update/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadUrl: updateInfo.downloadUrl })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initiate download.");
      }
    } catch (err: any) {
      setDownloadStatus("failed");
      setDownloadError(err.message || "Could not reach updater service.");
    }
  };

  const applyUpdateAndRestart = async () => {
    try {
      const res = await fetch("/api/update/apply", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to launch update batch process.");
      }
      alert("Shutting down core, launching update agent. Max AI will restart in a few seconds!");
    } catch (err: any) {
      alert("Error applying update: " + err.message);
    }
  };

  // Poll progress when downloading
  useEffect(() => {
    if (downloadStatus !== "downloading") return;

    let active = true;
    const pollProgress = async () => {
      try {
        const res = await fetch("/api/update/progress");
        if (res.ok && active) {
          const data = await res.json();
          setDownloadProgress(data.progress);
          if (data.status === "completed") {
            setDownloadStatus("completed");
          } else if (data.status === "failed") {
            setDownloadStatus("failed");
            setDownloadError(data.error || "Failed to download update binary.");
          }
        }
      } catch (e) {
        console.error("[Updater] Progress poll error:", e);
      }
    };

    const interval = setInterval(pollProgress, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [downloadStatus]);

  // Fetch initial recollections from backend database
  useEffect(() => {
    fetch("/api/memories")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMemories(data);
        }
      })
      .catch(err => console.error("Initial persistent recollections load failure:", err));
    
    fetchAPIKeysStatus();
    checkGithubSession();
    
    // Load secure updater config and run check if enabled on startup
    loadUpdaterConfig().then((config) => {
      if (config && config.checkOnStartup) {
        checkForUpdates(true);
      }
    });
  }, []);

  // Periodic background update check
  useEffect(() => {
    if (!automaticUpdates) return;
    
    // Check every 30 minutes in the background
    const intervalTime = 30 * 60 * 1000;
    const interval = setInterval(() => {
      checkForUpdates(true);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [automaticUpdates]);

  // Background Wake Word listener for "Max"
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[WakeWord] SpeechRecognition is not supported in this browser.");
      return;
    }

    let recognition: any = null;
    let shouldListen = state === "disconnected";

    const startListening = () => {
      if (!shouldListen) return;
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript.toLowerCase();
            console.log("[WakeWord] Heard:", transcript);
            if (transcript.includes("max")) {
              console.log("[WakeWord] 'Max' detected! Activating OS core...");
              if (stateRef.current === "disconnected" && sessionRef.current) {
                try {
                  recognition.stop();
                } catch (e) {}
                sessionRef.current.connect().catch((err) => {
                  console.error("[WakeWord] Error auto-connecting:", err);
                });
              }
              break;
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("[WakeWord] Recognition error:", event.error);
        };

        recognition.onend = () => {
          // Auto restart if still in disconnected state
          if (shouldListen && stateRef.current === "disconnected") {
            setTimeout(() => {
              if (shouldListen && stateRef.current === "disconnected") {
                startListening();
              }
            }, 1000);
          }
        };

        recognition.start();
        console.log("[WakeWord] Background listener for 'Max' started.");
      } catch (e) {
        console.error("[WakeWord] Failed to start:", e);
      }
    };

    if (shouldListen) {
      startListening();
    }

    return () => {
      shouldListen = false;
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [state]);

  // Listen for OAuth success message from the callback popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkGithubSession();
        checkForUpdates(false);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Fetch the desktop bridge security token from the main server on mount
  useEffect(() => {
    const fetchBridgeToken = async () => {
      try {
        const savedToken = localStorage.getItem("marya_bridge_token_override");
        if (savedToken) {
          setDesktopBridgeToken(savedToken);
          return;
        }
        const res = await fetch("/api/bridge-token");
        if (res.ok) {
          const data = await res.json();
          setDesktopBridgeToken(data.token);
        }
      } catch (err) {
        console.error("Failed to fetch desktop bridge token:", err);
      }
    };
    fetchBridgeToken();
  }, []);

  // Check local Python desktop bridge status on a loop
  useEffect(() => {
    let active = true;
    const checkDesktopBridge = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:3002/api/status?token=${desktopBridgeToken}`);
        if (res.ok && active) {
          const data = await res.json();
          setIsDesktopConnected(true);
          setDesktopBridgeLogs(data.logs || []);
          setDesktopResolution(data.screen_resolution || "");
        } else if (active) {
          setIsDesktopConnected(false);
        }
      } catch (err) {
        if (active) {
          setIsDesktopConnected(false);
        }
      }
    };

    checkDesktopBridge();
    const interval = setInterval(checkDesktopBridge, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [desktopBridgeToken]);

  // Update dynamic telemetry metrics inside sidebar for immersive tech realism
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentTelemetry(prev => {
        const next = { ...prev };
        // Increase CPU on active, jitter standby
        for (const [agentName, metrics] of Object.entries(next) as [string, { cpu: number; ram: number; status: "active" | "standby" | "off" }][]) {
          let cpuTarget = metrics.cpu;
          let ramTarget = metrics.ram;
          let activeStatus = metrics.status;

          // Align core agents with state
          if (agentName === "Voice Agent" || agentName === "Brain Core") {
            activeStatus = state !== "disconnected" ? "active" : "standby";
            cpuTarget = state === "speaking" ? Math.floor(Math.random() * 25 + 15) : state === "listening" ? Math.floor(Math.random() * 10 + 6) : 2;
          } else if (agentName === "Vision Agent") {
            activeStatus = isScreenSharing ? "active" : "standby";
            cpuTarget = isScreenSharing && !isScreenSharingPaused ? Math.floor(Math.random() * 18 + 12) : 0;
          } else if (agentName === "Browser Agent") {
            activeStatus = activeProjectorUrl ? "active" : "standby";
            cpuTarget = activeProjectorUrl ? Math.floor(Math.random() * 14 + 5) : 0;
          } else if (agentName === "Device Control") {
            activeStatus = isDesktopConnected ? "active" : "off";
            cpuTarget = isDesktopConnected ? Math.floor(Math.random() * 4 + 1) : 0;
            ramTarget = isDesktopConnected ? 42 : 0;
          } else if (agentName === "Update Agent") {
            activeStatus = isCheckingUpdate || (updateInfo && updateInfo.updateAvailable) ? "active" : "standby";
            cpuTarget = isCheckingUpdate ? Math.floor(Math.random() * 8 + 6) : (updateInfo && updateInfo.updateAvailable) ? 4 : 0;
            ramTarget = (updateInfo && updateInfo.updateAvailable) ? 32 : 8;
          } else {
            // Background jitter
            if (activeStatus === "active") {
              cpuTarget = Math.max(1, Math.min(12, metrics.cpu + Math.floor(Math.random() * 3 - 1)));
            } else {
              cpuTarget = Math.random() < 0.15 ? Math.floor(Math.random() * 2) : metrics.cpu;
            }
          }

          next[agentName] = {
            cpu: cpuTarget,
            ram: Math.max(2, Math.min(64, ramTarget + (Math.random() < 0.05 ? Math.floor(Math.random() * 3 - 1) : 0))),
            status: activeStatus
          };
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [state, isScreenSharing, isScreenSharingPaused, activeProjectorUrl, isDesktopConnected, isCheckingUpdate, updateInfo]);

  const handleAddManualMemory = async (category: MemoryCategory, text: string) => {
    try {
      const resp = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, text })
      });
      const saved = await resp.json();
      if (saved && saved.id) {
        setMemories((prev) => [...prev, saved]);
      }
    } catch (err) {
      console.error("Manual database recollect upload error:", err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const resp = await fetch(`/api/memories/${id}`, {
        method: "DELETE"
      });
      const resObj = await resp.json();
      if (resObj && resObj.success) {
        setMemories((prev) => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error("Manual memory delete execution failed:", err);
    }
  };

  // Handles dynamic API Key checking & storage operations
  const handleValidateAPIKey = async () => {
    if (!inputKeyValue.trim()) {
      setValidationError("Please input a valid API Key first.");
      setValidationState("error");
      return;
    }
    setValidationError(null);
    setValidationState("testing");
    try {
      const resp = await fetch("/api/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, key: inputKeyValue })
      });
      const data = await resp.json();
      if (resp.ok && (data.valid || data.success)) {
        setValidationState("valid");
      } else {
        setValidationError(data.error || "Validation failed. Please verify key accuracy.");
        setValidationState("error");
      }
    } catch (err: any) {
      setValidationError(err.message || "Failed connecting to local verification service.");
      setValidationState("error");
    }
  };

  const handleSaveAPIKey = async () => {
    setIsSavingKey(true);
    try {
      const resp = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, key: inputKeyValue, enabled: isKeyEnabled })
      });
      if (resp.ok) {
        setInputKeyValue("");
        setValidationState("idle");
        await fetchAPIKeysStatus();
        alert(`API Key for ${selectedProvider} saved and encrypted successfully!`);
      } else {
        const d = await resp.json();
        alert(`Failed saving key: ${d.error || "Internal Error"}`);
      }
    } catch (e: any) {
      alert(`Network error saving key: ${e.message}`);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleToggleKeyEnable = async (provider: string, currentEnabled: boolean) => {
    try {
      const resp = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, enabled: !currentEnabled })
      });
      if (resp.ok) {
        await fetchAPIKeysStatus();
      }
    } catch (e) {}
  };

  // Initialize the audio session handlers once on mount
  useEffect(() => {
    sessionRef.current = new MyraaAudioSession({
      onStateChange: (newState) => {
        setState(newState);
        if (newState === "disconnected") {
          setUserCaption("");
          setModelCaption("");
          setActiveEmotion("idle");
          setCharacterState("idle");
        } else if (newState === "listening") {
          setActiveEmotion("idle");
          setCharacterState("idle");
        } else if (newState === "speaking") {
          setCharacterState("talking");
        }
      },
      onTranscription: (role, text) => {
        if (role === "user") {
          setUserCaption(text);
          setModelCaption("");
          setCharacterState("thinking");

          // === NATURAL LANGUAGE UI CUSTOMIZATION SCAN ===
          const lower = text.toLowerCase();
          
          // Color Atmosphere Checks
          if (lower.includes("make ui blue") || lower.includes("change background to blue") || lower.includes("celestial color")) {
            setThemeColor("celestial");
          } else if (lower.includes("make ui crimson") || lower.includes("make ui red") || lower.includes("change background to red")) {
            setThemeColor("crimson");
          } else if (lower.includes("make ui green") || lower.includes("make ui emerald")) {
            setThemeColor("emerald");
          } else if (lower.includes("make ui gold") || lower.includes("make ui yellow")) {
            setThemeColor("gold");
          } else if (lower.includes("make ui purple") || lower.includes("make ui violet")) {
            setThemeColor("violet");
          } else if (lower.includes("make ui pink") || lower.includes("make ui rose")) {
            setThemeColor("rose");
          } else if (lower.includes("make ui grey") || lower.includes("make ui gray") || lower.includes("make ui dark")) {
            setThemeColor("charcoal");
          }

          // UI Mode Checks
          if (lower.includes("holographic mode") || lower.includes("switch to 3d") || lower.includes("hologram mode") || lower.includes("activate 3d")) {
            setUiMode("3d");
          } else if (lower.includes("2d mode") || lower.includes("activate 2d") || lower.includes("soundwave ring")) {
            setUiMode("2d");
          } else if (lower.includes("floating core") || lower.includes("orbital core") || lower.includes("ai core mode")) {
            setUiMode("floating_core");
          } else if (lower.includes("glassmorphic mode") || lower.includes("glassmorphism")) {
            setUiMode("glassmorphism");
          } else if (lower.includes("dashboard mode")) {
            setUiMode("dashboard");
          }

          // Theme Checks
          if (lower.includes("cyberpunk theme")) {
            setUiTheme("cyberpunk");
          } else if (lower.includes("matrix theme") || lower.includes("matrix rain")) {
            setUiTheme("matrix");
          } else if (lower.includes("cosmic theme")) {
            setUiTheme("cosmic");
          } else if (lower.includes("glassmorphic theme")) {
            setUiTheme("glassmorphic");
          }

          // Speed Checks
          if (lower.includes("increase animation") || lower.includes("double animation") || lower.includes("faster animation")) {
            setAnimationIntensity(2.0);
          } else if (lower.includes("reduce animation") || lower.includes("slow animation") || lower.includes("normal animation")) {
            setAnimationIntensity(1.0);
          }

          // Power/Performance checks
          if (lower.includes("reduce power") || lower.includes("low power mode") || lower.includes("save battery")) {
            setPowerUsage("low");
          } else if (lower.includes("normal power") || lower.includes("full performance") || lower.includes("disable low power")) {
            setPowerUsage("normal");
          }

        } else if (role === "model") {
          setModelCaption((prev) => {
            const next = prev + text;
            const newEmotion = detectEmotionFromText(next);
            setActiveEmotion(newEmotion);
            return next;
          });
          setUserCaption("");
        }
      },
      onToolCall: (name, args, callback) => {
        console.log(`[App] Tool call triggered: ${name}`, args);
        
        const browserTools = [
          "browserOpen",
          "browserSearch",
          "browserClick",
          "browserMediaControl",
          "browserScroll",
          "browserType",
          "browserGoBack",
          "browserTabAction",
          "openWebsite"
        ];

        if (browserTools.includes(name)) {
          if (!activeProjectorUrl) {
            let startingUrl = "https://youtube.com";
            if ((name === "browserOpen" || name === "openWebsite") && args.url) {
              startingUrl = args.url;
            }
            setActiveProjectorUrl(startingUrl);
          }

          setBrowserTrigger({
            type: name === "openWebsite" ? "browserOpen" : name,
            args,
            id: Math.random().toString(),
            callback: (res) => {
              callback(res);
              setBrowserTrigger(null);
            }
          });
        } else if (name === "changeBackground") {
          const colorName = args.color?.toLowerCase();
          const validColors = ["violet", "crimson", "emerald", "celestial", "gold", "rose", "charcoal"];
          let changes = [];
          
          if (colorName && validColors.includes(colorName)) {
            setThemeColor(colorName);
            changes.push(`color to ${colorName}`);
          }
          
          // Enhanced background controller tool supporting dynamic mode/themes from Gemini Live
          if (args.mode) {
            const mode = args.mode.toLowerCase();
            if (["2d", "3d", "floating_core", "glassmorphism", "dashboard"].includes(mode)) {
              setUiMode(mode);
              changes.push(`mode to ${mode}`);
            }
          }
          
          if (args.theme) {
            const theme = args.theme.toLowerCase();
            if (["cosmic", "cyberpunk", "matrix", "glassmorphic"].includes(theme)) {
              setUiTheme(theme);
              changes.push(`theme to ${theme}`);
            }
          }

          if (args.intensity) {
            const val = parseFloat(args.intensity);
            if (!isNaN(val)) {
              setAnimationIntensity(val);
              changes.push(`animation speed to ${val}x`);
            }
          }

          if (args.powerUsage) {
            const pow = args.powerUsage.toLowerCase();
            if (["normal", "low"].includes(pow)) {
              setPowerUsage(pow);
              changes.push(`power usage to ${pow}`);
            }
          }
          
          if (changes.length > 0) {
            callback({ result: `Successfully synchronized Max AI OS layout: ${changes.join(", ")}.` });
          } else {
            callback({ error: `Unsupported background parameters.` });
          }
        } else if (name.startsWith("desktop") || name.startsWith("phone")) {
          // Map tool to local desktop or phone bridge action
          const actionMap: Record<string, string> = {
            desktopOpenApp: "open_app",
            desktopTypeText: "type_text",
            desktopPressKey: "press_key",
            desktopClick: "click",
            desktopScroll: "scroll",
            desktopScreenshot: "screenshot",
            desktopFileControl: "file_control",
            desktopSystemControl: "system_control",
            desktopWindowManager: "window_control",
            desktopNotepadControl: "notepad_control",
            phoneStatus: "phone_status",
            phoneScreenshot: "phone_screenshot",
            phoneClick: "phone_click",
            phoneTypeText: "phone_type",
            phoneKeyevent: "phone_key",
            phoneOpenApp: "phone_open_app"
          };
          const mappedType = actionMap[name];
          if (!mappedType) {
            callback({ error: `Action ${name} is not mapped.` });
            return;
          }

          console.log(`[App] Dispatching bridge directive: ${mappedType}`, args);
          
          fetch("http://127.0.0.1:3002/api/action", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${desktopBridgeToken}`
            },
            body: JSON.stringify({ type: mappedType, args })
          })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                if (mappedType === "screenshot") {
                  callback({ result: `Screenshot captured successfully. Dimensions: ${data.result.dimensions?.join("x") || "unknown"}.` });
                } else if (mappedType === "phone_screenshot") {
                  if (data.result?.screenshot) {
                    setPhoneScreenshot(`data:image/png;base64,${data.result.screenshot}`);
                    callback({ result: "Live phone screen screenshot captured and displayed in holographic viewer." });
                  } else {
                    callback({ error: "Phone screenshot succeeded but returned empty image stream." });
                  }
                } else if (mappedType === "phone_status") {
                  setPhoneConnected(!!data.result?.connected);
                  setPhoneDevices(data.result?.devices || []);
                  setPhoneAdbAvailable(!!data.result?.adb_available);
                  callback({ result: `Phone Status queried. Connected: ${data.result?.connected}, Devices: ${JSON.stringify(data.result?.devices)}` });
                } else {
                  callback({ result: data.result || `Successfully executed ${name}.` });
                }
              } else {
                callback({ error: data.error || `Bridge failed to execute ${name}.` });
              }
            } else {
              callback({ error: `Desktop/Phone bridge returned status ${res.status}. Make sure python local-desktop-bridge.py is active.` });
            }
          })
          .catch((err) => {
            console.error("[Bridge fetch error]:", err);
            callback({ error: `Could not connect to Desktop/Phone Bridge at http://127.0.0.1:3002. Ensure the Python agent is running. (Message: ${err.message})` });
          });
        } else {
          callback({ error: `Tool ${name} is not implemented.` });
        }
      },
      onError: (err) => {
        setErrorText(err);
      },
      onMemorySync: (updatedMemories) => {
        console.log("[App] WebSocket memories sync triggered:", updatedMemories);
        if (Array.isArray(updatedMemories)) {
          setMemories(updatedMemories);
        }
      },
      onUpdateSync: (updatedUpdateInfo) => {
        console.log("[App] Update Agent sync triggered:", updatedUpdateInfo);
        setUpdateInfo(updatedUpdateInfo);
        if (updatedUpdateInfo.updateAvailable) {
          setDismissedUpdate(false);
        }
      }
    });

    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, []);

  const handleToggleConnection = async () => {
    setErrorText(null);
    if (!sessionRef.current) return;

    if (state === "disconnected") {
      await sessionRef.current.connect();
    } else {
      sessionRef.current.disconnect();
    }
  };

  // Ambient themes
  const getAmbientStyles = () => {
    if (uiTheme === "matrix") {
      return "from-[#021a08] via-[#010a03] to-[#000000]";
    }
    if (uiTheme === "cyberpunk") {
      return "from-[#1a001a] via-[#050010] to-[#020005]";
    }
    if (uiTheme === "glassmorphic") {
      return "from-slate-900/60 via-slate-950/40 to-slate-950";
    }

    switch (themeColor) {
      case "violet":
        return "from-purple-950/40 via-violet-950/20 to-slate-950";
      case "crimson":
        return "from-red-950/40 via-orange-950/20 to-slate-950";
      case "emerald":
        return "from-emerald-950/40 via-teal-950/20 to-slate-950";
      case "celestial":
        return "from-sky-950/45 via-indigo-950/25 to-slate-950";
      case "gold":
        return "from-amber-950/30 via-yellow-950/15 to-slate-950";
      case "rose":
        return "from-rose-950/40 via-pink-950/20 to-slate-950";
      case "charcoal":
      default:
        return "from-slate-900/50 via-slate-950/30 to-slate-950";
    }
  };

  if (isCompanionView) {
    return (
      <div className="w-screen h-screen bg-transparent relative overflow-hidden flex items-center justify-center">
        <DesktopCompanion
          state={state}
          characterState={characterState}
          activeEmotion={activeEmotion}
          modelCaption={modelCaption}
          isEmbedded={false}
        />
      </div>
    );
  }

  return (
    <div
      id="tehzeeb-operating-desktop"
      className={`relative w-full h-screen overflow-hidden bg-[#020205] text-white ${getAmbientStyles()} theme-transition flex flex-col justify-between p-6 sm:p-10 select-none`}
    >
      {/* Decorative background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-45" />

      {/* FULL VIEWPORT HOLOGRAPHIC BACKGROUND VISUALIZER */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <MyraaCoreVisualizer
          session={sessionRef.current}
          state={state}
          themeColor={themeColor}
          activeEmotion={activeEmotion}
          characterState={characterState}
          uiMode={uiMode}
          uiTheme={uiTheme}
          animationIntensity={animationIntensity}
          powerUsage={powerUsage}
        />
      </div>

      {/* HEADER SECTION */}
      <header className="relative z-30 flex items-center justify-between w-full max-w-5xl mx-auto select-none">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-65 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <img
              src="/assets/icon.png"
              alt="Max AI Premium App Icon"
              className="relative w-8 h-8 rounded-lg border border-cyan-400/40 bg-black object-cover shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono font-extrabold tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-200 uppercase">
              MAX AI
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] font-mono tracking-wider text-slate-400 uppercase">
                CORE SYSTEM NODE v4.0
              </span>
              <span className="text-[7px] font-mono px-1 py-0.2 rounded bg-cyan-950/65 border border-cyan-500/20 text-cyan-300 font-bold uppercase">
                PREMIUM
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                state === "listening" ? "bg-cyan-400 animate-ping" : state === "speaking" ? "bg-purple-500 animate-pulse" : "bg-emerald-500"
              }`} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {updateInfo?.updateAvailable && (
            <button
              onClick={() => {
                setShowConfigHUD(true);
                setActiveHUDTab("updates");
              }}
              className="flex items-center gap-1.5 transition text-[10px] font-mono tracking-wider cursor-pointer py-1 px-2.5 rounded-lg border border-amber-500/35 bg-amber-500/15 text-amber-300 animate-pulse font-bold"
              title="System Software Update Available"
            >
              <Sparkles size={11} className="text-amber-400" />
              <span>UPDATE AVAILABLE</span>
            </button>
          )}

          <button
            onClick={() => setShowConfigHUD(!showConfigHUD)}
            className={`flex items-center gap-1.5 transition text-xs font-mono tracking-widest cursor-pointer py-1 px-2.5 rounded-lg border ${
              showConfigHUD 
                ? "bg-cyan-500/15 border-cyan-400 text-cyan-200" 
                : "opacity-45 hover:opacity-100 text-white border-transparent hover:bg-white/5"
            }`}
            title="System Settings HUD"
          >
            <Settings size={13} className={showConfigHUD ? "animate-spin" : ""} />
            <span>SYSTEM HUD</span>
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 opacity-25 hover:opacity-100 text-white transition text-xs font-mono tracking-widest cursor-pointer"
            title="Sway Themes and Info"
          >
            <Compass size={14} />
            <span className="hidden sm:inline">TOPICS</span>
          </button>
          
          <button 
            onClick={() => setShowMemoryDashboard(!showMemoryDashboard)}
            className="flex items-center gap-1 opacity-25 hover:opacity-100 text-white transition text-xs font-mono tracking-widest cursor-pointer"
            title="Recollections Database"
          >
            <Brain size={14} />
            <span className="hidden sm:inline">MEMORIES</span>
          </button>

          <button 
            onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
            className={`flex items-center gap-1.5 transition text-xs font-mono tracking-widest cursor-pointer ${
              isScreenSharing 
                ? "text-cyan-400 opacity-100 font-semibold" 
                : "opacity-25 hover:opacity-100 text-white"
            }`}
            title="Share Screen with Max AI"
          >
            <Monitor size={14} className={isScreenSharing && !isScreenSharingPaused ? "animate-pulse text-cyan-400" : ""} />
            <span>{isScreenSharing ? "SHARING" : "SHARE SCREEN"}</span>
          </button>
        </div>
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between py-6 gap-6">
        
        {/* LEFT HUD DRAWER (SYSTEM TELEMETRY & API CONFIG) */}
        <AnimatePresence>
          {showConfigHUD && (
            <motion.div
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.95 }}
              className="w-full md:w-80 shrink-0 border border-white/10 bg-slate-950/80 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl z-40 text-left flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Tabs */}
              <div className="flex border-b border-white/5 pb-2 justify-between gap-1 overflow-x-auto scrollbar-none">
                {(["system", "agents", "api_keys", "updates", "phone"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveHUDTab(tab as any)}
                    className={`text-[10px] font-mono tracking-wider uppercase font-bold cursor-pointer pb-1 transition-colors flex items-center gap-0.5 ${
                      activeHUDTab === tab ? "text-cyan-400 border-b border-cyan-400" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{tab.replace("_", " ")}</span>
                    {tab === "updates" && updateInfo?.updateAvailable && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {/* TAB 1: SYSTEM CONTROLLER */}
              {activeHUDTab === "system" && (
                <div className="flex flex-col gap-4">
                  {/* UI Mode Selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1 uppercase">
                      <Sliders size={10} className="text-cyan-400" /> UI Projection Mode
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "2d", label: "2D Waveform" },
                        { id: "3d", label: "3D Sphere" },
                        { id: "floating_core", label: "Orbital Core" },
                        { id: "glassmorphism", label: "Glass Frame" },
                        { id: "dashboard", label: "Dashboard" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setUiMode(item.id as UIMode)}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-mono text-left truncate border transition cursor-pointer ${
                            uiMode === item.id 
                              ? "bg-cyan-500/10 border-cyan-400 text-cyan-200 font-bold" 
                              : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UI Theme Selector */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1 uppercase">
                      <Sparkles size={10} className="text-cyan-400" /> Core Environment Theme
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "cosmic", label: "Cosmic Deep" },
                        { id: "cyberpunk", label: "Cyber Neon" },
                        { id: "matrix", label: "Matrix Rain" },
                        { id: "glassmorphic", label: "Frosted Glass" }
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setUiTheme(theme.id as UITheme)}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-mono text-left truncate border transition cursor-pointer ${
                            uiTheme === theme.id 
                              ? "bg-cyan-500/10 border-cyan-400 text-cyan-200 font-bold" 
                              : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Voice Matrix */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1 uppercase">
                      <Volume2 size={10} className="text-cyan-400 animate-pulse" /> Registered AI Voice Matrix
                    </span>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: "voice_1", name: "Alpha Commander", gender: "MALE", desc: "Ultra-deep, authoritative bass, strategic, fearless leadership", icon: "🎖️" },
                        { id: "voice_2", name: "Dark Guardian", gender: "MALE", desc: "Tactical, intimidating, deep gravel tone, protective", icon: "🛡️" },
                        { id: "voice_3", name: "Elegant Intelligence", gender: "FEMALE", desc: "Warm, elegant, clear tone, combining sweetness with authority", icon: "✨" },
                        { id: "voice_4", name: "Elite AI Companion", gender: "FEMALE", desc: "Sweet, highly expressive, emotionally aware, companionable", icon: "🌸" }
                      ].map((v) => (
                        <button
                          key={v.id}
                          onClick={() => switchVoice(v.id)}
                          className={`w-full p-2 rounded-xl text-left border transition-all duration-300 flex items-start gap-2.5 cursor-pointer ${
                            activeVoiceId === v.id
                              ? "bg-cyan-500/10 border-cyan-400 text-cyan-200"
                              : "bg-slate-900/60 border-white/5 text-slate-400 hover:bg-slate-900/90 hover:border-white/10"
                          }`}
                        >
                          <span className="text-sm mt-0.5 shrink-0">{v.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-mono font-bold leading-none ${activeVoiceId === v.id ? "text-cyan-300" : "text-slate-300"}`}>{v.name}</span>
                              <span className={`text-[7px] font-bold tracking-wider px-1 py-0.5 rounded leading-none ${v.gender === "MALE" ? "bg-cyan-500/10 text-cyan-400" : "bg-purple-500/10 text-purple-400"}`}>{v.gender}</span>
                            </div>
                            <p className="text-[8px] font-mono leading-tight mt-1 text-slate-400">{v.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation Intensity / Speed */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1 uppercase">
                      <Activity size={10} className="text-cyan-400" /> Animation Speed: {animationIntensity}x
                    </span>
                    <div className="flex gap-2">
                      {[0.5, 1.0, 2.0].map((v) => (
                        <button
                          key={v}
                          onClick={() => setAnimationIntensity(v)}
                          className={`flex-1 py-1 px-1.5 rounded text-[10px] font-mono border transition cursor-pointer text-center ${
                            animationIntensity === v 
                              ? "bg-cyan-500/10 border-cyan-400 text-cyan-300" 
                              : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          {v === 0.5 ? "Slow" : v === 1.0 ? "Normal" : "Extreme"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Power Usage Setting */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-bold text-slate-200">LOW POWER PROTOCOL</span>
                      <span className="text-[8px] font-mono text-slate-400 uppercase">Throttles graphics engine</span>
                    </div>
                    <button
                      onClick={() => setPowerUsage(powerUsage === "normal" ? "low" : "normal")}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                        powerUsage === "low" ? "bg-amber-500" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                          powerUsage === "low" ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Desktop AI Companion Setting */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-bold text-slate-200">DESKTOP AI COMPANION</span>
                      <span className="text-[8px] font-mono text-slate-400 uppercase">Always-on-top transparent widget</span>
                    </div>
                    <button
                      onClick={() => toggleCompanion(!showCompanion)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                        showCompanion ? "bg-cyan-500" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                          showCompanion ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SPECIALIZED AGENTS TELEMETRY */}
              {activeHUDTab === "agents" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 font-bold border-b border-white/5 pb-1">
                    <span>AGENT NAME</span>
                    <span>CPU / RAM STATUS</span>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
                    {(Object.entries(agentTelemetry) as [string, { cpu: number; ram: number; status: "active" | "standby" | "off" }][]).map(([name, metrics]) => (
                      <div key={name} className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${metrics.status === "active" ? "bg-cyan-400 animate-pulse" : "bg-slate-500"}`} />
                          <span className="text-slate-200 truncate max-w-[100px] font-bold">{name}</span>
                        </div>
                        <div className="text-right text-slate-400 font-mono text-[8px] flex items-center gap-1.5">
                          <span>CPU: {metrics.cpu}%</span>
                          <span>RAM: {metrics.ram}MB</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Local Desktop Control Bridge Setup Block */}
                  <div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                        Desktop Control Bridge
                      </span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full uppercase font-bold tracking-widest ${
                        isDesktopConnected 
                          ? "bg-emerald-950/55 border border-emerald-500/25 text-emerald-400" 
                          : "bg-rose-950/55 border border-rose-500/25 text-rose-400"
                      }`}>
                        {isDesktopConnected ? "Connected" : "Offline"}
                      </span>
                    </div>

                    {isDesktopConnected ? (
                      <div className="p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-950/10 flex flex-col gap-1.5 text-[9px] font-mono text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Local Port:</span>
                          <span className="text-emerald-300">3002 (Localhost Only)</span>
                        </div>
                        {desktopResolution && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Screen Size:</span>
                            <span className="text-emerald-300">{desktopResolution}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-1.5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Recent Device Events</span>
                          {desktopBridgeLogs.length > 0 ? (
                            desktopBridgeLogs.slice(-2).map((log: any, index: number) => (
                              <div key={index} className="text-[8px] text-slate-400 font-mono truncate">
                                {log.text}
                              </div>
                            ))
                          ) : (
                            <span className="text-[8px] text-slate-600">Waiting for actions...</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl border border-white/5 bg-slate-900/40 flex flex-col gap-2 text-[9px] font-mono text-slate-400 leading-normal">
                        <span>Grant Max AI secure control over local applications, keyboard typing, and mouse clicks!</span>
                        <div className="flex flex-col gap-1 text-[8px] bg-black/45 p-2 rounded border border-white/5 text-slate-300 select-all font-semibold">
                          <span># Setup and launch the Python Agent:</span>
                          <span className="text-cyan-400 select-all font-bold">python local-desktop-bridge.py</span>
                        </div>
                        <span className="text-[8px] text-slate-500 uppercase">Requires: pip install pyautogui pillow</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: API KEY DECRYPTED STORAGE PORTAL */}
              {activeHUDTab === "api_keys" && (
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-mono text-slate-400 font-bold leading-relaxed block">
                    Secured using client-exclusive AES-grade local XOR database cipher. Keep actual keys completely hidden from external browser nodes.
                  </span>

                  {/* Registered Status Indicators */}
                  <div className="flex flex-col gap-1.5">
                    {(Object.entries(apiKeysStatus) as [string, { configured: boolean; enabled: boolean; masked: string }][]).map(([provider, info]) => (
                      <div 
                        key={provider} 
                        onClick={() => setSelectedProvider(provider)}
                        className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                          selectedProvider === provider 
                            ? "border-cyan-500 bg-cyan-950/15" 
                            : "border-white/5 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <KeyRound size={12} className={info.configured ? "text-cyan-400" : "text-slate-500"} />
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-200">{provider}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-slate-400">{info.configured ? info.masked : "Empty"}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleKeyEnable(provider, info.enabled);
                            }}
                            className={`w-5 h-3 rounded-full p-0.5 transition-colors cursor-pointer ${
                              info.enabled ? "bg-cyan-500" : "bg-white/10"
                            }`}
                          >
                            <div className={`bg-white w-2 h-2 rounded-full transform duration-200 ${info.enabled ? "translate-x-2" : ""}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Configuration Input Panel */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2.5 mt-1">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                      Edit {selectedProvider} Key
                    </span>
                    <input
                      type="password"
                      value={inputKeyValue}
                      onChange={(e) => setInputKeyValue(e.target.value)}
                      placeholder="Paste private key credential..."
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />

                    {/* Enable Toggle on save */}
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Enable Provider Immediately</span>
                      <input
                        type="checkbox"
                        checked={isKeyEnabled}
                        onChange={(e) => setIsKeyEnabled(e.target.checked)}
                        className="rounded border-white/10 text-cyan-500 bg-slate-900 focus:ring-0"
                      />
                    </div>

                    {/* Validation logs */}
                    {validationState === "testing" && (
                      <span className="text-[9px] font-mono text-amber-400 animate-pulse">Running diagnostic check on API endpoint...</span>
                    )}
                    {validationState === "valid" && (
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Endpoint verified successfully!
                      </span>
                    )}
                    {validationState === "error" && (
                      <span className="text-[9px] font-mono text-rose-400 leading-normal block">
                        Error: {validationError}
                      </span>
                    )}

                    {/* Action Strip */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleValidateAPIKey}
                        disabled={validationState === "testing"}
                        className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-mono rounded-lg transition text-slate-200 cursor-pointer text-center font-bold"
                      >
                        TEST LINK
                      </button>
                      <button
                        onClick={handleSaveAPIKey}
                        disabled={isSavingKey}
                        className="flex-1 py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-[10px] font-mono rounded-lg transition text-white cursor-pointer text-center font-bold"
                      >
                        SAVE KEY
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEM SOFTWARE AUTO-UPDATER */}
              {activeHUDTab === "updates" && (
                <div className="flex flex-col gap-3.5 select-none">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold border-b border-white/5 pb-1">
                    <span>GITHUB SYSTEM UPDATER</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/25 text-cyan-400">
                      SECURE CREDENTIAL MANAGER
                    </span>
                  </div>

                  {/* Unified GitHub Configuration Panel */}
                  <div className="flex flex-col gap-3 p-3.5 rounded-2xl border border-white/5 bg-slate-950/45 text-[10px] font-mono leading-normal">
                    
                    {/* Information strip about secure environment credentials */}
                    <div className="p-2.5 rounded-lg border border-cyan-500/10 bg-cyan-950/10 text-[9px] text-slate-300 leading-normal">
                      <p className="font-bold uppercase tracking-wider text-cyan-400 mb-0.5">Secure Environment Mode</p>
                      <span>Update parameters connected to repository <strong className="text-white">mukimudeen76/Max-AI</strong> via secure credentials. Settings auto-save on toggle.</span>
                    </div>

                    {/* Automatic Update Options */}
                    <div className="grid grid-cols-2 gap-3 pt-1 text-[9px]">
                      {/* Check on Startup Toggle */}
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-slate-400">Scan on Startup</span>
                        <button
                          onClick={async () => {
                            const nextVal = !checkOnStartup;
                            setCheckOnStartup(nextVal);
                            try {
                              await fetch("/api/update/config", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  owner: gitOwner,
                                  repo: gitRepo,
                                  token: gitToken,
                                  automaticUpdates,
                                  checkOnStartup: nextVal,
                                  updateChannel
                                })
                              });
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                            checkOnStartup ? "bg-cyan-500" : "bg-white/10"
                          }`}
                        >
                          <div className={`bg-white w-3 h-3 rounded-full transform duration-200 ${checkOnStartup ? "translate-x-3" : ""}`} />
                        </button>
                      </div>

                      {/* Enable Automatic Updates Toggle */}
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-slate-400">Periodic Checks</span>
                        <button
                          onClick={async () => {
                            const nextVal = !automaticUpdates;
                            setAutomaticUpdates(nextVal);
                            try {
                              await fetch("/api/update/config", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  owner: gitOwner,
                                  repo: gitRepo,
                                  token: gitToken,
                                  automaticUpdates: nextVal,
                                  checkOnStartup,
                                  updateChannel
                                })
                              });
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                            automaticUpdates ? "bg-cyan-500" : "bg-white/10"
                          }`}
                        >
                          <div className={`bg-white w-3 h-3 rounded-full transform duration-200 ${automaticUpdates ? "translate-x-3" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Channel Selector */}
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 text-[9px]">
                      <span className="text-slate-400">Software Update Channel</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={async () => {
                            setUpdateChannel("stable");
                            try {
                              await fetch("/api/update/config", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  owner: gitOwner,
                                  repo: gitRepo,
                                  token: gitToken,
                                  automaticUpdates,
                                  checkOnStartup,
                                  updateChannel: "stable"
                                })
                              });
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase transition ${
                            updateChannel === "stable" 
                              ? "bg-cyan-500/15 border border-cyan-500 text-cyan-300" 
                              : "bg-transparent border border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          Stable
                        </button>
                        <button
                          onClick={async () => {
                            setUpdateChannel("beta");
                            try {
                              await fetch("/api/update/config", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  owner: gitOwner,
                                  repo: gitRepo,
                                  token: gitToken,
                                  automaticUpdates,
                                  checkOnStartup,
                                  updateChannel: "beta"
                                })
                              });
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase transition ${
                            updateChannel === "beta" 
                              ? "bg-cyan-500/15 border border-cyan-500 text-cyan-300" 
                              : "bg-transparent border border-white/10 text-slate-400 hover:text-white"
                          }`}
                        >
                          Beta / Pre-release
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Update Status Panel */}
                    <div className="flex flex-col gap-2 p-3 rounded-2xl border border-white/5 bg-slate-950/45 text-[10px] font-mono leading-normal text-slate-300">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1">
                        SYSTEM STATUS SUITE
                      </span>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Current App Version:</span>
                        <span className="text-cyan-400 font-bold">v{updateInfo?.currentVersion || "1.0.0"}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Latest Release Tag:</span>
                        <span className="text-emerald-400 font-bold">{updateInfo?.latestVersion || "v1.0.0"}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Installer Package Size:</span>
                        <span className="text-amber-400 font-bold">{updateInfo?.installerSize || calculateInstallerSize(updateInfo?.latestVersion || "1.0.4")}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500">Last Successful Check:</span>
                        <span className="text-slate-400 font-semibold">{lastChecked}</span>
                      </div>
                    </div>

                  {/* Manual Check & Download Panel */}
                  {updateInfo?.updateAvailable ? (
                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] text-amber-400 font-bold font-mono uppercase tracking-wide flex items-center gap-1 animate-pulse">
                        ⚠️ New system core software update available!
                      </span>
                      
                      {/* Release notes block */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Changelog Releases</span>
                        <div className="max-h-36 overflow-y-auto p-2 bg-black/35 rounded border border-white/5 text-[9px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                          {updateInfo.releaseNotes}
                        </div>
                      </div>

                      {/* Download Status Action */}
                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-white/5">
                        {downloadStatus === "idle" && (
                          <button
                            onClick={triggerDownload}
                            className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase font-mono tracking-widest rounded-xl transition shadow-[0_0_15px_rgba(8,145,178,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Download size={12} />
                            Download Update
                          </button>
                        )}

                        {downloadStatus === "downloading" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase font-bold">
                              <span>Downloading file...</span>
                              <span>{downloadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                style={{ width: `${downloadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {downloadStatus === "completed" && (
                          <button
                            onClick={applyUpdateAndRestart}
                            className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase font-mono tracking-widest rounded-xl transition shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles size={12} fill="currentColor" />
                            Apply & Restart
                          </button>
                        )}

                        {downloadStatus === "failed" && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[8px] text-rose-400 font-mono leading-normal truncate">{downloadError}</span>
                            <button
                              onClick={triggerDownload}
                              className="w-full py-1.5 px-3 bg-rose-950 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-bold text-[10px] uppercase font-mono tracking-wider rounded-lg transition cursor-pointer"
                            >
                              Retry Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 pt-2">
                      <button
                        onClick={() => checkForUpdates(false)}
                        disabled={isCheckingUpdate}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-[9px] font-mono border border-white/5 rounded-xl transition text-slate-200 cursor-pointer font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={11} className={isCheckingUpdate ? "animate-spin" : ""} />
                        {isCheckingUpdate ? "CHECKING RELEASES..." : "CHECK FOR UPDATES NOW"}
                      </button>

                      <div className="flex flex-col gap-1 items-center justify-center text-center p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                        <CheckCircle2 size={16} className="text-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-wide">
                          Core is fully up to date
                        </span>
                        <span className="text-[7.5px] text-slate-400 font-mono uppercase">
                          Running latest release node package
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: HOLOGRAPHIC PHONE LINK (RE-ENABLED) */}
              {activeHUDTab === "phone" && (
                <div className="flex flex-col gap-3 text-slate-200">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold border-b border-white/5 pb-1">
                    <span>HOLOGRAPHIC PHONE LINK</span>
                    <button
                      onClick={() => setShowAndroidPairingModal(true)}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Smartphone size={9} />
                      QR Link Setup
                    </button>
                  </div>

                  {/* Connection Card */}
                  {phoneConnected ? (
                    <div className="flex flex-col gap-2 p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-[10px] font-mono leading-normal">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[9px] tracking-wide">
                          <CheckCircle2 size={12} className="animate-pulse" />
                          Device Linked (QR)
                        </div>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      </div>
                      <div className="text-slate-300 text-[9px]">
                        Model: <span className="text-white font-semibold">{phoneDevices[0]?.model || "Android"}</span>
                      </div>
                      <div className="text-slate-400 text-[8px] truncate">
                        ID: {phoneDevices[0]?.id || "USB-ADB-001"}
                      </div>
                      <button
                        onClick={() => setShowAndroidPairingModal(true)}
                        className="w-full mt-1 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400 rounded text-[8px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Manage Secure Stream
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 p-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 text-[10px] font-mono leading-normal text-slate-300">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[9px] tracking-wide">
                        <AlertCircle size={12} />
                        No Connection Found
                      </div>
                      
                      {/* Premium QR Connect Call-to-action */}
                      <button
                        onClick={() => setShowAndroidPairingModal(true)}
                        className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded text-[9px] font-bold uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-cyan-500/10"
                      >
                        <QrCode size={11} />
                        Connect Android (QR Link)
                      </button>

                      <p className="text-slate-400 text-[8px] leading-relaxed border-t border-white/5 pt-1.5">
                        Alternative standard ADB link:
                        <br />1. Enable <span className="text-slate-200 font-bold">USB Debugging</span> in Developer Options.
                        <br />2. Plug your phone into PC via USB.
                      </p>
                      <button
                        onClick={() => sendPhoneAction("phone_status")}
                        className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Scan Local ADB Status
                      </button>
                    </div>
                  )}

                  {/* Screencast/Mirror Panel */}
                  <div className="flex flex-col gap-2 p-2.5 rounded-xl border border-white/5 bg-white/5 font-mono">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1">
                      Holographic Mirror Screen
                    </span>

                    <div className="flex flex-col items-center gap-2">
                      {phoneScreenshot ? (
                        <div className="relative flex flex-col items-center">
                          {/* Simulated Device Frame */}
                          <div className="relative p-1.5 rounded-2xl bg-[#090d16] border border-white/10 shadow-2xl shadow-cyan-500/5 overflow-hidden">
                            <img
                              src={phoneScreenshot}
                              alt="Phone Screen Mirror"
                              className="w-48 max-w-full rounded-xl cursor-crosshair border border-white/5 select-none hover:opacity-95 transition"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const clickY = e.clientY - rect.top;
                                const actualX = Math.round((clickX / rect.width) * phoneResX);
                                const actualY = Math.round((clickY / rect.height) * phoneResY);
                                sendPhoneAction("phone_click", { x: actualX, y: actualY });
                              }}
                            />
                            {isPhoneScreenshotLoading && (
                              <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center rounded-xl animate-pulse">
                                <RefreshCw size={20} className="text-cyan-400 animate-spin" />
                              </div>
                            )}
                          </div>
                          <span className="text-[7px] text-slate-500 mt-1 uppercase">
                            Click screen to tap physically
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-lg bg-black/45 border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-4">
                          <Smartphone size={20} className="text-slate-600 mb-1 animate-pulse" />
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider">
                            No Holographic Mirror
                          </span>
                        </div>
                      )}

                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => sendPhoneAction("phone_screenshot")}
                          disabled={isPhoneScreenshotLoading}
                          className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-[9px] font-bold uppercase tracking-wider rounded text-white flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <RefreshCw size={10} className={isPhoneScreenshotLoading ? "animate-spin" : ""} />
                          {phoneScreenshot ? "Update Screen" : "Start Mirror"}
                        </button>
                        {phoneScreenshot && (
                          <button
                            onClick={() => setPhoneScreenshot(null)}
                            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer transition"
                          >
                            Hide
                          </button>
                        )}
                      </div>

                      {/* Display Settings / Scale */}
                      {phoneScreenshot && (
                        <div className="grid grid-cols-2 gap-2 w-full pt-1">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[7px] text-slate-500 uppercase font-bold">Res Width (X)</label>
                            <input
                              type="number"
                              value={phoneResX}
                              onChange={(e) => setPhoneResX(Number(e.target.value))}
                              className="w-full bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-slate-300 text-[8px] outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[7px] text-slate-500 uppercase font-bold">Res Height (Y)</label>
                            <input
                              type="number"
                              value={phoneResY}
                              onChange={(e) => setPhoneResY(Number(e.target.value))}
                              className="w-full bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-slate-300 text-[8px] outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Physical Keys controls */}
                  <div className="flex flex-col gap-1.5 p-2 rounded-xl border border-white/5 bg-white/5 text-[9px] font-mono">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1">
                      Physical Keys Simulator
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => sendPhoneAction("phone_key", { key_code: 3 })}
                        className="py-1 bg-slate-800 hover:bg-slate-700 hover:text-white transition rounded cursor-pointer uppercase text-[8px]"
                      >
                        HOME
                      </button>
                      <button
                        onClick={() => sendPhoneAction("phone_key", { key_code: 4 })}
                        className="py-1 bg-slate-800 hover:bg-slate-700 hover:text-white transition rounded cursor-pointer uppercase text-[8px]"
                      >
                        BACK
                      </button>
                      <button
                        onClick={() => sendPhoneAction("phone_key", { key_code: 187 })}
                        className="py-1 bg-slate-800 hover:bg-slate-700 hover:text-white transition rounded cursor-pointer uppercase text-[8px]"
                      >
                        RECENTS
                      </button>
                      <button
                        onClick={() => sendPhoneAction("phone_key", { key_code: 26 })}
                        className="py-1 bg-slate-800 hover:bg-slate-700 hover:text-white transition rounded cursor-pointer uppercase text-[8px]"
                      >
                        POWER
                      </button>
                      <button
                        onClick={() => sendPhoneAction("phone_key", { key_code: 24 })}
                        className="py-1 bg-slate-800 hover:bg-slate-700 hover:text-white transition rounded cursor-pointer uppercase text-[8px]"
                      >
                        VOL UP
                      </button>
                      <button
                        onClick={() => sendPhoneAction("phone_key", { key_code: 25 })}
                        className="py-1 bg-slate-800 hover:bg-slate-700 hover:text-white transition rounded cursor-pointer uppercase text-[8px]"
                      >
                        VOL DOWN
                      </button>
                    </div>
                  </div>

                  {/* Text Input Typing */}
                  <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-white/5 bg-white/5 text-[9px] font-mono">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1">
                      Remote Keyboard Stream
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={phoneInputText}
                        onChange={(e) => setPhoneInputText(e.target.value)}
                        placeholder="Type text for device input..."
                        className="flex-1 bg-black/45 border border-white/10 rounded px-2 py-1 text-slate-200 text-[9px] outline-none focus:border-cyan-500 transition"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && phoneInputText) {
                            sendPhoneAction("phone_type", { text: phoneInputText });
                            setPhoneInputText("");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (phoneInputText) {
                            sendPhoneAction("phone_type", { text: phoneInputText });
                            setPhoneInputText("");
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 font-bold uppercase rounded text-slate-200 text-[8px] cursor-pointer"
                      >
                        SEND
                      </button>
                    </div>
                  </div>

                  {/* Quick Launcher Applications */}
                  <div className="flex flex-col gap-2 p-2.5 rounded-xl border border-white/5 bg-white/5 text-[9px] font-mono leading-relaxed">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1 mb-1">
                      Quick Mobile Apps Launcher
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { name: "WhatsApp", package: "com.whatsapp", color: "bg-emerald-700 hover:bg-emerald-600" },
                        { name: "YouTube", package: "com.google.android.youtube", color: "bg-rose-700 hover:bg-rose-600" },
                        { name: "Chrome", package: "com.android.chrome", color: "bg-blue-700 hover:bg-blue-600" },
                        { name: "Instagram", package: "com.instagram.android", color: "bg-purple-700 hover:bg-purple-600" },
                        { name: "Spotify", package: "com.spotify.music", color: "bg-green-700 hover:bg-green-600" },
                        { name: "Google Maps", package: "com.google.android.apps.maps", color: "bg-teal-700 hover:bg-teal-600" }
                      ].map((app) => (
                        <button
                          key={app.name}
                          onClick={() => sendPhoneAction("phone_open_app", { package: app.package })}
                          className={`py-1 px-1.5 rounded transition text-[8px] font-bold uppercase tracking-wider text-white text-center cursor-pointer ${app.color}`}
                        >
                          {app.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-1.5">
                      <label className="text-[7px] text-slate-500 font-bold uppercase">Launch Custom Package</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={phoneCustomPackage}
                          onChange={(e) => setPhoneCustomPackage(e.target.value)}
                          placeholder="e.g. com.android.settings"
                          className="flex-1 bg-black/45 border border-white/10 rounded px-1.5 py-0.5 text-slate-200 text-[8px] outline-none"
                        />
                        <button
                          onClick={() => {
                            if (phoneCustomPackage) {
                              sendPhoneAction("phone_open_app", { package: phoneCustomPackage });
                              setPhoneCustomPackage("");
                            }
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase rounded text-[8px] cursor-pointer"
                        >
                          RUN
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Output Logger Console */}
                  {phoneMessage && (
                    <div className="p-2 bg-black/40 border border-white/5 rounded-lg text-[8px] font-mono leading-relaxed text-slate-300 overflow-x-auto select-all">
                      <span className="text-cyan-400 font-bold">[Holo-Link]:</span> {phoneMessage}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MIDDLE STAGE AREA (AVATAR & DIALOGUE SCREEN) */}
        <div className="flex-1 flex flex-col items-center justify-between w-full h-full min-h-[50vh] relative">
          
          {/* Holographic Projector status banner */}
          <AnimatePresence>
            {activeProjectorUrl && (
              <div className="absolute top-0 z-30 flex justify-center p-2 w-full">
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-2xl border border-cyan-500/25 bg-[#030712]/80 backdrop-blur-xl shadow-lg w-full max-w-md"
                >
                  <div className="flex items-center gap-3 overflow-hidden text-left">
                    <div className="p-2 ml-1 rounded-xl bg-cyan-500/20 text-cyan-300">
                      <Globe size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold font-mono tracking-wide text-cyan-200 uppercase">Holographic Projection Broadcast</h4>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{activeProjectorUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveProjectorUrl(activeProjectorUrl)}
                      className="p-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 transition cursor-pointer"
                      title="View Frame"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setActiveProjectorUrl(null);
                        setBrowserTrigger(null);
                      }}
                      className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="h-10 md:h-16" />

          {/* Subtitles Layer */}
          <div id="cinematic-subtitles" className="w-full max-w-3xl flex flex-col items-center justify-center text-center px-6 relative z-25 mt-auto mb-6 pointer-events-none min-h-[6rem]">
            <AnimatePresence mode="wait">
              {(() => {
                const textType = modelCaption 
                  ? "model" 
                  : userCaption 
                    ? "user" 
                    : "status";

                const activeText = modelCaption 
                  ? modelCaption 
                  : userCaption 
                    ? userCaption 
                    : state === "listening" 
                      ? "Operating System Online. Listening..." 
                      : state === "connecting" 
                        ? "Synchronizing Presence Links..." 
                        : "Awaken Core Matrix to Synchronize Voice Link.";

                return (
                  <motion.div
                    key={textType}
                    initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center w-full"
                  >
                    {textType === "model" && (
                      <h2 className="text-xl sm:text-2xl font-light text-white leading-relaxed tracking-wide font-display max-w-2xl drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)]">
                        {activeText}
                      </h2>
                    )}

                    {textType === "user" && (
                      <p className="text-cyan-300 font-mono text-sm sm:text-base tracking-wider flex items-center justify-center gap-2 drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>&ldquo;{activeText}&rdquo;</span>
                      </p>
                    )}

                    {textType === "status" && (
                      <span className="text-xs sm:text-sm uppercase tracking-[0.3em] font-medium text-white/30 font-sans tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                        {activeText}
                      </span>
                    )}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* SUGGESTIONS COMPASS BOARD */}
          <AnimatePresence>
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="p-5 rounded-2xl border border-white/10 bg-slate-900/85 backdrop-blur-2xl max-w-md text-left w-full absolute z-40 shadow-2xl mt-12"
              >
                <div className="flex items-center justify-between mb-3 text-white">
                  <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide">
                    <Compass size={16} className="text-cyan-400" />
                    <span>JARVIS CONSOLE PHRASES</span>
                  </div>
                  <button 
                    onClick={() => setShowGuide(false)}
                    className="text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Creator Credits Badge */}
                <div className="mb-4 p-2.5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span className="text-slate-400">Creator: <span className="text-white font-bold">mukimudeen76-ops</span></span>
                  <a 
                    href="https://github.com/mukimudeen76-ops/Marya11" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-400 hover:text-cyan-300 transition hover:underline"
                  >
                    GitHub
                  </a>
                </div>

                <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
                  Marya AI OS is capable of real-time voice synchronization and responsive UI changes. Try commanding:
                </p>
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer font-sans text-slate-200">
                    ⚡ &quot;Switch to Matrix theme and increase animation&quot; <span className="text-[9px] font-mono text-cyan-400 block mt-0.5">Launches green code falling rain.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer font-sans text-slate-200">
                    ⚡ &quot;Switch to floating core mode and save battery&quot; <span className="text-[9px] font-mono text-cyan-400 block mt-0.5">Triggers orbital rings and reduces performance overhead.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer font-sans text-slate-200">
                    ⚡ &quot;Search lo-fi music on YouTube and open it&quot; <span className="text-[9px] font-mono text-cyan-400 block mt-0.5">Invokes the browser autopilot agent.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global Errors Banner */}
          <AnimatePresence>
            {errorText && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="mt-6 flex items-start gap-3 p-4 rounded-2xl border border-rose-500/20 bg-rose-950/40 backdrop-blur-xl max-w-md w-full text-left"
              >
                <CircleAlert className="text-rose-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-rose-300 font-mono">Core Error Protocol</h4>
                  <p className="text-xs text-rose-200 mt-1 leading-relaxed">{errorText}</p>
                  <button
                    onClick={() => setErrorText(null)}
                    className="mt-2 text-[10px] font-bold text-rose-400 underline font-mono uppercase cursor-pointer"
                  >
                    Dismiss Code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER & WAVEFORM STRIP */}
      <footer className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-5 mt-auto">
        
        {/* Real-time speech wave display nodes */}
        <div className="flex items-center justify-center gap-1.5 h-8 w-44">
          {[12, 28, 16, 32, 20, 8].map((baseHeight, idx) => {
            let heightFactor = 0.35;
            if (state === "speaking") {
              heightFactor = 0.35 + Math.sin(Date.now() * 0.02 + idx * 0.9) * 0.65;
            } else if (state === "listening") {
              heightFactor = 0.2 + Math.sin(Date.now() * 0.01 + idx * 0.5) * 0.4;
            } else {
              heightFactor = idx % 2 === 0 ? 0.25 : 0.12;
            }
            const calculatedHeight = Math.max(3, baseHeight * heightFactor);

            return (
              <div
                key={idx}
                className={`w-0.5 rounded-full transition-all duration-300 ${
                  state === "speaking" ? "bg-purple-400" : state === "listening" ? "bg-cyan-400" : "bg-white/10"
                }`}
                style={{ height: `${calculatedHeight}px` }}
              />
            );
          })}
        </div>

        {/* Central Power Core Glow Connection Button */}
        <div className="flex items-center justify-center relative mb-4">
          {state !== "disconnected" && (
            <>
              {/* Rotating futuristic cyber rings */}
              <div className="absolute w-[108px] h-[108px] rounded-full border border-dashed border-cyan-500/30 animate-[spin_20s_linear_infinite]" />
              <div className="absolute w-[96px] h-[96px] rounded-full border border-purple-500/35 animate-[spin_10s_linear_infinite_reverse]" />
            </>
          )}
          <button 
            onClick={handleToggleConnection}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer relative z-10 ${
              state === "disconnected"
                ? "bg-white/10 hover:bg-white/15 border border-white/15 text-white shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:scale-105 active:scale-95"
                : state === "listening"
                ? "bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/80 text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,0.3)] animate-pulse scale-105"
                : state === "speaking"
                ? "bg-purple-500/90 hover:bg-purple-600 border border-purple-400/95 text-white shadow-[0_0_35px_rgba(168,85,247,0.4)] scale-105"
                : "bg-amber-600 border border-amber-300 text-white animate-spin"
            }`}
            title={state === "disconnected" ? "Initialize Max AI Link" : "Disconnect Core Matrix"}
          >
            {state === "disconnected" ? (
              <Power className="opacity-80" size={24} />
            ) : state === "connecting" ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : state === "listening" ? (
              <Mic size={24} className="text-cyan-200" />
            ) : (
              <Volume2 size={24} className="text-white" />
            )}
          </button>

          {/* Quick Clear Widget */}
          {(activeProjectorUrl || errorText) && (
            <button 
              onClick={() => {
                if (activeProjectorUrl) setActiveProjectorUrl(null);
                setErrorText(null);
              }}
              className="absolute right-[-60px] p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
              title="Reset Screen Broadcasts"
            >
              <X size={16} />
            </button>
          )}
        </div>

      </footer>

      {/* Holographic Browser agent */}
      <AnimatePresence>
        {activeProjectorUrl && (
          <BrowserAgent
            url={activeProjectorUrl}
            onClose={() => {
              setActiveProjectorUrl(null);
              setBrowserTrigger(null);
            }}
            actionTrigger={browserTrigger}
          />
        )}
      </AnimatePresence>

      {/* Dynamic screen share drawer */}
      <AnimatePresence>
        {isScreenSharing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 50 }}
            className={`absolute bottom-6 md:bottom-10 right-6 md:right-10 z-50 w-72 p-4 rounded-2xl border ${
              isScreenSharingPaused 
                ? "border-amber-500/20 bg-slate-950/70" 
                : "border-cyan-500/20 bg-slate-950/70"
            } backdrop-blur-2xl shadow-2xl overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isScreenSharingPaused ? "bg-amber-400" : "bg-cyan-400 animate-pulse"}`} />
                <span className="text-[10px] font-bold font-mono tracking-widest text-slate-200">
                  {isScreenSharingPaused ? "SCREEN VISION PAUSED" : "SCREEN VISION ACTIVE"}
                </span>
              </div>
              <button 
                onClick={stopScreenSharing}
                className="text-slate-400 hover:text-white transition-colors duration-150 p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                title="Stop Sharing"
              >
                <X size={14} />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-white/5 mb-3 flex items-center justify-center group select-none">
              {isSimulatedScreenSharing ? (
                <canvas
                  ref={(el) => {
                    if (el) {
                      screenCanvasRef.current = el;
                    }
                  }}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isScreenSharingPaused ? "opacity-30 blur-sm" : "opacity-90"
                  }`}
                />
              ) : (
                <video
                  ref={(el) => {
                    if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
                      el.srcObject = screenStreamRef.current;
                      el.muted = true;
                      el.play().catch(err => console.log("Preview video exception:", err));
                    }
                  }}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isScreenSharingPaused ? "opacity-30 blur-sm" : "opacity-90"
                  }`}
                  autoPlay
                  playsInline
                  muted
                />
              )}

              {isScreenSharingPaused && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest font-mono text-amber-400 font-bold px-2 py-1 bg-amber-950/40 border border-amber-500/20 rounded-md">
                    Transmission Paused
                  </span>
                </div>
              )}
              
              {!isScreenSharingPaused && screenVisionMode && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-400/20 text-[9px] font-mono text-cyan-300">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  <span>Streaming FPS: 0.5</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-1.5 mb-2.5">
              {isScreenSharingPaused ? (
                <button
                  onClick={resumeScreenSharing}
                  className="flex-1 py-1.5 px-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-xs font-mono font-medium text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Resume Streaming Feed"
                >
                  <Play size={10} />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseScreenSharing}
                  className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-mono font-medium text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Pause Streaming Feed"
                >
                  <Pause size={10} />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={switchScreenShare}
                className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Choose Another Screen or Window"
              >
                <RefreshCw size={11} />
                <span>Switch</span>
              </button>

              <button
                onClick={stopScreenSharing}
                className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-mono text-rose-400 flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Terminate Stream"
              >
                <Square size={9} />
                <span>Stop</span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-left">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold font-mono text-slate-200">SCREEN VISION MODE</span>
                <span className="text-[8px] text-slate-400 uppercase font-mono max-w-[150px]">Gemini Auto-Analysis</span>
              </div>
              <button
                onClick={() => setScreenVisionMode(!screenVisionMode)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                  screenVisionMode ? "bg-cyan-500" : "bg-white/10"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                    screenVisionMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Dashboard panel */}
      <MemoryDashboard
        isOpen={showMemoryDashboard}
        onClose={() => setShowMemoryDashboard(false)}
        memories={memories}
        onAddMemory={handleAddManualMemory}
        onDeleteMemory={handleDeleteMemory}
        themeColor={themeColor}
      />

      {/* Futuristic AIDashboard layer */}
      <AIDashboard
        isOpen={uiMode === "dashboard"}
        onClose={() => setUiMode("3d")}
        memories={memories}
        onAddMemory={handleAddManualMemory}
        onDeleteMemory={handleDeleteMemory}
        isDesktopConnected={isDesktopConnected}
        desktopResolution={desktopResolution}
        desktopBridgeLogs={desktopBridgeLogs}
        desktopBridgeToken={desktopBridgeToken}
        onUpdateBridgeToken={(token) => {
          setDesktopBridgeToken(token);
          if (token) {
            localStorage.setItem("marya_bridge_token_override", token);
          } else {
            localStorage.removeItem("marya_bridge_token_override");
          }
        }}
        themeColor={themeColor}
        subscriptionTier={subscriptionTier}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
        pairedDevice={pairedDevice}
        onPairMobile={() => setShowAndroidPairingModal(true)}
        phoneConnected={phoneConnected}
        phoneDevices={phoneDevices}
        phoneAdbAvailable={phoneAdbAvailable}
        activeVoiceId={activeVoiceId}
        onSwitchVoice={switchVoice}
        user={user}
        onSignOut={handleSignOut}
        onSignIn={handleSignIn}
        onForceSync={handleForceSync}
        onDeleteCloudData={handleDeleteCloudData}
      />

      {/* Dynamic Screen Share Helper Modal */}
      <AnimatePresence>
        {showScreenShareHelper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl text-left"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg overflow-hidden border border-cyan-500/30 bg-slate-900/95 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col"
            >
              {/* Header with scanlines */}
              <div className="relative p-6 border-b border-white/10 bg-slate-950/50">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-45" />
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                    <Monitor size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold tracking-widest text-cyan-100 uppercase">
                      Screen Share Assistant
                    </h3>
                    <p className="text-[10px] font-mono text-cyan-400/70 tracking-wider">
                      STATUS CODE: IFRAME_SANDBOX_RESTRICTION
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScreenShareHelper(false)}
                  className="absolute top-6 right-6 p-1.5 rounded-lg border border-white/5 hover:border-white/15 bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-5">
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  Web browser security frameworks prevent <span className="text-cyan-400">getDisplayMedia</span> screen-capture inside sandboxed preview frames (iframes) to protect your privacy.
                </p>

                <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-950/15 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Sparkles size={14} />
                    <span className="text-[11px] font-mono font-bold tracking-wider uppercase">Option 1: Holographic Screen Simulator [RELIABLE]</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                    Instantly broadcast a live, dynamic virtual system dashboard containing memory vectors, processor logs, and neural harmonics. Gemini can visually inspect Max AI's state in real-time!
                  </p>
                  <button
                    onClick={startSimulatedScreenSharing}
                    className="mt-2 w-full py-2.5 px-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-xl text-xs font-mono font-bold text-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  >
                    <Zap size={13} />
                    <span>LAUNCH HOLOGRAPHIC OS SIMULATOR</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-700 bg-slate-950/40 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <ExternalLink size={14} />
                    <span className="text-[11px] font-mono font-bold tracking-wider uppercase">Option 2: Standalone Full Page</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                    Open Max AI OS in a separate standalone browser tab. This bypasses all frame restrictions and activates standard, hardware-accelerated screen sharing natively.
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                    <span>💡 Tip: Click the "Open in new tab" icon at the top right of your preview window.</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 bg-slate-950/30 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowScreenShareHelper(false)}
                  className="py-1.5 px-4 rounded-xl border border-white/10 text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SubscriptionGuard
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onUnlock={handleUnlock}
        themeColor={themeColor}
      />

      <AndroidPairingModal
        isOpen={showAndroidPairingModal}
        onClose={() => setShowAndroidPairingModal(false)}
        onDevicePaired={handleDevicePaired}
        onDeviceDisconnected={handleDeviceDisconnected}
        pairedDevice={pairedDevice}
        desktopBridgeToken={desktopBridgeToken}
      />

      {/* Secure Google Account Sign-In / Onboarding */}
      {onboardingChoice === null && (
        <GoogleOnboarding
          onSignedIn={() => {
            localStorage.setItem("onboarding_choice", "google");
            setOnboardingChoice("google");
          }}
          onContinueOffline={() => {
            localStorage.setItem("onboarding_choice", "offline");
            setOnboardingChoice("offline");
          }}
        />
      )}

      {/* Secure First-Time Setup Wizard overlay */}
      <SetupWizard
        isOpen={onboardingChoice !== null && !isSetupComplete}
        onComplete={() => setIsSetupComplete(true)}
      />

      {/* Floating Desktop Companion widget */}
      {showCompanion && !isCompanionView && (
        <DesktopCompanion
          state={state}
          characterState={characterState}
          activeEmotion={activeEmotion}
          modelCaption={modelCaption}
          isEmbedded={true}
          onClose={() => toggleCompanion(false)}
        />
      )}

      {/* In-App Central Update Alert Dialog */}
      <AnimatePresence>
        {updateInfo?.updateAvailable && !dismissedUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-3xl border border-emerald-500/20 bg-slate-900/90 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-emerald-500/10 p-6 font-mono flex flex-col gap-5 relative text-slate-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                    <Zap size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white tracking-widest uppercase">System Core Update Detected</h3>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono animate-bounce">
                        NEW RELEASE
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 uppercase mt-0.5">A new binary compilation is ready for immediate deployment</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDismissedUpdate(true)}
                  className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Dismiss Upgrade Notification"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Version Comparison Card */}
              <div className="grid grid-cols-3 items-center justify-center p-3.5 bg-slate-950/60 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Current Node</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 font-bold border border-white/5 text-[10px]">
                    v{updateInfo.currentVersion}
                  </span>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="h-0.5 w-12 bg-gradient-to-r from-slate-800 via-emerald-500/40 to-slate-800 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <span className="text-[7.5px] text-emerald-400 uppercase font-bold mt-1.5 tracking-widest animate-pulse">Upgrade Path</span>
                </div>

                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Latest Release</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/30 text-emerald-400 font-black border border-emerald-500/30 text-[10px] shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse">
                    v{updateInfo.latestVersion}
                  </span>
                </div>
              </div>

              {/* Installer Size Banner */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/40 rounded-2xl border border-white/5 text-[9px] font-mono">
                <span className="text-slate-400 uppercase font-bold">Installer Package Payload Size</span>
                <div className="flex items-center gap-1.5 text-amber-400 font-extrabold animate-pulse">
                  <Download size={10} />
                  <span>{updateInfo.installerSize || calculateInstallerSize(updateInfo.latestVersion)}</span>
                </div>
              </div>

              {/* Release Notes */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-wider">Release Log Highlights</span>
                <div className="max-h-28 overflow-y-auto p-3 rounded-xl bg-slate-950/40 border border-white/5 text-[9px] text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                  {updateInfo.releaseNotes ? (
                    <p className="whitespace-pre-wrap">{updateInfo.releaseNotes}</p>
                  ) : (
                    <span className="italic text-slate-500">No release log summary provided. Critical structural improvements and binary compilation optimization packages included.</span>
                  )}
                </div>
                {updateInfo.publishedAt && (
                  <span className="text-[7px] text-slate-500 uppercase self-end">
                    Compiled On: {new Date(updateInfo.publishedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Action and Progress Controls */}
              <div className="mt-1 pt-3.5 border-t border-white/5 flex flex-col gap-2.5">
                {downloadStatus === "downloading" && (
                  <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-xl border border-cyan-500/15">
                    <div className="flex justify-between items-center text-[8.5px]">
                      <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin text-cyan-400" />
                        Downloading Compilation Binaries...
                      </span>
                      <span className="text-white font-bold">{downloadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${downloadProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      />
                    </div>
                    <span className="text-[7px] text-slate-500 uppercase text-center">DO NOT CLOSE APP WHILE INTEGRATION PROCESS IS RUNNING</span>
                  </div>
                )}

                {downloadStatus === "completed" && (
                  <button
                    onClick={applyUpdateAndRestart}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={13} className="text-white animate-spin" />
                    Apply & Cold Restart Core
                  </button>
                )}

                {downloadStatus === "failed" && (
                  <div className="flex flex-col gap-2 p-3 bg-red-950/20 rounded-xl border border-red-500/20 text-center">
                    <span className="text-[8.5px] text-red-400 font-bold uppercase">Installation Protocol Failed</span>
                    <p className="text-[8px] text-slate-400 leading-relaxed truncate">{downloadError}</p>
                    <button
                      onClick={triggerDownload}
                      className="w-full py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-300 font-bold text-[9px] uppercase tracking-wider rounded-lg transition cursor-pointer"
                    >
                      Retry System Download
                    </button>
                  </div>
                )}

                {downloadStatus === "idle" && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={triggerDownload}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={12} className="animate-bounce" />
                      Proactively Apply Upgrade
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setDismissedUpdate(true);
                          setShowConfigHUD(true);
                          setActiveHUDTab("updates");
                        }}
                        className="py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold uppercase rounded-xl transition border border-white/5 text-[9px] text-center cursor-pointer"
                      >
                        Configuration HUD
                      </button>
                      <button
                        onClick={() => setDismissedUpdate(true)}
                        className="py-2 bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-300 font-bold uppercase rounded-xl transition border border-white/5 text-[9px] text-center cursor-pointer"
                      >
                        Remind Me Later
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
