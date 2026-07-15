import React, { useState, useEffect, useRef } from "react";
import { 
  Smartphone, 
  QrCode, 
  Check, 
  Shield, 
  Activity, 
  Wifi, 
  Terminal, 
  Send, 
  X, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Lock, 
  Unlock,
  Tv,
  Keyboard,
  MousePointer,
  Volume2,
  FolderOpen,
  Clipboard,
  Bell,
  Camera,
  Video,
  Scissors,
  Share2,
  Eye,
  Settings,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Type,
  FileText,
  MousePointerClick,
  FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";

interface AndroidPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevicePaired: (deviceInfo: { id: string; model: string; key: string; session: string }) => void;
  onDeviceDisconnected: () => void;
  pairedDevice: { id: string; model: string; key: string; session: string } | null;
  desktopBridgeToken?: string;
}

type TabType = "mirror" | "files" | "editor" | "automation" | "security" | "handshake" | "usb";

export function AndroidPairingModal({
  isOpen,
  onClose,
  onDevicePaired,
  onDeviceDisconnected,
  pairedDevice,
  desktopBridgeToken = ""
}: AndroidPairingModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("handshake");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [pairingStep, setPairingStep] = useState<"qr" | "exchanging" | "connected">("qr");
  const [pairingPayload, setPairingPayload] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [inputCommand, setInputCommand] = useState<string>("");
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);

  // Live Screen Mirror states
  const [activeScreen, setActiveScreen] = useState<"launcher" | "social" | "camera" | "editor" | "settings">("launcher");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [recordingActive, setRecordingActive] = useState<boolean>(false);
  
  // Video Editor states
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);
  const [videoTransition, setVideoTransition] = useState<string>("glitch");
  const [captionText, setCaptionText] = useState<string>("#SecurityAI Cyber Automation Link Active");
  const [editingSubtitles, setEditingSubtitles] = useState<boolean>(true);
  
  // Clipboard states
  const [pcClipboard, setPcClipboard] = useState<string>("https://ais-dev-maxaii.secured.link/auth-token");
  const [phoneClipboard, setPhoneClipboard] = useState<string>("Initial Android Clip Node");
  
  // Files simulator
  const [androidFiles, setAndroidFiles] = useState<Array<{ name: string; size: string; path: string; date: string }>>([
    { name: "DCIM_0092.mp4", size: "48.2 MB", path: "/storage/emulated/0/DCIM/Camera", date: "Today 12:44" },
    { name: "Render_Project_1.mp4", size: "124.8 MB", path: "/storage/emulated/0/Movies", date: "Today 10:15" },
    { name: "Screenshot_2026_Auth.png", size: "1.2 MB", path: "/storage/emulated/0/Pictures/Screenshots", date: "Yesterday" },
    { name: "Keys_ECDH.json", size: "2.4 KB", path: "/storage/emulated/0/Download", date: "2 days ago" }
  ]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Confirmation state modal for sensitive operations
  const [sensitiveAction, setSensitiveAction] = useState<{
    type: "delete" | "upload" | "send" | "publish" | "camera_access";
    title: string;
    description: string;
    payload: any;
  } | null>(null);

  // Multi-step Automation states
  const [automationStatus, setAutomationStatus] = useState<"idle" | "scanning" | "clicking" | "completed">("idle");
  const [detectedUIElements, setDetectedUIElements] = useState<Array<{ id: string; name: string; bounds: string; confidence: number }>>([]);
  const [automationLog, setAutomationLog] = useState<string[]>([]);

  // System Notifications
  const [phoneNotifications, setPhoneNotifications] = useState<Array<{ id: string; app: string; title: string; desc: string; time: string }>>([
    { id: "1", app: "Instagram", title: "New Follower Request", desc: "someone_security requested to follow you", time: "Just now" },
    { id: "2", app: "System OS", title: "Accessibility Permission Alert", desc: "Nova Companion granted deep device control overlay", time: "5m ago" },
    { id: "3", app: "Secure Node", title: "Key Exchange Refresh", desc: "Diffie-Hellman entropy updated successfully", time: "12m ago" }
  ]);

  // USB ADB Companion Installation States
  const [usbConnectedDevices, setUsbConnectedDevices] = useState<Array<{ id: string; state: string; model: string }>>([]);
  const [isCheckingUsb, setIsCheckingUsb] = useState<boolean>(false);
  const [usbErrorMessage, setUsbErrorMessage] = useState<string>("");
  const [usbInstallStatus, setUsbInstallStatus] = useState<"idle" | "installing" | "success" | "error">("idle");
  const [usbInstallMessage, setUsbInstallMessage] = useState<string>("");
  const [phoneAdbAvailable, setPhoneAdbAvailable] = useState<boolean>(false);
  const [companionApiKey, setCompanionApiKey] = useState<string>(() => {
    return localStorage.getItem("max_companion_api_key") || "MAX_AI-KEY-" + Math.floor(100000 + Math.random() * 900000);
  });

  const checkUsbStatus = async () => {
    setIsCheckingUsb(true);
    setUsbErrorMessage("");
    try {
      const res = await fetch("http://127.0.0.1:3002/api/action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${desktopBridgeToken}`
        },
        body: JSON.stringify({ type: "phone_status" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsbConnectedDevices(data.result?.devices || []);
          setPhoneAdbAvailable(!!data.result?.adb_available);
          addLog(`USB status check complete: Found ${data.result?.devices?.length || 0} ADB device(s).`);
        } else {
          setUsbErrorMessage(data.error || "Bridge query failed.");
        }
      } else {
        setUsbErrorMessage("Desktop Bridge offline on port 3002. Ensure it is running.");
      }
    } catch (err: any) {
      setUsbErrorMessage(`Failed to connect to Local Bridge: ${err.message}`);
    } finally {
      setIsCheckingUsb(false);
    }
  };

  const installCompanionApp = async () => {
    setUsbInstallStatus("installing");
    setUsbInstallMessage("Starting companion APK installation over ADB pipeline...");
    addLog("Initiated Android companion installation request via ADB.");
    try {
      const res = await fetch("http://127.0.0.1:3002/api/action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${desktopBridgeToken}`
        },
        body: JSON.stringify({ type: "phone_install_companion" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsbInstallStatus("success");
          setUsbInstallMessage(data.result || "Companion APK successfully installed!");
          addLog("Companion APK installation completed successfully!");
          checkUsbStatus();
        } else {
          setUsbInstallStatus("error");
          setUsbInstallMessage(data.error || "ADB installation failed.");
          addLog(`Companion APK installation error: ${data.error}`);
        }
      } else {
        const errText = await res.text();
        setUsbInstallStatus("error");
        setUsbInstallMessage(errText || "Bridge returned error code.");
      }
    } catch (err: any) {
      setUsbInstallStatus("error");
      setUsbInstallMessage(`Network transport failure: ${err.message}`);
    }
  };

  // Wireless ADB pairing states
  const [wirelessAdbStep, setWirelessAdbStep] = useState<"idle" | "tcpip" | "ip_found" | "connected" | "error">("idle");
  const [wirelessIp, setWirelessIp] = useState<string>("");
  const [isSettingWireless, setIsSettingWireless] = useState<boolean>(false);
  const [wirelessMessage, setWirelessMessage] = useState<string>("");

  const setupWirelessAdb = async () => {
    setIsSettingWireless(true);
    setWirelessAdbStep("tcpip");
    setWirelessMessage("Enabling Wireless TCP/IP protocol on physical phone (port 5555)...");
    addLog("Wireless ADB: Triggering TCPIP 5555 setup...");
    try {
      const res = await fetch("http://127.0.0.1:3002/api/action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${desktopBridgeToken}`
        },
        body: JSON.stringify({ type: "phone_wireless_setup" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWirelessMessage("Wireless protocol enabled successfully! Scanning device IP address on wlan0...");
        addLog("Wireless ADB: TCP/IP enabled successfully.");
        
        // Fetch IP address
        const ipRes = await fetch("http://127.0.0.1:3002/api/action", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${desktopBridgeToken}`
          },
          body: JSON.stringify({ type: "phone_wireless_ip" })
        });
        const ipData = await ipRes.json();
        if (ipRes.ok && ipData.success && ipData.result?.ip) {
          const detectedIp = ipData.result.ip;
          setWirelessIp(detectedIp);
          setWirelessAdbStep("ip_found");
          setWirelessMessage(`Phone IP Address detected: ${detectedIp}. Ready to establish wireless pairing connection.`);
          addLog(`Wireless ADB: Detected phone IP: ${detectedIp}`);
        } else {
          setWirelessAdbStep("error");
          setWirelessMessage(ipData.error || "Could not automatically resolve WLAN IP. Please connect phone to Wi-Fi and input IP manually.");
          addLog("Wireless ADB: IP resolution failed.");
        }
      } else {
        setWirelessAdbStep("error");
        setWirelessMessage(data.error || "Failed to set TCP/IP port. Ensure phone is connected via USB first.");
        addLog(`Wireless ADB: TCP/IP failed: ${data.error}`);
      }
    } catch (err: any) {
      setWirelessAdbStep("error");
      setWirelessMessage(`Connection error: ${err.message}`);
    } finally {
      setIsSettingWireless(false);
    }
  };

  const connectWirelessAdb = async (customIp?: string) => {
    const targetIp = customIp || wirelessIp;
    if (!targetIp) {
      setWirelessAdbStep("error");
      setWirelessMessage("Please provide a valid phone IP address.");
      return;
    }
    setIsSettingWireless(true);
    setWirelessMessage(`Connecting to wireless node at ${targetIp}:5555...`);
    addLog(`Wireless ADB: Connecting to ${targetIp}:5555...`);
    try {
      const res = await fetch("http://127.0.0.1:3002/api/action", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${desktopBridgeToken}`
        },
        body: JSON.stringify({ type: "phone_wireless_connect", args: { ip: targetIp } })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWirelessAdbStep("connected");
        setWirelessMessage("Wireless link successfully established! You can now safely disconnect the physical USB cable!");
        addLog(`Wireless ADB: Connected successfully to ${targetIp}`);
        checkUsbStatus();
      } else {
        setWirelessAdbStep("error");
        setWirelessMessage(data.error || "Wireless handshake failed. Make sure port 5555 is open.");
        addLog(`Wireless ADB: Connection failed: ${data.error}`);
      }
    } catch (err: any) {
      setWirelessAdbStep("error");
      setWirelessMessage(`Handshake failed: ${err.message}`);
    } finally {
      setIsSettingWireless(false);
    }
  };

  // Run USB checks when the tab changes to 'usb'
  useEffect(() => {
    if (activeTab === "usb" && isOpen) {
      checkUsbStatus();
    }
  }, [activeTab, isOpen]);

  const saveCompanionApiKey = (key: string) => {
    setCompanionApiKey(key);
    localStorage.setItem("max_companion_api_key", key);
    addLog(`Stored secure API key pairing configuration token: ${key.substring(0, 10)}...`);
  };

  // Generate unique credentials independent of app name
  const generatePayload = () => {
    const appId = "MAX_AI_OS_SECURE_NODE_9921X";
    const sessionToken = "SES_TOKEN_" + Math.random().toString(36).substring(2, 15).toUpperCase();
    const publicKey = "ECDH_PUB_" + Math.random().toString(36).substring(2, 12).toUpperCase() + "_SEC56";
    
    // Encrypted pairing info payload
    const payloadObj = {
      action: "pair_device",
      appId,
      publicKey,
      sessionToken,
      timestamp: Date.now(),
      fingerprint: "SHA256:8f:92:d2:e3:10:bc:fc:a1:00:22:90:de"
    };

    setPairingPayload(payloadObj);
    return JSON.stringify(payloadObj);
  };

  // Re-generate QR Code URL
  const updateQRCode = async () => {
    try {
      const payloadStr = generatePayload();
      const url = await QRCode.toDataURL(payloadStr, {
        margin: 1.5,
        width: 250,
        color: {
          dark: "#22d3ee", // Cyan
          light: "#020617" // Very dark slate
        }
      });
      setQrCodeUrl(url);
      addLog("System initialized. Generated cryptographic handshake QR token.");
    } catch (err) {
      console.error("Failed to generate QR Code:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (pairedDevice) {
        setPairingStep("connected");
        setActiveTab("mirror"); // auto focus mirror if already connected
        addLog(`Secured link re-established with trusted Android node [${pairedDevice.model}]`);
      } else {
        setPairingStep("qr");
        setActiveTab("handshake");
        updateQRCode();
      }
    }
  }, [isOpen, pairedDevice]);

  const addLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${text}`]);
  };

  const simulateAppScan = () => {
    if (!pairingPayload) return;
    setIsSimulatingScan(true);
    setPairingStep("exchanging");
    addLog("Android AI App scanned secure pairing payload QR.");
    
    setTimeout(() => {
      addLog(`Payload verified: AppId matched static hardware registry.`);
      addLog(`Initiating ECDH key exchange...`);
    }, 800);

    setTimeout(() => {
      addLog(`Shared secret successfully negotiated: AES-256-GCM context established.`);
      addLog(`Validating Session Token...`);
    }, 1600);

    setTimeout(() => {
      const newDevice = {
        id: "AND-NODE-" + Math.floor(1000 + Math.random() * 9000),
        model: "Android Companion App (Pixel 9 Pro)",
        key: pairingPayload.publicKey,
        session: pairingPayload.sessionToken
      };
      
      onDevicePaired(newDevice);
      setPairingStep("connected");
      setIsSimulatingScan(false);
      setActiveTab("mirror");
      addLog(`SECURE LINK ACTIVE: Connected with paired device [${newDevice.model}]`);
    }, 2400);
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;

    const rawCmd = inputCommand.trim();
    // Simulate encryption
    const encryptedHex = "0x" + rawCmd.split("")
      .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");

    addLog(`AES-256 OUTGOING payload sent: ${rawCmd}`);
    addLog(`[CYPHERTEXT]: ${encryptedHex.substring(0, 35)}...`);
    
    setInputCommand("");

    // Receive response simulation
    setTimeout(() => {
      let responseText = "CMD_ACK: Automated operation executed successfully.";
      if (rawCmd.toLowerCase().includes("screenshot")) {
        responseText = "CMD_ACK: Screenshot captured and synced to viewport.";
      } else if (rawCmd.toLowerCase().includes("status")) {
        responseText = "SYSTEM_HEALTH: Android Core Temperature 38°C | Battery 94% | RAM 4.2GB/8GB";
      } else if (rawCmd.toLowerCase().includes("open")) {
        responseText = `CMD_ACK: Intent triggered: android.intent.action.VIEW for browser.`;
      }
      
      const encryptedResp = "0x" + responseText.split("")
        .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("");

      addLog(`[CYPHERTEXT INCOMING]: ${encryptedResp.substring(0, 35)}...`);
      addLog(`AES-256 INCOMING payload decrypted: ${responseText}`);
    }, 800);
  };

  const executeRemoteAction = (actionLabel: string, payload: any, needsConfirmation: boolean = false, confirmationDetails?: any) => {
    if (pairingStep !== "connected") {
      addLog("Remote execution blocked: Device disconnected.");
      return;
    }

    if (needsConfirmation && confirmationDetails) {
      setSensitiveAction({
        type: confirmationDetails.type,
        title: confirmationDetails.title,
        description: confirmationDetails.description,
        payload: { actionLabel, payload }
      });
      return;
    }

    // Direct encrypted execution
    addLog(`EXECUTE REMOTE: ${actionLabel}`);
    if (payload.logText) {
      addLog(`Android OS: ${payload.logText}`);
    }
  };

  const handleConfirmSensitiveAction = () => {
    if (!sensitiveAction) return;
    const { actionLabel, payload } = sensitiveAction.payload;
    addLog(`USER CONFIRMED SENSITIVE OPERATION: ${sensitiveAction.title}`);
    addLog(`EXECUTE SECURED: ${actionLabel}`);
    if (payload.logText) {
      addLog(`Android OS Override: ${payload.logText}`);
    }
    setSensitiveAction(null);
  };

  // Simulate Multi-step screen UI element scanning
  const startUIScreenScan = () => {
    setAutomationStatus("scanning");
    setAutomationLog(["Initializing on-screen element layout bounds...", "Analyzing visual tree hierarchy..."]);
    
    setTimeout(() => {
      setDetectedUIElements([
        { id: "btn_post_0", name: "Publish / Upload Button", bounds: "[820, 1850][1020, 1950]", confidence: 0.98 },
        { id: "inp_caption_0", name: "Text Input Field", bounds: "[120, 480][960, 680]", confidence: 0.95 },
        { id: "toggle_privacy_0", name: "Privacy Level Dropdown", bounds: "[120, 720][450, 800]", confidence: 0.91 },
        { id: "btn_edit_effects", name: "Video Trim Overlay", bounds: "[300, 1200][780, 1300]", confidence: 0.88 }
      ]);
      setAutomationLog(prev => [...prev, "Visual OCR analysis complete.", "4 key interactable controls detected with bounds."]);
      setAutomationStatus("clicking");
    }, 1200);
  };

  const executeAutomationWorkflow = () => {
    setAutomationLog(prev => [...prev, "Workflow autopilot active: Autofilling caption fields..."]);
    
    setTimeout(() => {
      setAutomationLog(prev => [...prev, "Autofilled caption: '#SecurityAI Cyber Automation Link Active'"]);
      setAutomationLog(prev => [...prev, "Targeting Accessibility Node: Click bounds [820, 1850]..."]);
    }, 1000);

    setTimeout(() => {
      setAutomationLog(prev => [...prev, "Sensitive Action Confirmation required for trigger 'btn_post_0'"]);
      setSensitiveAction({
        type: "publish",
        title: "Autopilot Post Upload Confirmation",
        description: "The autonomous agent is attempting to tap 'Publish / Upload Button' and execute the post workflow to configured social media apps.",
        payload: {
          actionLabel: "Autonomous Post Autopilot",
          payload: { logText: "Post published to social media successfully via Accessibility controls." }
        }
      });
      setAutomationStatus("completed");
    }, 2000);
  };

  const disconnectDevice = () => {
    onDeviceDisconnected();
    setPairingStep("qr");
    updateQRCode();
    addLog("Device paired node manually unlinked. Session keys wiped.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl rounded-3xl border border-cyan-500/10 bg-slate-900/90 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 flex flex-col h-[90vh] md:h-[80vh]"
      >
        {/* Top Header Controls */}
        <div className="px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-white tracking-wider uppercase">Nova AI Remote Companion Engine</h3>
                {pairingStep === "connected" ? (
                  <span className="px-2 py-0.5 rounded-full text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono animate-pulse">
                    SECURED NODE CONNECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                    COUPLING STANDBY
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono uppercase">Unified Android Live Control / Video Editor / Accessibility Automation Console</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-56 border-r border-white/5 bg-slate-950/30 flex flex-col justify-between">
            <div className="p-4 flex flex-col gap-1.5">
              <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider uppercase px-2 mb-2">Workspace Controls</span>
              
              <button
                onClick={() => setActiveTab("handshake")}
                className={`w-full px-3 py-2 rounded-xl text-left font-mono text-xs flex items-center gap-2.5 transition ${
                  activeTab === "handshake" 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <QrCode size={14} />
                <span>QR Pairing Link</span>
              </button>

              <button
                onClick={() => setActiveTab("usb")}
                className={`w-full px-3 py-2 rounded-xl text-left font-mono text-xs flex items-center gap-2.5 transition ${
                  activeTab === "usb" 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Smartphone size={14} className="text-cyan-400" />
                <span>USB ADB Link</span>
              </button>

              <button
                onClick={() => {
                  if (pairingStep === "connected") {
                    setActiveTab("mirror");
                  } else {
                    addLog("Select QR Pairing tab and scan token to unlock mirrors.");
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl text-left font-mono text-xs flex items-center justify-between transition ${
                  pairingStep !== "connected" ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  activeTab === "mirror" 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Tv size={14} />
                  <span>Live Mirror Screen</span>
                </div>
                {pairingStep === "connected" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                )}
              </button>

              <button
                onClick={() => pairingStep === "connected" && setActiveTab("files")}
                className={`w-full px-3 py-2 rounded-xl text-left font-mono text-xs flex items-center gap-2.5 transition ${
                  pairingStep !== "connected" ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  activeTab === "files" 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <FolderOpen size={14} />
                <span>Files & Clipboard</span>
              </button>

              <button
                onClick={() => pairingStep === "connected" && setActiveTab("editor")}
                className={`w-full px-3 py-2 rounded-xl text-left font-mono text-xs flex items-center gap-2.5 transition ${
                  pairingStep !== "connected" ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  activeTab === "editor" 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Scissors size={14} />
                <span>Media Video Studio</span>
              </button>

              <button
                onClick={() => pairingStep === "connected" && setActiveTab("automation")}
                className={`w-full px-3 py-2 rounded-xl text-left font-mono text-xs flex items-center gap-2.5 transition ${
                  pairingStep !== "connected" ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  activeTab === "automation" 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Cpu size={14} />
                <span>AI Autopilot Agent</span>
              </button>

              <button
                onClick={() => pairingStep === "connected" && setActiveTab("security")}
                className={`w-full px-3 py-2 rounded-xl text-left font-mono text-xs flex items-center gap-2.5 transition ${
                  pairingStep !== "connected" ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  activeTab === "security" 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield size={14} />
                <span>Security HUD</span>
              </button>
            </div>

            {/* Hardware Link Overview */}
            <div className="p-4 border-t border-white/5 bg-black/20 text-[10px] font-mono text-slate-400 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>RECONNECTION:</span>
                <span className="text-emerald-400 font-bold uppercase">Auto-Ready</span>
              </div>
              <div className="text-[9px] text-slate-500 leading-normal">
                Pairing keys are hardware persistent. Next reboot will automatically reconnect background websocket.
              </div>
            </div>
          </div>

          {/* Active Workspace Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
            
            {/* Left Content Viewport */}
            <div className="flex-1 p-6 flex flex-col overflow-y-auto">
              
              {activeTab === "usb" && (
                <div className="flex flex-col gap-6 max-w-xl mx-auto w-full py-4 font-mono">
                  <div className="p-4 rounded-2xl border border-cyan-500/20 bg-slate-950/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone className="text-cyan-400 animate-pulse" size={18} />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Android ADB Live Connection</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Control and deploy companion software directly over the physical Android Debug Bridge (ADB) pipe. This allows physical installation and standalone setup bypassing local server limits.
                    </p>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                        <span className="text-xs text-slate-300">ADB Service Status:</span>
                        {isCheckingUsb ? (
                          <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                            <RefreshCw className="animate-spin text-cyan-400" size={12} />
                            <span>QUERYING...</span>
                          </div>
                        ) : phoneAdbAvailable ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ACTIVE & READY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            NOT FOUND (USING FALLBACK)
                          </span>
                        )}
                      </div>

                      {usbErrorMessage && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px]">
                          {usbErrorMessage}
                        </div>
                      )}

                      {/* Connected Devices List */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold flex justify-between items-center">
                          <span>Connected USB Devices</span>
                          <button 
                            onClick={checkUsbStatus}
                            className="p-1 rounded hover:bg-white/5 text-cyan-400 transition cursor-pointer"
                          >
                            <RefreshCw size={10} className={isCheckingUsb ? "animate-spin" : ""} />
                          </button>
                        </div>

                        {usbConnectedDevices.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-500 border border-dashed border-white/5 rounded-lg">
                            No physical Android devices detected.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {usbConnectedDevices.map((dev, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                  <div>
                                    <span className="text-xs font-bold text-slate-200">{dev.model}</span>
                                    <span className="text-[9px] text-slate-500 block">ID: {dev.id}</span>
                                  </div>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${
                                  dev.state === "device" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {dev.state}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Installer Section */}
                  <div className="p-4 rounded-2xl border border-cyan-500/20 bg-slate-950/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="text-cyan-400" size={18} />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Deploy Companion Client</h4>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Push the pre-configured Nova AI Mobile Client over ADB. This client executes accessibility automation, media syncs, and screen mirrors natively.
                    </p>

                    <button
                      onClick={installCompanionApp}
                      disabled={usbInstallStatus === "installing" || usbConnectedDevices.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold font-mono text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
                    >
                      <Terminal size={14} />
                      {usbInstallStatus === "installing" ? "Deploying APK via ADB..." : "Install Companion APK"}
                    </button>

                    {usbInstallMessage && (
                      <div className={`mt-3 p-3 rounded-xl text-[10px] border ${
                        usbInstallStatus === "success" 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : usbInstallStatus === "error"
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                            : "bg-slate-900 border-white/5 text-slate-300 animate-pulse"
                      }`}>
                        {usbInstallMessage}
                      </div>
                    )}
                  </div>

                  {/* Independent Setup & API Key configuration */}
                  <div className="p-4 rounded-2xl border border-cyan-500/20 bg-slate-950/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="text-cyan-400" size={18} />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Independent Key Pairing</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                      Ensure the phone app remains independent! Copy this API credential and enter it into the phone companion so it can issue commands without requiring an active PC link.
                    </p>

                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-white/5">
                      <input 
                        type="text" 
                        value={companionApiKey}
                        onChange={(e) => saveCompanionApiKey(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-slate-200 outline-none select-all animate-none"
                        placeholder="Enter Pairing Token Key"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(companionApiKey);
                          addLog("Copied pairing API key token to clipboard.");
                        }}
                        className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition text-[9px] font-bold cursor-pointer"
                      >
                        COPY KEY
                      </button>
                    </div>
                  </div>

                  {/* Wireless Wi-Fi Sync Card */}
                  <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center gap-2">
                      <Wifi className="text-emerald-400 animate-pulse" size={18} />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Wi-Fi Wireless Sync Setup (USB-Free)</h4>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Convert your physical USB ADB pairing into a persistent wireless background connection. Once established, you can safely unplug your phone's USB cable and control your device wirelessly!
                    </p>

                    <div className="flex flex-col gap-3">
                      {/* Step 1: Initialize TCPIP */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold">STEP 1: ENABLE WIRELESS DEBUG PORT</span>
                          <span className="text-emerald-400 font-mono">PORT: 5555</span>
                        </div>
                        <button
                          onClick={setupWirelessAdb}
                          disabled={isSettingWireless || usbConnectedDevices.length === 0}
                          className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] uppercase font-bold tracking-wider transition cursor-pointer disabled:opacity-40"
                        >
                          {wirelessAdbStep === "tcpip" ? "Configuring Device..." : "Activate Wireless Port (USB Required)"}
                        </button>
                      </div>

                      {/* Step 2: Connection details */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-2.5">
                        <span className="text-[10px] text-slate-400 font-bold">STEP 2: SET UP HANDSHAKE BRIDGE</span>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={wirelessIp}
                            onChange={(e) => setWirelessIp(e.target.value)}
                            placeholder="Enter device local IP (e.g. 192.168.1.50)"
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-mono placeholder-slate-700 focus:outline-none"
                          />
                          <button
                            onClick={() => connectWirelessAdb()}
                            disabled={isSettingWireless || !wirelessIp}
                            className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                          >
                            Pair Device
                          </button>
                        </div>
                      </div>

                      {/* Wireless Status messages */}
                      {wirelessMessage && (
                        <div className={`p-3 rounded-xl text-[10px] border leading-relaxed font-mono ${
                          wirelessAdbStep === "connected"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : wirelessAdbStep === "error"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-slate-900 border-white/5 text-cyan-400"
                        }`}>
                          <div className="flex gap-1.5 items-start">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-ping mt-1" />
                            <span>{wirelessMessage}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ADB setup tutorial steps */}
                  <div className="p-4 rounded-2xl bg-slate-950/20 border border-white/5 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300 block mb-2 uppercase tracking-wider">How to enable USB Debugging & Wireless:</span>
                    <ol className="list-decimal pl-4 flex flex-col gap-1.5 leading-relaxed">
                      <li>Open <span className="text-white">Settings</span> on your Android phone.</li>
                      <li>Go to <span className="text-white">About Phone</span> & find <span className="text-white">Build Number</span>.</li>
                      <li>Tap <span className="text-white">Build Number 7 times</span> to enable Developer Options.</li>
                      <li>Back out, open <span className="text-white">Developer Options</span>.</li>
                      <li>Enable <span className="text-white">USB Debugging</span> & connect USB cable.</li>
                      <li>Ensure phone and PC are connected to the <span className="text-emerald-400 font-bold">same Wi-Fi network</span>.</li>
                      <li>Tap <span className="text-emerald-400">Activate Wireless Port</span> above, then tap <span className="text-emerald-400">Pair Device</span>.</li>
                      <li>Unplug USB! Your phone remains wirelessly synchronised!</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === "handshake" && (
                <div className="flex flex-col items-center justify-center flex-1 py-4 text-center max-w-md mx-auto">
                  {pairingStep === "qr" && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-3xl border border-cyan-500/20 bg-slate-950 flex flex-col items-center shadow-2xl relative group">
                        {qrCodeUrl ? (
                          <img 
                            src={qrCodeUrl} 
                            alt="Pairing QR Code" 
                            className="w-56 h-56 rounded-2xl select-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-56 h-56 flex items-center justify-center text-cyan-400">
                            <RefreshCw className="animate-spin" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-3xl cursor-pointer" onClick={updateQRCode}>
                          <RefreshCw className="text-cyan-400 animate-spin" size={28} />
                        </div>
                      </div>
                      
                      <div className="max-w-[320px]">
                        <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-2">Cryptographic Handshake Token</h4>
                        <p className="text-[11px] text-slate-400 font-mono leading-relaxed mb-4">
                          Scan this secure QR code using the <span className="text-cyan-400 font-bold">Android Companion App</span>. It establishes a localized pairing ID with keys that bypass the app's branding names.
                        </p>
                        
                        <button
                          onClick={simulateAppScan}
                          disabled={isSimulatingScan}
                          className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-mono text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
                        >
                          <QrCode size={14} />
                          {isSimulatingScan ? "Exchanging Credentials..." : "Simulate Android QR Scan"}
                        </button>
                      </div>
                    </div>
                  )}

                  {pairingStep === "exchanging" && (
                    <div className="flex flex-col items-center gap-5 py-12">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
                          <Activity size={36} />
                        </div>
                        <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-mono">Negotiating Keys</h4>
                        <p className="text-[10px] text-slate-400 font-mono max-w-xs leading-relaxed">
                          Exchanging Diffie-Hellman parameters, session tokens, and verifying hardware fingerprints over secure transport.
                        </p>
                      </div>
                    </div>
                  )}

                  {pairingStep === "connected" && (
                    <div className="flex flex-col items-center gap-5 text-center py-10">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center relative">
                        <Wifi size={36} className="animate-pulse" />
                        <div className="absolute -top-1 -right-1 p-1 bg-emerald-500 rounded-full border border-slate-900">
                          <Check size={12} className="text-slate-950 font-bold" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-1 font-mono">Connected & Authenticated</h4>
                        <p className="text-xs text-slate-300 font-mono mb-1">{pairedDevice?.model || "Android Phone"}</p>
                        <p className="text-[9px] text-slate-500 font-mono truncate max-w-xs">SHA-256 Fingerprint Validated</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 w-full mt-4">
                        <button
                          onClick={() => setActiveTab("mirror")}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-cyan-400 border border-cyan-500/20 font-mono text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                          Open Mirror View
                        </button>
                        <button
                          onClick={disconnectDevice}
                          className="px-4 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-mono text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                          Unlink Node
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "mirror" && (
                <div className="flex flex-col gap-5 flex-1">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Tv className="text-cyan-400" size={18} />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Live Screen Mirror Stream</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => executeRemoteAction("Capture Screenshot", { logText: "Forced screenshot trigger synced." })}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded text-[9px] font-mono font-bold text-slate-300 transition cursor-pointer uppercase"
                      >
                        Screenshot
                      </button>
                      <button 
                        onClick={() => executeRemoteAction("Trigger Voice Assist", { logText: "Voice remote command pipeline open." })}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded text-[9px] font-mono font-bold text-slate-300 transition cursor-pointer uppercase flex items-center gap-1"
                      >
                        <Volume2 size={10} className="text-cyan-400 animate-bounce" /> Voice Assist
                      </button>
                    </div>
                  </div>

                  {/* Virtual Android Phone Mirror Frame */}
                  <div className="flex flex-col md:flex-row gap-6 items-center justify-center flex-1 py-2">
                    
                    <div className="w-64 aspect-[9/18.5] bg-slate-950 rounded-[36px] border-[5px] border-slate-800 shadow-2xl p-3 flex flex-col justify-between relative overflow-hidden">
                      {/* Speaker grill / Camera notch */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-b-xl z-20 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2" />
                        <div className="w-10 h-1 bg-slate-800 rounded-full" />
                      </div>

                      {/* Mirror Screen Area */}
                      <div className="flex-1 bg-slate-900 rounded-[28px] overflow-hidden flex flex-col justify-between p-3.5 pt-6 text-white relative">
                        
                        {/* Status bar */}
                        <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
                          <span>09:58 AM</span>
                          <div className="flex items-center gap-1">
                            <Wifi size={8} className="text-cyan-400" />
                            <span>100%</span>
                          </div>
                        </div>

                        {/* View port based on active app */}
                        {activeScreen === "launcher" && (
                          <div className="flex-1 flex flex-col justify-between py-6">
                            <div className="text-center">
                              <h5 className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">Autonomous OS</h5>
                              <p className="text-[8px] text-cyan-400 font-mono font-bold">NODE OVERRIDE GRANTED</p>
                            </div>

                            {/* App Grid */}
                            <div className="grid grid-cols-3 gap-2 py-2">
                              <button onClick={() => setActiveScreen("social")} className="flex flex-col items-center gap-1 hover:scale-105 transition cursor-pointer">
                                <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-lg">
                                  <Share2 size={14} />
                                </div>
                                <span className="text-[7.5px] font-mono text-slate-300">Social Upload</span>
                              </button>

                              <button onClick={() => setActiveScreen("camera")} className="flex flex-col items-center gap-1 hover:scale-105 transition cursor-pointer">
                                <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white shadow-lg">
                                  <Camera size={14} />
                                </div>
                                <span className="text-[7.5px] font-mono text-slate-300">Camera Remote</span>
                              </button>

                              <button onClick={() => setActiveScreen("editor")} className="flex flex-col items-center gap-1 hover:scale-105 transition cursor-pointer">
                                <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-lg">
                                  <Scissors size={14} />
                                </div>
                                <span className="text-[7.5px] font-mono text-slate-300">Video Editor</span>
                              </button>

                              <button onClick={() => setActiveScreen("settings")} className="flex flex-col items-center gap-1 hover:scale-105 transition cursor-pointer">
                                <div className="p-2 rounded-xl bg-slate-800 text-white shadow-lg">
                                  <Settings size={14} />
                                </div>
                                <span className="text-[7.5px] font-mono text-slate-300">ADB Setup</span>
                              </button>
                            </div>

                            <div className="p-1 rounded-lg bg-black/40 border border-white/5 text-center text-[7px] font-mono text-cyan-400 animate-pulse">
                              Live Stream Active
                            </div>
                          </div>
                        )}

                        {activeScreen === "social" && (
                          <div className="flex-1 flex flex-col justify-between py-4 font-mono">
                            <div className="flex items-center justify-between border-b border-white/5 pb-1">
                              <span className="text-[8px] text-slate-400 font-bold uppercase">Social App Node</span>
                              <button onClick={() => setActiveScreen("launcher")} className="text-[7px] text-cyan-400">Back</button>
                            </div>

                            <div className="flex-1 flex flex-col justify-center gap-2 py-2">
                              <div className="p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[8px] flex flex-col gap-1">
                                <span className="text-[7px] text-slate-500 uppercase">Selected Asset</span>
                                <span className="text-white truncate">Render_Project_1.mp4</span>
                              </div>

                              <div className="p-2 bg-slate-950/60 rounded-lg border border-white/5 text-[8px] flex flex-col gap-1">
                                <span className="text-[7px] text-slate-500 uppercase">Post Description</span>
                                <input 
                                  type="text" 
                                  value={captionText} 
                                  onChange={(e) => setCaptionText(e.target.value)}
                                  className="bg-transparent border-none text-white focus:outline-none p-0 text-[8px]" 
                                />
                              </div>
                            </div>

                            <button 
                              onClick={() => executeRemoteAction("Upload to Social App", { logText: "Autopilot posted asset." }, true, {
                                type: "upload",
                                title: "Confirm Social Post Broadcast",
                                description: "Are you sure you want to trigger the remote post upload with custom caption on your phone?"
                              })}
                              className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition"
                            >
                              Publish to Instagram
                            </button>
                          </div>
                        )}

                        {activeScreen === "camera" && (
                          <div className="flex-1 flex flex-col justify-between py-4 font-mono">
                            <div className="flex items-center justify-between border-b border-white/5 pb-1">
                              <span className="text-[8px] text-slate-400 font-bold uppercase">Remote Capture HUD</span>
                              <button onClick={() => setActiveScreen("launcher")} className="text-[7px] text-cyan-400">Back</button>
                            </div>

                            {/* Camera Feed Simulator */}
                            <div className="flex-1 rounded-lg bg-black relative overflow-hidden flex items-center justify-center my-2 border border-white/10">
                              {cameraActive ? (
                                <div className="absolute inset-0 flex flex-col justify-between p-2">
                                  <div className="flex justify-between text-[7px] text-rose-500 items-center">
                                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" /> REC</span>
                                    <span>HD 60FPS</span>
                                  </div>
                                  <span className="text-[8px] text-center text-slate-400">Simulating live phone camera viewport</span>
                                </div>
                              ) : (
                                <span className="text-[8px] text-slate-600 uppercase">Camera Sensor Standby</span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1">
                              <button 
                                onClick={() => {
                                  setCameraActive(!cameraActive);
                                  addLog(`Camera trigger changed: ${!cameraActive ? "Active" : "Standby"}`);
                                }}
                                className={`py-1 rounded text-[8px] font-bold uppercase transition ${cameraActive ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300"}`}
                              >
                                {cameraActive ? "Stop Camera" : "Start Camera"}
                              </button>
                              <button 
                                onClick={() => {
                                  setRecordingActive(!recordingActive);
                                  addLog(`MediaProjection Recording changed: ${!recordingActive ? "Active" : "Wiped"}`);
                                }}
                                className={`py-1 rounded text-[8px] font-bold uppercase transition ${recordingActive ? "bg-rose-600 text-white animate-pulse" : "bg-slate-800 text-slate-300"}`}
                              >
                                {recordingActive ? "Stop Rec" : "Record Screen"}
                              </button>
                            </div>
                          </div>
                        )}

                        {activeScreen === "editor" && (
                          <div className="flex-1 flex flex-col justify-between py-4 font-mono">
                            <div className="flex items-center justify-between border-b border-white/5 pb-1">
                              <span className="text-[8px] text-slate-400 font-bold uppercase">Video Studio</span>
                              <button onClick={() => setActiveScreen("launcher")} className="text-[7px] text-cyan-400">Back</button>
                            </div>

                            <div className="flex-1 flex flex-col justify-center gap-2 py-1">
                              <div className="text-[7px] text-slate-400">Trimming Range ({trimStart}% - {trimEnd}%)</div>
                              <div className="h-3 bg-slate-950 rounded-full relative">
                                <div className="absolute top-0 bottom-0 left-[20%] right-[30%] bg-cyan-500/30 border-x-2 border-cyan-400" />
                              </div>

                              <div className="flex flex-col gap-1 pt-1">
                                <span className="text-[7px] text-slate-500">Caption Style</span>
                                <div className="p-1.5 bg-slate-950/60 rounded border border-white/5 text-[7px] text-amber-400">
                                  {captionText}
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                executeRemoteAction("Compile Render Project", { logText: "Video render process triggered." });
                                addLog("Active Trimming & caption styles synchronized to Android Editor Engine.");
                              }}
                              className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition"
                            >
                              Render Draft
                            </button>
                          </div>
                        )}

                        {activeScreen === "settings" && (
                          <div className="flex-1 flex flex-col justify-between py-4 font-mono">
                            <div className="flex items-center justify-between border-b border-white/5 pb-1">
                              <span className="text-[8px] text-slate-400 font-bold uppercase font-sans">Handshake Settings</span>
                              <button onClick={() => setActiveScreen("launcher")} className="text-[7px] text-cyan-400">Back</button>
                            </div>

                            <div className="flex-1 flex flex-col justify-center gap-1.5 text-[8px] text-slate-400 py-2">
                              <div>App ID: <span className="text-white font-semibold">MAX_AI_OS</span></div>
                              <div>Trusted Server Node: <span className="text-white">Active (Localhost)</span></div>
                              <div>Permission Layer: <span className="text-emerald-400">Accessibility Granted</span></div>
                              <div className="pt-2 border-t border-white/5">Auto-Wipe Memory: <span className="text-rose-500">Disabled</span></div>
                            </div>

                            <button 
                              onClick={() => {
                                executeRemoteAction("Wipe Remote Keys", {}, true, {
                                  type: "delete",
                                  title: "Confirm Security Key Wipe",
                                  description: "This will force unpair the companion, remove authorization certificates and wipe the memory node database. Proceed?"
                                });
                              }}
                              className="w-full py-1 bg-red-950 text-red-400 hover:bg-red-900 border border-red-500/20 rounded text-[8px] font-bold uppercase transition"
                            >
                              Wipe Node Keys
                            </button>
                          </div>
                        )}

                        {/* Phone Virtual Navigation Bar */}
                        <div className="flex justify-around items-center pt-2 border-t border-white/5 text-slate-500">
                          <button onClick={() => setActiveScreen("launcher")} className="hover:text-white transition cursor-pointer text-[9px] font-mono">◀</button>
                          <button onClick={() => setActiveScreen("launcher")} className="hover:text-white transition cursor-pointer text-[9px] font-mono">●</button>
                          <button onClick={() => setActiveScreen("launcher")} className="hover:text-white transition cursor-pointer text-[9px] font-mono">■</button>
                        </div>

                      </div>
                    </div>

                    {/* Remote Input Control Interface */}
                    <div className="flex-1 flex flex-col gap-3 w-full font-mono text-xs">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Keyboard size={12} /> Accessibility Overlay Remote
                        </span>
                        
                        <div className="text-[10px] text-slate-400 leading-relaxed mb-1">
                          Since the system has accessibility permissions, you can remotely simulate taps, typing, hardware keys, and voice automation without physical intervention.
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => executeRemoteAction("Tap Home Key", { logText: "Keycode 3 triggered." })}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/5 text-left flex flex-col gap-0.5 transition"
                          >
                            <span className="text-[9px] text-slate-500 uppercase leading-none">Simulate Button</span>
                            <span className="text-white text-[10px] font-bold">Home Key</span>
                          </button>

                          <button 
                            onClick={() => executeRemoteAction("App Switcher", { logText: "Keycode 187 triggered." })}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/5 text-left flex flex-col gap-0.5 transition"
                          >
                            <span className="text-[9px] text-slate-500 uppercase leading-none">Simulate Button</span>
                            <span className="text-white text-[10px] font-bold">App Overview</span>
                          </button>

                          <button 
                            onClick={() => executeRemoteAction("Remotely Slide Left", { logText: "Swipe gesture coordinates: [900, 1000] to [100, 1000]" })}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/5 text-left flex flex-col gap-0.5 transition"
                          >
                            <span className="text-[9px] text-slate-500 uppercase leading-none">Accessibility Gesture</span>
                            <span className="text-white text-[10px] font-bold">Swipe Left</span>
                          </button>

                          <button 
                            onClick={() => executeRemoteAction("Remotely Slide Right", { logText: "Swipe gesture coordinates: [100, 1000] to [900, 1000]" })}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-white/5 text-left flex flex-col gap-0.5 transition"
                          >
                            <span className="text-[9px] text-slate-500 uppercase leading-none">Accessibility Gesture</span>
                            <span className="text-white text-[10px] font-bold">Swipe Right</span>
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 flex flex-col gap-2">
                          <span className="text-[9px] text-slate-500 uppercase">Input Text Injection Autopilot</span>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Type text to inject to focused phone text input..." 
                              id="inject_text_field"
                              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none"
                            />
                            <button 
                              onClick={() => {
                                const el = document.getElementById("inject_text_field") as HTMLInputElement;
                                if (el && el.value) {
                                  executeRemoteAction("Inject Input Text", { text: el.value, logText: `Injected keyboard sequence: "${el.value}"` });
                                  el.value = "";
                                }
                              }}
                              className="px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] transition cursor-pointer"
                            >
                              Inject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "files" && (
                <div className="flex flex-col gap-5 flex-1 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="text-cyan-400" size={18} />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Secured File Explorer & Clipboard Sync</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Clipboard Sync */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                        <Clipboard size={12} /> Live Clipboard Sync
                      </span>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Desktop Clipboard (Local PC)</label>
                          <textarea 
                            value={pcClipboard} 
                            onChange={(e) => setPcClipboard(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-xl p-2.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-400"
                            rows={2}
                          />
                        </div>

                        <button 
                          onClick={() => {
                            setPhoneClipboard(pcClipboard);
                            executeRemoteAction("Push Clipboard to Android", { text: pcClipboard, logText: "Syncing clipboard to Android background task." });
                          }}
                          className="py-2 bg-slate-950 hover:bg-slate-900 border border-cyan-500/20 text-cyan-400 rounded-xl font-bold uppercase text-[9px] tracking-wider transition cursor-pointer"
                        >
                          Sync Desktop Clipboard → Android Node
                        </button>

                        <div className="flex flex-col gap-1 pt-1.5 border-t border-white/5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Android Device Clipboard</label>
                          <div className="bg-slate-950/60 border border-white/5 rounded-xl p-2.5 text-[10px] text-slate-300 select-all font-mono min-h-[40px]">
                            {phoneClipboard}
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setPcClipboard(phoneClipboard);
                            addLog("Synced phone clipboard status locally to client OS clipboard.");
                          }}
                          className="py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-[9px] transition cursor-pointer uppercase font-bold"
                        >
                          Sync Android Clipboard → PC
                        </button>
                      </div>
                    </div>

                    {/* Files Manager */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                        <FolderOpen size={12} /> Android Asset Directory
                      </span>

                      <div className="flex-1 flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                        {androidFiles.map((file, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedFile(file.name)}
                            className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                              selectedFile === file.name 
                                ? "bg-cyan-500/10 border-cyan-500/30" 
                                : "bg-slate-950 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-white truncate max-w-[180px]">{file.name}</span>
                              <span className="text-[8px] text-slate-500">{file.path}</span>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0 pl-2">
                              <span className="text-[9px] text-slate-300 font-bold">{file.size}</span>
                              <span className="text-[7.5px] text-slate-500">{file.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* File operations */}
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button 
                          disabled={!selectedFile}
                          onClick={() => {
                            if (!selectedFile) return;
                            const newName = prompt(`Enter new name for ${selectedFile}:`, selectedFile);
                            if (newName && newName !== selectedFile) {
                              setAndroidFiles(prev => prev.map(f => f.name === selectedFile ? { ...f, name: newName } : f));
                              setSelectedFile(newName);
                              addLog(`File successfully renamed: ${selectedFile} → ${newName}`);
                            }
                          }}
                          className="py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-300 rounded-lg text-[9px] transition cursor-pointer disabled:opacity-40 uppercase"
                        >
                          Rename
                        </button>
                        <button 
                          disabled={!selectedFile}
                          onClick={() => {
                            if (!selectedFile) return;
                            executeRemoteAction("Wipe Remote File Node", { fileName: selectedFile }, true, {
                              type: "delete",
                              title: "Confirm Android File Deletion",
                              description: `Are you absolutely sure you want to delete "${selectedFile}" from the phone's physical storage node? This is completely irreversible.`
                            });
                          }}
                          className="py-1.5 bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-500/20 rounded-lg text-[9px] transition cursor-pointer disabled:opacity-40 uppercase font-bold"
                        >
                          Delete Asset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "editor" && (
                <div className="flex flex-col gap-4 flex-1 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Scissors className="text-cyan-400" size={18} />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Autonomous Video Studio Editor</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Trim and Video Effects Panel */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                        <Sliders size={12} /> Trim & Subtitle Studio
                      </span>

                      <div className="flex flex-col gap-2.5">
                        <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center text-[8px] text-slate-500 mb-1.5 uppercase font-bold">
                            <span>Interactive Video Trimming Node</span>
                            <span className="text-cyan-400">{trimStart}% - {trimEnd}% Range</span>
                          </div>
                          
                          <div className="flex flex-col gap-2 pt-1">
                            <div className="flex items-center justify-between gap-2 text-[9px] text-slate-300">
                              <span>Start Offset</span>
                              <input 
                                type="range" 
                                min="0" 
                                max="49" 
                                value={trimStart} 
                                onChange={(e) => setTrimStart(parseInt(e.target.value))}
                                className="w-2/3 accent-cyan-400 bg-slate-900 rounded-lg appearance-none h-1.5" 
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2 text-[9px] text-slate-300">
                              <span>End Offset</span>
                              <input 
                                type="range" 
                                min="50" 
                                max="100" 
                                value={trimEnd} 
                                onChange={(e) => setTrimEnd(parseInt(e.target.value))}
                                className="w-2/3 accent-cyan-400 bg-slate-900 rounded-lg appearance-none h-1.5" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Transitions and effects */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Aesthetic Transitions</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {["glitch", "dissolve", "fade_black", "zoom_blur"].map((style) => (
                              <button
                                key={style}
                                onClick={() => setVideoTransition(style)}
                                className={`py-1 rounded text-[8.5px] uppercase font-bold transition border ${
                                  videoTransition === style 
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                                    : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"
                                }`}
                              >
                                {style.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Captions Injection */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-1">
                            <Type size={9} /> Auto-Subtitle & Overlay Captions
                          </label>
                          <input 
                            type="text" 
                            value={captionText} 
                            onChange={(e) => setCaptionText(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-cyan-400"
                            placeholder="Insert caption text here..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Compile & Post Draft Workflow */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                          <Share2 size={12} /> Render Draft & Social Export
                        </span>
                        
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-2">
                          Once editing is complete, compile the video assets locally on the phone's rendering processor. This minimizes network egress overhead.
                        </p>

                        {/* Rendering Preview Mock */}
                        <div className="p-3 bg-slate-950 rounded-xl border border-white/5 my-3 flex flex-col gap-1 text-[9px] text-slate-300">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[8px]">
                            <Play size={10} /> Active Studio Rendering Sandbox
                          </div>
                          <div className="text-[8px] text-slate-500">Output Node: /storage/emulated/0/Movies/Render_Project_1.mp4</div>
                          <div className="pt-1 flex flex-col gap-0.5">
                            <div>- Transition Overlay: <span className="text-white uppercase font-bold">{videoTransition}</span></div>
                            <div>- Trimming Scope: <span className="text-white font-bold">{trimStart}% to {trimEnd}%</span></div>
                            <div className="text-amber-400 truncate font-bold">" {captionText} "</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <button 
                          onClick={() => {
                            executeRemoteAction("Render Compilation Flow", { trimStart, trimEnd, videoTransition, captionText });
                            addLog("Local phone rendering pipeline triggered successfully.");
                          }}
                          className="py-2 bg-slate-950 hover:bg-slate-900 border border-cyan-500/20 text-cyan-400 rounded-xl font-bold uppercase text-[9px] tracking-wider transition cursor-pointer"
                        >
                          Compile Video Render Draft
                        </button>

                        <button 
                          onClick={() => {
                            executeRemoteAction("Publish Video Post", { description: captionText }, true, {
                              type: "publish",
                              title: "Export & Post Render Project",
                              description: `This will push the compiled video file 'Render_Project_1.mp4' directly to Instagram with caption: "${captionText}". Proceed?`
                            });
                          }}
                          className="py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold uppercase text-[9px] tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/10"
                        >
                          <Share2 size={12} /> Broadcast Post
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "automation" && (
                <div className="flex flex-col gap-4 flex-1 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="text-cyan-400" size={18} />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Multi-Step Automation Autopilot</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Screen OCR Detectors */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                        <Eye size={12} /> Live Screen Element Classifier
                      </span>

                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Trigger on-device visual analysis to scan the active app screen, detect labels, coordinates, and compile touch targets for navigation.
                      </p>

                      <div className="flex-1 bg-slate-950 rounded-xl p-3 border border-white/5 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                        {detectedUIElements.length === 0 ? (
                          <div className="text-[9.5px] text-slate-600 italic py-6 text-center">
                            No element maps loaded. Click 'Scan UI Elements' to analyze.
                          </div>
                        ) : (
                          detectedUIElements.map((el, idx) => (
                            <div key={idx} className="p-1.5 border-b border-white/5 flex justify-between text-[8.5px]">
                              <div className="flex flex-col">
                                <span className="text-white font-bold">{el.name}</span>
                                <span className="text-slate-500">ID: {el.id} | Bounds: {el.bounds}</span>
                              </div>
                              <span className="text-cyan-400 font-bold shrink-0">{(el.confidence * 100).toFixed(0)}% Match</span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={startUIScreenScan}
                          disabled={automationStatus === "scanning"}
                          className="py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-300 rounded-lg text-[9px] transition cursor-pointer disabled:opacity-40 uppercase"
                        >
                          {automationStatus === "scanning" ? "Scanning Tree..." : "Scan UI Elements"}
                        </button>
                        <button
                          disabled={detectedUIElements.length === 0}
                          onClick={executeAutomationWorkflow}
                          className="py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold rounded-lg text-[9px] transition cursor-pointer disabled:opacity-40 uppercase"
                        >
                          Run Autopilot
                        </button>
                      </div>
                    </div>

                    {/* Automation Log Stream */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2.5">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                        <Terminal size={12} /> Autopilot Log Pipeline
                      </span>

                      <div className="flex-1 bg-black/80 rounded-xl p-3 border border-white/5 text-[9px] text-slate-400 font-mono h-48 overflow-y-auto flex flex-col gap-1">
                        {automationLog.length === 0 ? (
                          <span className="text-slate-600">Autopilot sequence awaiting execution trigger...</span>
                        ) : (
                          automationLog.map((log, idx) => (
                            <div key={idx} className={
                              log.includes("SECURE") ? "text-emerald-400" :
                              log.includes("autofilled") ? "text-cyan-400" :
                              log.includes("Confirmation required") ? "text-amber-400 animate-pulse font-bold" : "text-slate-400"
                            }>
                              &gt;&gt; {log}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="text-[7.5px] text-slate-500 leading-normal uppercase">
                        All operations comply with Android accessibility security policies. Remote overrides will alert local companion interface in real time.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="flex flex-col gap-4 flex-1 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="text-cyan-400" size={18} />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Device Authorization Security HUD</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Active Permission Indicators */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                        <Lock size={12} /> Local / Remote Guard Overlay
                      </span>

                      <div className="flex flex-col gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-[9px]">
                          <div className="flex flex-col">
                            <span className="text-white font-bold uppercase leading-normal">Accessibility Control Permission</span>
                            <span className="text-slate-500">Inject touch gestures remotely</span>
                          </div>
                          <span className="text-emerald-400 font-bold uppercase text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Granted</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-[9px]">
                          <div className="flex flex-col">
                            <span className="text-white font-bold uppercase leading-normal">MediaProjection Screen Capture</span>
                            <span className="text-slate-500">Live viewport capture pipeline</span>
                          </div>
                          <span className="text-emerald-400 font-bold uppercase text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Authorized</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-[9px]">
                          <div className="flex flex-col">
                            <span className="text-white font-bold uppercase leading-normal">File Storage Node Override</span>
                            <span className="text-slate-500">Read, write and delete media draft folders</span>
                          </div>
                          <span className="text-emerald-400 font-bold uppercase text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Granted</span>
                        </div>
                      </div>
                    </div>

                    {/* Live System Notifications feed */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                        <Bell size={12} /> Security Notifications Pipeline
                      </span>

                      <div className="flex-1 flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                        {phoneNotifications.map((n) => (
                          <div key={n.id} className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-[9px] flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-white font-bold font-sans">{n.app}: {n.title}</span>
                              <span className="text-slate-400 text-[8px]">{n.desc}</span>
                            </div>
                            <span className="text-slate-600 text-[7px] font-sans shrink-0">{n.time}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          setPhoneNotifications(prev => [
                            {
                              id: Date.now().toString(),
                              app: "Instagram",
                              title: "Video Post Status Sync",
                              desc: "Successfully synced with metadata payload",
                              time: "Just now"
                            },
                            ...prev
                          ]);
                          addLog("Simulated incoming security notifications updated.");
                        }}
                        className="py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-300 rounded-lg text-[9px] transition cursor-pointer uppercase font-bold"
                      >
                        Poll Notifications
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Diagnostic Encryption Console */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 p-5 flex flex-col gap-3.5 bg-slate-950/40 min-h-[300px] md:min-h-0">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <Terminal size={12} /> Handshake Log stream
                </span>
                <span className="text-[8px] font-mono text-slate-500 uppercase">WLAN Sync</span>
              </div>

              {/* Console logs box */}
              <div className="flex-1 bg-black/60 rounded-xl p-3 border border-white/5 overflow-y-auto font-mono text-[9px] text-slate-400 leading-relaxed flex flex-col gap-1.5 h-48 max-h-56">
                {logs.length === 0 ? (
                  <span className="text-slate-600">Session logging is idle. Generate QR to initiate coupling.</span>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className={
                      log.includes("AES-256 OUTGOING") ? "text-cyan-400" :
                      log.includes("AES-256 INCOMING") ? "text-emerald-400 font-bold" :
                      log.includes("SECURE LINK ACTIVE") ? "text-emerald-400 font-bold" :
                      log.includes("SENSITIVE") ? "text-amber-400 font-bold" :
                      log.includes("CYPHERTEXT") ? "text-slate-500 text-[8px]" : "text-slate-400"
                    }>
                      {log}
                    </div>
                  ))
                )}
              </div>

              {/* Secure payload form */}
              <form onSubmit={handleSendCommand} className="flex gap-2">
                <input
                  type="text"
                  disabled={pairingStep !== "connected"}
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  placeholder={pairingStep === "connected" ? "Send shell bypass commands..." : "Setup QR link first..."}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={pairingStep !== "connected" || !inputCommand.trim()}
                  className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-xl transition cursor-pointer shrink-0"
                >
                  <Send size={12} />
                </button>
              </form>

              {/* Diagnostics Grid */}
              <div className="grid grid-cols-2 gap-2 text-[8px] font-mono">
                <div className="p-2 bg-black/30 rounded-xl border border-white/5 flex flex-col gap-0.5">
                  <span className="text-slate-500 uppercase">ECDH KEYPAIR</span>
                  <span className="text-slate-300 truncate">{pairedDevice ? pairedDevice.key : "UNRESOLVED_NULL"}</span>
                </div>
                <div className="p-2 bg-black/30 rounded-xl border border-white/5 flex flex-col gap-0.5">
                  <span className="text-slate-500 uppercase">SESSION HASH</span>
                  <span className="text-slate-300 truncate">{pairedDevice ? pairedDevice.session : "UNRESOLVED_NULL"}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* SENSITIVE OPERATION OVERRIDE DIALOG */}
      <AnimatePresence>
        {sensitiveAction && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-slate-900 p-6 flex flex-col gap-4 shadow-2xl shadow-amber-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-bounce">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider leading-none mb-1">MANDATORY USER OVERRIDE</h4>
                  <span className="text-[9px] text-amber-400 tracking-widest font-bold">SENSITIVE TRANSACTION TRIGGERED</span>
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 text-[10px] text-slate-300">
                <div className="text-white font-bold">{sensitiveAction.title}</div>
                <p className="text-slate-400 leading-normal mt-1">{sensitiveAction.description}</p>
              </div>

              <div className="text-[8.5px] text-slate-500 leading-relaxed uppercase border-t border-white/5 pt-2">
                This verification prompt complies with end-user authorization controls. By confirming, you trigger immediate hardware action.
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] uppercase tracking-wider font-bold">
                <button
                  onClick={() => {
                    addLog(`OPERATION ABORTED BY USER: ${sensitiveAction.title}`);
                    setSensitiveAction(null);
                  }}
                  className="py-2.5 rounded-xl bg-slate-950 border border-white/5 hover:bg-slate-900 text-slate-400 transition cursor-pointer"
                >
                  Abort Action
                </button>
                <button
                  onClick={handleConfirmSensitiveAction}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white transition cursor-pointer"
                >
                  Authorize Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
