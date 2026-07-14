import React, { useState, useEffect } from "react";
import { 
  Smartphone, QrCode, Check, Shield, Activity, Wifi, Terminal, Send, X, RefreshCw, 
  Cpu, Layers, Lock, Unlock, Tv, Keyboard, MousePointer, Volume2, FolderOpen, 
  Clipboard, Bell, Camera, Video, Scissors, Share2, Eye, EyeOff, Settings, 
  AlertTriangle, Play, RotateCcw, Sliders, Type, FileText, MousePointerClick, 
  FileSpreadsheet, LogOut, Github, KeyRound, Database, Download, Upload, Trash2, Plus, Info, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";

interface MaxAIDashboardProps {
  user: any;
  onSignOut: () => void;
  onSignInGoogle: () => Promise<any>;
  onMigrateData: (userId: string) => Promise<{ success: boolean; migratedCount: number }>;
  pairedDevice: { id: string; model: string; key: string; session: string } | null;
  onDevicePaired: (device: any) => void;
  onDeviceDisconnected: () => void;
  desktopBridgeToken: string;
}

export function MaxAIDashboard({
  user,
  onSignOut,
  onSignInGoogle,
  onMigrateData,
  pairedDevice,
  onDevicePaired,
  onDeviceDisconnected,
  desktopBridgeToken
}: MaxAIDashboardProps) {
  // Tabs: pairing, mirror, files, automation, terminal, security, updater
  const [activeTab, setActiveTab] = useState<"pairing" | "mirror" | "files" | "automation" | "terminal" | "security" | "updater">("pairing");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [pairingPayload, setPairingPayload] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>(["[" + new Date().toLocaleTimeString() + "] Systems Initialized. Welcome to Max-AI OS Unified Dashboard."]);
  const [inputCommand, setInputCommand] = useState<string>("");
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);

  // Linking & data migration states
  const [linkingLoader, setLinkingLoader] = useState<boolean>(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  const handleLinkGoogleAccount = async () => {
    setLinkingLoader(true);
    setMigrationStatus(null);
    setMigrationError(null);
    try {
      setLogs(prev => [...prev, `[OAuth] Initiating Google Sign-In secure loopback bridge...`]);
      const loggedInUser = await onSignInGoogle();
      if (!loggedInUser) {
        throw new Error("No Google user returned from sign-in.");
      }
      setLogs(prev => [...prev, `[OAuth] Google authenticated successfully: ${loggedInUser.email}`]);
      setMigrationStatus("Authenticating cloud node...");
      
      // Perform memory migration
      setMigrationStatus("Synchronizing and migrating local recollections...");
      const migrationRes = await onMigrateData(loggedInUser.uid);
      if (migrationRes && migrationRes.success) {
        const count = migrationRes.migratedCount;
        setLogs(prev => [...prev, `[Cloud Sync] Successfully migrated ${count} memories to Google Cloud.`]);
        setMigrationStatus(`SUCCESS: Linked to ${loggedInUser.email} & migrated ${count} memories!`);
      } else {
        setLogs(prev => [...prev, `[Cloud Sync] Google linked. Local storage is up-to-date.`]);
        setMigrationStatus(`Linked to ${loggedInUser.email} (Data Synced)`);
      }
    } catch (err: any) {
      console.error("Linking error:", err);
      setMigrationError(err.message || "Failed to link Google account.");
      setLogs(prev => [...prev, `[Error] Failed to link Google account: ${err.message}`]);
    } finally {
      setLinkingLoader(false);
    }
  };
  
  // Mirror controls
  const [activeScreen, setActiveScreen] = useState<"launcher" | "social" | "camera" | "editor" | "settings">("launcher");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [recordingActive, setRecordingActive] = useState<boolean>(false);

  // Video editor controls
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);
  const [videoTransition, setVideoTransition] = useState<string>("glitch");
  const [captionText, setCaptionText] = useState<string>("#SecurityAI Cyber Automation Link Active");

  // Files list
  const [androidFiles, setAndroidFiles] = useState<Array<{ name: string; size: string; path: string; date: string }>>([
    { name: "DCIM_0092.mp4", size: "48.2 MB", path: "/storage/emulated/0/DCIM/Camera", date: "Today 12:44" },
    { name: "Render_Project_1.mp4", size: "124.8 MB", path: "/storage/emulated/0/Movies", date: "Today 10:15" },
    { name: "Screenshot_2026_Auth.png", size: "1.2 MB", path: "/storage/emulated/0/Pictures/Screenshots", date: "Yesterday" },
    { name: "Keys_ECDH.json", size: "2.4 KB", path: "/storage/emulated/0/Download", date: "2 days ago" }
  ]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Workflow builder state
  const [workflowSteps, setWorkflowSteps] = useState<Array<{ id: string; action: string; param: string }>>([
    { id: "step_1", action: "Capture Screenshot", param: "Main Viewport" },
    { id: "step_2", action: "Apply Trim Sequence", param: "0:05 - 0:15" },
    { id: "step_3", action: "Decrypt Android Handshake Key", param: "AES-256 Key block" },
    { id: "step_4", action: "Upload to Secure Cloud Node", param: "Firebase Firestore Cluster" }
  ]);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState<boolean>(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number | null>(null);

  // Updater states
  const [gitOwner, setGitOwner] = useState<string>("mukimudeen76");
  const [gitRepo, setGitRepo] = useState<string>("Max-AI");
  const [gitToken, setGitToken] = useState<string>("");
  const [automaticUpdates, setAutomaticUpdates] = useState<boolean>(true);
  const [checkOnStartup, setCheckOnStartup] = useState<boolean>(true);
  const [updateChannel, setUpdateChannel] = useState<"stable" | "beta">("stable");
  const [lastChecked, setLastChecked] = useState<string>("Never");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  // QR Code generator
  useEffect(() => {
    const generateQR = async () => {
      try {
        const payloadObj = {
          action: "pair_device",
          appId: "MAX_AI_OS_SECURE_NODE_9921X",
          publicKey: "ECDH_PUB_8FX7S2A1D9_SEC56",
          sessionToken: "SES_TOKEN_MAXAI_CLOUD_ACTIVE",
          timestamp: Date.now(),
          fingerprint: "SHA256:8f:92:d2:e3:10:bc:fc:a1:00:22:90:de"
        };
        setPairingPayload(payloadObj);
        const url = await QRCode.toDataURL(JSON.stringify(payloadObj), {
          margin: 1.5,
          width: 250,
          color: {
            dark: "#22d3ee",
            light: "#020205"
          }
        });
        setQrCodeUrl(url);
      } catch (e) {
        console.error("QR Code generation error:", e);
      }
    };
    generateQR();
  }, []);

  // Fetch updater config on mount
  useEffect(() => {
    const loadConfig = async () => {
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
        }
      } catch (e) {
        console.error("Failed to load updater config:", e);
      }
    };
    loadConfig();
  }, []);

  const addLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${text}`]);
  };

  const simulateScan = () => {
    if (!pairingPayload) return;
    setIsSimulatingScan(true);
    addLog("Android Companion App scanned pairing QR code...");
    
    setTimeout(() => {
      addLog("Cryptographic handshake packet received from node.");
      addLog("Negotiating ECDH curve25519 secure exchange keys...");
    }, 800);

    setTimeout(() => {
      addLog("Handshake successful. Generated Shared Secret (AES-256-GCM mode).");
      addLog("Verifying hardware registry and secure certificates...");
    }, 1600);

    setTimeout(() => {
      const mockDevice = {
        id: "AND-NODE-" + Math.floor(1000 + Math.random() * 9000),
        model: "Android Companion App (Pixel 9 Pro)",
        key: pairingPayload.publicKey,
        session: pairingPayload.sessionToken
      };
      onDevicePaired(mockDevice);
      setIsSimulatingScan(false);
      setActiveTab("mirror");
      addLog(`SECURE LINK ESTABLISHED: Connected with paired device [${mockDevice.model}]`);
    }, 2400);
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;
    const rawCmd = inputCommand.trim();
    addLog(`AES-256 OUTGOING payload sent: ${rawCmd}`);
    setInputCommand("");

    setTimeout(() => {
      let ack = "CMD_ACK: Protocol executed successfully.";
      if (rawCmd.toLowerCase().includes("screenshot")) {
        ack = "CMD_ACK: Screen frame captured and synced.";
      } else if (rawCmd.toLowerCase().includes("status")) {
        ack = "SYSTEM_HEALTH: Android node active | Temp: 37.5°C | Battery: 91% | RAM: 4.8GB/8GB";
      } else if (rawCmd.toLowerCase().includes("open")) {
        ack = "CMD_ACK: Mobile Android activity triggered.";
      }
      addLog(`AES-256 INCOMING payload decrypted: ${ack}`);
    }, 800);
  };

  const deleteFile = (fileName: string) => {
    setAndroidFiles(prev => prev.filter(f => f.name !== fileName));
    addLog(`Deleted remote file: ${fileName}`);
    if (selectedFile === fileName) setSelectedFile(null);
  };

  const handleUploadFileForm = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get("fileName") as string;
    const size = formData.get("fileSize") as string;
    if (name) {
      uploadFile(name, size || "1.5 MB");
      e.currentTarget.reset();
    }
  };

  const uploadFile = (name: string, size: string) => {
    const newFile = {
      name,
      size,
      path: "/storage/emulated/0/Download",
      date: "Today " + new Date().toLocaleTimeString().substring(0, 5)
    };
    setAndroidFiles(prev => [newFile, ...prev]);
    addLog(`Uploaded file to device: ${name} (${size})`);
  };

  const runWorkflow = () => {
    if (isWorkflowRunning) return;
    setIsWorkflowRunning(true);
    addLog("Initiating automated macro sequence workflow...");
    
    let step = 0;
    setActiveWorkflowStep(0);
    addLog(`[Macro Step 1/4]: ${workflowSteps[0].action} (${workflowSteps[0].param})`);

    const interval = setInterval(() => {
      step++;
      if (step < 4) {
        setActiveWorkflowStep(step);
        addLog(`[Macro Step ${step + 1}/4]: ${workflowSteps[step].action} (${workflowSteps[step].param})`);
      } else {
        clearInterval(interval);
        setIsWorkflowRunning(false);
        setActiveWorkflowStep(null);
        addLog("SUCCESS: Automated macro sequence completed fully (100% success rate).");
      }
    }, 1500);
  };

  const handleSaveUpdaterConfig = async () => {
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
        addLog("Updater configuration saved securely to local storage.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
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
      setTestResult(data);
      if (data.success) {
        addLog(`GitHub connection test successful: ${data.message}`);
      } else {
        addLog(`GitHub connection test failed: ${data.error}`);
      }
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
      addLog(`GitHub connection test failed: ${e.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await fetch("/api/update/check");
      if (res.ok) {
        const data = await res.json();
        setUpdateInfo(data);
        setLastChecked(data.lastChecked || new Date().toLocaleString());
        if (data.updateAvailable) {
          addLog("UPDATE MATRIX: New update found from repository!");
        } else {
          addLog("UPDATE MATRIX: Codebase is fully aligned. You are running the latest version.");
        }
      }
    } catch (e: any) {
      addLog(`Update check failed: ${e.message}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#020205] text-white font-sans overflow-hidden select-none">
      {/* Decorative subtle background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40 z-0" />

      {/* LEFT SIDEBAR PANEL */}
      <aside className="w-64 border-r border-white/5 bg-slate-950/45 backdrop-blur-xl p-6 flex flex-col justify-between z-10 relative flex-shrink-0 h-full">
        <div className="flex flex-col gap-6">
          {/* Logo & Version */}
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 uppercase font-sans">
              MAX-AI OS
            </span>
            <span className="text-[9px] font-mono tracking-widest text-slate-500 mt-1 uppercase">
              Unified Console v4.0
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("pairing")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition cursor-pointer ${
                activeTab === "pairing"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)] font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <QrCode size={16} />
              <span>Pairing Center</span>
            </button>

            <button
              onClick={() => setActiveTab("mirror")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition cursor-pointer ${
                activeTab === "mirror"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)] font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Smartphone size={16} />
              <span>Active Screen Mirror</span>
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition cursor-pointer ${
                activeTab === "files"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)] font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <FolderOpen size={16} />
              <span>Secure Storage</span>
            </button>

            <button
              onClick={() => setActiveTab("automation")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition cursor-pointer ${
                activeTab === "automation"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)] font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Sliders size={16} />
              <span>Macro Protocols</span>
            </button>

            <button
              onClick={() => setActiveTab("terminal")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)] font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Terminal size={16} />
              <span>Systems Console</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition cursor-pointer ${
                activeTab === "security"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)] font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Shield size={16} />
              <span>Cloud Security</span>
            </button>

            <button
              onClick={() => setActiveTab("updater")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition cursor-pointer ${
                activeTab === "updater"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)] font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Settings size={16} />
              <span>Update Matrix</span>
            </button>
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile Avatar"
                    className="w-8 h-8 rounded-full border border-cyan-500/25"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    {user.displayName ? user.displayName.charAt(0) : "D"}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {user.displayName || "Developer Node"}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate font-mono">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/15 hover:bg-red-950/30 text-red-400 border border-red-500/15 rounded-xl text-xs font-medium transition cursor-pointer uppercase tracking-wider text-[10px]"
              >
                <LogOut size={12} />
                <span>Lock OS Console</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                  L
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">Local Node (Offline)</span>
                  <span className="text-[10px] text-slate-500 truncate font-mono">local@maxai.private</span>
                </div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5 flex flex-col gap-2">
                <p className="text-[9px] font-mono text-amber-400/90 leading-normal">
                  All memory is stored on this computer. Link Google Cloud to enable secure backups.
                </p>
                <button
                  onClick={handleLinkGoogleAccount}
                  disabled={linkingLoader}
                  className="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-[9px] font-bold font-sans transition flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider disabled:opacity-50 select-none"
                >
                  <Sparkles size={10} className="text-amber-400" />
                  <span>{linkingLoader ? "Linking..." : "Link Google Account"}</span>
                </button>
              </div>
              <button
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-950/25 hover:bg-slate-950/50 text-slate-400 border border-white/5 rounded-xl text-xs font-medium transition cursor-pointer uppercase tracking-wider text-[10px]"
              >
                <LogOut size={12} />
                <span>Lock OS Console</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 z-10 relative flex flex-col justify-between h-full">
        <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
          {/* HEADER BAR */}
          <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                ACTIVE PIPELINE CONFIGURATION
              </span>
              <h2 className="text-2xl font-light text-white tracking-tight mt-1">
                {activeTab === "pairing" && "Cryptographic Handshake & Pairing"}
                {activeTab === "mirror" && "Active Screen Mirroring Workspace"}
                {activeTab === "files" && "Android Secure Storage Explorer"}
                {activeTab === "automation" && "Automated Macro Protocols"}
                {activeTab === "terminal" && "Core Systems Console & ADB Bridge"}
                {activeTab === "security" && "Security Architecture & Cloud Sync"}
                {activeTab === "updater" && "Software Update Matrix & Repo Configuration"}
              </h2>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/50 border border-white/5 rounded-full text-[10px] font-mono text-slate-400">
                <span className="text-[9px]">Node Bridge Token:</span>
                <span className="text-white font-bold">{desktopBridgeToken ? `${desktopBridgeToken.substring(0, 8)}...` : "NONE"}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/50 border border-white/5 rounded-full text-[10px] font-mono">
                <div className={`w-2 h-2 rounded-full ${pairedDevice ? "bg-emerald-500 animate-pulse" : "bg-orange-500 animate-ping"}`} />
                <span className={pairedDevice ? "text-emerald-400 font-bold" : "text-orange-400"}>
                  {pairedDevice ? "NODE SYNCED" : "AWAITING SYNC"}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE VIEWS */}
          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === "pairing" && (
                <motion.div
                  key="pairing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1"
                >
                  {/* Left Side: QR Code Frame */}
                  <div className="border border-white/5 bg-slate-950/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40" />
                    
                    {pairedDevice === null ? (
                      <>
                        <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-2">
                          <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">SECURE LINK PROTOCOL</span>
                        </div>
                        <h3 className="text-lg font-light text-white mb-6">Scan Dynamic Cryptographic Handshake QR</h3>
                        
                        {/* Dynamic QR frame with subtle border pulse */}
                        <div className="relative p-6 bg-slate-950/80 rounded-2xl border border-cyan-500/25 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.03)]">
                          {qrCodeUrl ? (
                            <img src={qrCodeUrl} alt="Pairing Secure QR Token" className="w-48 h-48 rounded-lg" />
                          ) : (
                            <div className="w-48 h-48 flex items-center justify-center">
                              <RefreshCw className="animate-spin text-cyan-500" />
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                          Scan using the official Max-AI Android companion app to build a secure AES-256-GCM encrypted local network tunnel instantly.
                        </p>

                        <button
                          onClick={simulateScan}
                          disabled={isSimulatingScan}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center gap-2 cursor-pointer"
                        >
                          {isSimulatingScan ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Handshaking Node...</span>
                            </>
                          ) : (
                            <>
                              <QrCode size={14} />
                              <span>Simulate Mobile Scan</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 animate-pulse">
                          <Check size={32} />
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">Tunnel Connected</span>
                        <h3 className="text-xl font-light text-white mb-2">{pairedDevice.model}</h3>
                        <p className="text-xs font-mono text-slate-500 mb-6">Node Signature: {pairedDevice.id}</p>

                        <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl w-full max-w-xs text-left mb-6 space-y-2">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-500">Node ID:</span>
                            <span className="text-slate-300">{pairedDevice.id}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-500">Security Mode:</span>
                            <span className="text-cyan-400 font-bold">AES-256-GCM</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-500">Exchange Type:</span>
                            <span className="text-purple-400 font-bold">ECDH 25519</span>
                          </div>
                        </div>

                        <button
                          onClick={onDeviceDisconnected}
                          className="px-6 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                          Disconnect Secure Link
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Log Console */}
                  <div className="border border-white/5 bg-slate-950/10 rounded-3xl p-6 flex flex-col h-[400px] md:h-auto">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold text-slate-200">Secure Cryptographic Handshake Logs</span>
                      </div>
                      <button
                        onClick={() => setLogs([`[${new Date().toLocaleTimeString()}] Log cleared.`])}
                        className="text-[9px] font-mono text-slate-500 hover:text-slate-300 uppercase cursor-pointer"
                      >
                        Clear Log
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1.5 p-3 bg-black/45 rounded-2xl border border-white/5 scrollbar-thin">
                      {logs.map((log, i) => (
                        <div key={i} className="leading-relaxed border-l-2 border-cyan-500/30 pl-2">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "mirror" && (
                <motion.div
                  key="mirror"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1"
                >
                  {/* Left Column: Device Screen Mirror View */}
                  <div className="lg:col-span-7 flex justify-center items-center">
                    <div className="relative w-[280px] h-[550px] bg-black rounded-[48px] border-[8px] border-slate-900 shadow-2xl flex flex-col overflow-hidden relative">
                      {/* Speaker grill/Dynamic island */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                        <div className="w-10 h-1 bg-slate-800 rounded-full mb-1" />
                        <div className="w-2 h-2 bg-slate-800 rounded-full ml-1 mb-1" />
                      </div>

                      {/* Phone Screen Contents */}
                      <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 text-white p-5 pt-10 relative z-20">
                        {/* Custom status bar */}
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pb-3 border-b border-white/5 mb-4">
                          <span className="font-bold">12:45 UTC</span>
                          <div className="flex items-center gap-1.5">
                            <Wifi size={10} className="text-cyan-400" />
                            <span>94%</span>
                            <Lock size={8} className="text-purple-400" />
                          </div>
                        </div>

                        {/* Screens contents switcher */}
                        {activeScreen === "launcher" && (
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="grid grid-cols-3 gap-4 text-center mt-4">
                              <button
                                onClick={() => setActiveScreen("social")}
                                className="flex flex-col items-center gap-2 cursor-pointer group"
                              >
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/25 rounded-2xl text-blue-400 transition shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                  <Share2 size={20} />
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">Social AI</span>
                              </button>

                              <button
                                onClick={() => setActiveScreen("camera")}
                                className="flex flex-col items-center gap-2 cursor-pointer group"
                              >
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/25 rounded-2xl text-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                  <Camera size={20} />
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">Viewfinder</span>
                              </button>

                              <button
                                onClick={() => setActiveScreen("editor")}
                                className="flex flex-col items-center gap-2 cursor-pointer group"
                              >
                                <div className="p-3 bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/25 rounded-2xl text-purple-400 transition shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                  <Scissors size={20} />
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">Editor</span>
                              </button>

                              <button
                                onClick={() => setActiveScreen("settings")}
                                className="flex flex-col items-center gap-2 cursor-pointer group"
                              >
                                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/25 rounded-2xl text-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                  <Settings size={20} />
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">ADB Setup</span>
                              </button>
                            </div>

                            <div className="flex flex-col items-center pb-2">
                              <span className="text-[9px] font-mono text-slate-600 uppercase">Max-AI Mobile Client v4.0</span>
                            </div>
                          </div>
                        )}

                        {activeScreen === "social" && (
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">Social AI Streams</span>
                                <button
                                  onClick={() => setActiveScreen("launcher")}
                                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                              <div className="p-2 bg-slate-900/60 border border-white/5 rounded-xl text-[10px] font-mono">
                                <span className="text-blue-400 font-bold">@max_ai_dev:</span>
                                <p className="text-slate-300 mt-0.5">Handshake key exchange complete. Tunnel active.</p>
                              </div>
                              <div className="p-2 bg-slate-900/60 border border-white/5 rounded-xl text-[10px] font-mono">
                                <span className="text-cyan-400 font-bold">@systems:</span>
                                <p className="text-slate-300 mt-0.5">ADB Port 5555 syncing video frame streams.</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Broadcast payload..."
                                className="flex-1 px-2 py-1.5 bg-black border border-white/5 rounded-lg text-[9px] font-mono text-white focus:outline-none focus:border-cyan-500"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    addLog(`Broadcasted clip: ${e.currentTarget.value}`);
                                    e.currentTarget.value = "";
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {activeScreen === "camera" && (
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Active Viewfinder</span>
                              <button
                                onClick={() => setActiveScreen("launcher")}
                                className="text-[9px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
                              >
                                Close
                              </button>
                            </div>
                            <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-slate-950/80 overflow-hidden flex flex-col items-center justify-center relative my-4">
                              <Camera className="text-emerald-500/25 animate-pulse mb-2" size={28} />
                              <span className="text-[9px] font-mono text-emerald-500/45 uppercase font-bold">Procedural Grid Active</span>
                            </div>
                            <div className="flex justify-around items-center">
                              <button
                                onClick={() => {
                                  setCameraActive(!cameraActive);
                                  addLog(`Toggled Camera active status: ${!cameraActive}`);
                                }}
                                className={`p-2.5 rounded-full transition cursor-pointer ${cameraActive ? "bg-emerald-500 text-white" : "bg-slate-900 text-slate-400 border border-white/5"}`}
                              >
                                <Camera size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setMicActive(!micActive);
                                  addLog(`Toggled Microphone active status: ${!micActive}`);
                                }}
                                className={`p-2.5 rounded-full transition cursor-pointer ${micActive ? "bg-cyan-500 text-white" : "bg-slate-900 text-slate-400 border border-white/5"}`}
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {activeScreen === "editor" && (
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase font-sans">Active Video Editor</span>
                                <button
                                  onClick={() => setActiveScreen("launcher")}
                                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                              <div className="p-3 bg-slate-950/80 border border-white/5 rounded-2xl mb-3 font-mono text-[9px] space-y-2">
                                <div>
                                  <span className="text-slate-500">Caption Tag:</span>
                                  <input
                                    type="text"
                                    value={captionText}
                                    onChange={(e) => setCaptionText(e.target.value)}
                                    className="w-full bg-black border border-white/5 px-2 py-1 rounded text-purple-300 focus:outline-none focus:border-purple-500 mt-1"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-slate-500">Trim Start:</span>
                                    <input
                                      type="number"
                                      value={trimStart}
                                      onChange={(e) => setTrimStart(Number(e.target.value))}
                                      className="w-full bg-black border border-white/5 px-2 py-1 rounded text-white focus:outline-none focus:border-purple-500 mt-1"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Trim End:</span>
                                    <input
                                      type="number"
                                      value={trimEnd}
                                      onChange={(e) => setTrimEnd(Number(e.target.value))}
                                      className="w-full bg-black border border-white/5 px-2 py-1 rounded text-white focus:outline-none focus:border-purple-500 mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                addLog(`Applied video sequence trim settings: trim range ${trimStart}% - ${trimEnd}%, caption: "${captionText}"`);
                              }}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                            >
                              Apply Video Trim
                            </button>
                          </div>
                        )}

                        {activeScreen === "settings" && (
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">ADB Debug Toggles</span>
                                <button
                                  onClick={() => setActiveScreen("launcher")}
                                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                              <div className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[9px] font-mono space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300">USB Debugging:</span>
                                  <span className="text-emerald-400 font-bold">ACTIVE</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300">Wireless ADB:</span>
                                  <span className="text-emerald-400 font-bold">PORT 5555</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300">Local Bridge Link:</span>
                                  <span className="text-cyan-400 font-bold">CONNECTED</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-800 rounded-full z-30" />
                    </div>
                  </div>

                  {/* Right Column: Control Buttons Matrix */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-6">
                    <div className="border border-white/5 bg-slate-950/20 rounded-3xl p-6 space-y-4">
                      <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-2 w-max">
                        <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">BRIDGE CONTROLLER</span>
                      </div>
                      <h3 className="text-lg font-light text-white">Interactive Workspace Controls</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Trigger active workspace hotspot operations on the paired device using simulated click vectors or local python controller scripts.
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => {
                            addLog("Macro triggered: Simulate Screen Tap at Center (X: 0.5, Y: 0.5)");
                          }}
                          className="px-4 py-3 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2"
                        >
                          <MousePointerClick size={14} className="text-cyan-400" />
                          <span>Simulate Screen Tap</span>
                        </button>
                        <button
                          onClick={() => {
                            addLog("Macro triggered: Swiped Up on Mobile Screen.");
                          }}
                          className="px-4 py-3 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2"
                        >
                          <Sliders size={14} className="text-cyan-400" />
                          <span>Slide Up Screen</span>
                        </button>
                        <button
                          onClick={() => {
                            setRecordingActive(!recordingActive);
                            addLog(`Toggled Screen Recording active: ${!recordingActive}`);
                          }}
                          className={`px-4 py-3 border text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${recordingActive ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "bg-slate-950 hover:bg-slate-900 border-white/5 text-slate-200"}`}
                        >
                          <Video size={14} className={recordingActive ? "text-red-400" : "text-cyan-400"} />
                          <span>{recordingActive ? "Stop Recording" : "Record Screen Frame"}</span>
                        </button>
                        <button
                          onClick={() => {
                            addLog("Triggered Remote Screenshot capture.");
                            setActiveScreen("settings");
                          }}
                          className="px-4 py-3 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2"
                        >
                          <Camera size={14} className="text-cyan-400" />
                          <span>Capture Viewport</span>
                        </button>
                      </div>
                    </div>

                    <div className="border border-white/5 bg-slate-950/10 rounded-3xl p-5 flex flex-col h-[180px]">
                      <span className="text-[10px] font-mono text-slate-500 uppercase mb-2">Remote Action Outputs</span>
                      <div className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-500 space-y-1 bg-black/45 rounded-xl border border-white/5 p-3">
                        {logs.slice(-4).map((log, i) => (
                          <div key={i} className="truncate">{log}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "files" && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 animate-fadeIn"
                >
                  {/* Left: Files List Explorer */}
                  <div className="lg:col-span-2 border border-white/5 bg-slate-950/20 rounded-3xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <FolderOpen size={16} className="text-cyan-400" />
                        <h3 className="text-lg font-light text-white">Internal Storage</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{androidFiles.length} items found</span>
                    </div>

                    {/* Files Table layout */}
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase">
                            <th className="pb-3 pl-2">Name</th>
                            <th className="pb-3">Path</th>
                            <th className="pb-3">Size</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3 pr-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {androidFiles.map((file, idx) => (
                            <tr
                              key={idx}
                              onClick={() => setSelectedFile(file.name)}
                              className={`group hover:bg-white/2 bg-transparent transition cursor-pointer ${selectedFile === file.name ? "bg-cyan-500/5 text-cyan-200" : ""}`}
                            >
                              <td className="py-3 pl-2 font-medium flex items-center gap-2 truncate max-w-[150px]">
                                <FileText size={14} className="text-cyan-500/60" />
                                <span>{file.name}</span>
                              </td>
                              <td className="py-3 font-mono text-[10px] text-slate-500 max-w-[150px] truncate">{file.path}</td>
                              <td className="py-3 text-slate-400">{file.size}</td>
                              <td className="py-3 text-slate-500">{file.date}</td>
                              <td className="py-3 pr-2 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFile(file.name);
                                  }}
                                  className="p-1.5 rounded bg-red-950/20 text-red-400 hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Upload Panel & Selected File details */}
                  <div className="flex flex-col gap-6">
                    <div className="border border-white/5 bg-slate-950/10 rounded-3xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-4 w-max">
                          <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">UPLOAD TARGET</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-2">Simulate File Upload</h4>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                          Push mock media blocks or credentials package assets to the device download folders directory.
                        </p>

                        <form onSubmit={handleUploadFileForm} className="space-y-4 font-mono text-[10px]">
                          <div>
                            <span className="text-slate-500 uppercase">File Name:</span>
                            <input
                              name="fileName"
                              type="text"
                              required
                              placeholder="e.g. My_Project.mp4"
                              className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs mt-1 text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase">File Size:</span>
                            <input
                              name="fileSize"
                              type="text"
                              placeholder="e.g. 15.4 MB"
                              className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs mt-1 text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(6,182,212,0.1)] cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Upload size={13} />
                            <span>Upload to /Download</span>
                          </button>
                        </form>
                      </div>
                    </div>

                    {selectedFile && (
                      <div className="border border-white/5 bg-slate-950/20 rounded-3xl p-5 font-mono text-[10px] space-y-3">
                        <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">File Metadata Context</span>
                        <div className="space-y-1.5 text-slate-400">
                          <div>Name: <span className="text-white font-bold">{selectedFile}</span></div>
                          <div>Path: <span className="text-slate-300">/storage/emulated/0/...</span></div>
                          <div>Checksum: <span className="text-purple-400">MD5:f28d82f2c9b...</span></div>
                          <div>Encryption: <span className="text-emerald-400 font-bold">SHA-256 Block Locked</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "automation" && (
                <motion.div
                  key="automation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1"
                >
                  {/* Left: Macros list */}
                  <div className="border border-white/5 bg-slate-950/20 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-4 w-max">
                        <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase font-sans">MACRO ENGINE</span>
                      </div>
                      <h3 className="text-lg font-light text-white mb-2">Automated Execution Pipeline</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        Sequence custom triggers and direct remote click hotpaths onto the connected node system for background automation tasks.
                      </p>

                      <div className="space-y-3.5 pt-2">
                        {workflowSteps.map((step, idx) => (
                          <div
                            key={step.id}
                            className={`p-3.5 border rounded-2xl flex justify-between items-center transition ${
                              activeWorkflowStep === idx
                                ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                : "bg-slate-950/60 border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center ${activeWorkflowStep === idx ? "bg-cyan-400 text-slate-950 animate-pulse" : "bg-slate-900 border border-white/5 text-slate-400"}`}>
                                {idx + 1}
                              </span>
                              <div className="flex flex-col text-xs">
                                <span className="font-bold text-white">{step.action}</span>
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5">{step.param}</span>
                              </div>
                            </div>
                            {activeWorkflowStep === idx && (
                              <div className="text-[9px] font-mono font-bold text-cyan-400 animate-pulse">EXECUTING...</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={runWorkflow}
                      disabled={isWorkflowRunning}
                      className="w-full mt-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isWorkflowRunning ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Executing Macro Pipeline...</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} />
                          <span>Trigger Automated Pipeline</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right: Macro details */}
                  <div className="border border-white/5 bg-slate-950/10 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-4 w-max">
                        <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase font-sans">STATE TRACER</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-2">Local Desktop Bridge Automation</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        Max-AI matches clipboard events and screen states dynamically, forwarding secure API payloads to the desktop loop.
                      </p>

                      <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl text-[11px] font-mono space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Local Bridge Server:</span>
                          <span className="text-emerald-400 font-bold">ONLINE (PORT 3002)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Active Workflow:</span>
                          <span className="text-white font-bold">Holographic Handshake</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Security Cipher:</span>
                          <span className="text-cyan-400">AES-256 CBC Block</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "terminal" && (
                <motion.div
                  key="terminal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col flex-1"
                >
                  <div className="border border-white/5 bg-slate-950/20 rounded-3xl p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold text-slate-200 font-mono">Systems Terminal Console</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">PORT: 3002</span>
                    </div>

                    {/* Monospace Output */}
                    <div className="flex-1 min-h-[300px] overflow-y-auto font-mono text-[10px] text-cyan-400 space-y-1.5 p-4 bg-black rounded-2xl border border-white/5 mb-4 scrollbar-thin max-h-[350px]">
                      {logs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed">
                          <span className="text-slate-600 mr-2">$</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>

                    {/* Inputs */}
                    <form onSubmit={handleSendCommand} className="flex gap-2">
                      <input
                        type="text"
                        value={inputCommand}
                        onChange={(e) => setInputCommand(e.target.value)}
                        placeholder="Type system/ADB shell commands here (e.g. status, screenshot, adb devices)..."
                        className="flex-1 px-4 py-3 bg-black border border-white/5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        className="px-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition cursor-pointer flex items-center justify-center"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1"
                >
                  {/* Left: User credentials sync card */}
                  <div className="border border-white/5 bg-slate-950/20 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-4 w-max">
                        <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">STORAGE INFRASTRUCTURE</span>
                      </div>
                      <h3 className="text-lg font-light text-white mb-2">Data Synchronization Hub</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        Monitor where your conversational memory, dashboard preferences, and system parameters are saved and managed.
                      </p>

                      <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl space-y-3 font-mono text-[10px] mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Mode:</span>
                          <span className={user ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                            {user ? "Cloud Synchronized" : "Local-Only / Offline"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Active Node:</span>
                          <span className="text-white font-bold truncate max-w-[150px]">{user?.email || "guest@maxai.local"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Storage Target:</span>
                          <span className="text-cyan-400">
                            {user ? "Firestore (cloud.google.com)" : "memories.json (Local File)"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Encryption Layer:</span>
                          <span className="text-cyan-400">AES-256-GCM Secure Salt</span>
                        </div>
                      </div>

                      {!user && (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex items-start gap-2.5">
                            <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-300 leading-normal">
                              You are currently in Offline Mode. Memories are fully private and saved on this laptop. Sign in to back them up securely to Google Cloud and merge your local history.
                            </p>
                          </div>
                          <button
                            onClick={handleLinkGoogleAccount}
                            disabled={linkingLoader}
                            className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50 select-none"
                          >
                            <Sparkles size={12} className="text-amber-400" />
                            <span>{linkingLoader ? "Connecting loopback..." : "Link Google Account & Sync"}</span>
                          </button>
                        </div>
                      )}

                      {user && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-3">
                          <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Cloud Synchronizer Active</h4>
                            <p className="text-[11px] text-slate-300 leading-normal mt-1">
                              All local and cloud records are perfectly matched and safely stored in your private Firestore sandbox.
                            </p>
                          </div>
                        </div>
                      )}

                      {(migrationStatus || migrationError) && (
                        <div className={`mt-4 p-3.5 rounded-2xl border text-[10px] font-mono leading-normal ${migrationError ? "bg-red-950/20 border-red-500/20 text-red-400" : "bg-cyan-950/20 border-cyan-500/20 text-cyan-400"}`}>
                          {migrationError ? `[ERROR] ${migrationError}` : `[STATUS] ${migrationStatus}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Handshake cypher details */}
                  <div className="border border-white/5 bg-slate-950/10 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-4 w-max">
                        <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">ENCRYPTION SCHEME</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-2">Cryptographic Pipeline Settings</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        Secure tunnels negotiate AES keys utilizing prime number modular curves, safeguarding macro streams on ADB.
                      </p>

                      <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl space-y-2.5 font-mono text-[10px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Cipher:</span>
                          <span className="text-emerald-400 font-bold">AES-256-GCM (128-bit Tag)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cert Hash:</span>
                          <span className="text-slate-300">SHA-256 fingerprint active</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Local Host:</span>
                          <span className="text-cyan-400">0.0.0.0 (Port 3000)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "updater" && (
                <motion.div
                  key="updater"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1"
                >
                  {/* Left: Repos configurations */}
                  <div className="border border-white/5 bg-slate-950/20 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-4 w-max">
                        <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">UPDATER CONFIG</span>
                      </div>
                      <h3 className="text-lg font-light text-white mb-2">GitHub Autoupdate Matrix</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6 font-sans">
                        Setup the GitHub repository settings to test connections, fetch releases and trigger updates for the local application codebase.
                      </p>

                      <div className="space-y-4 font-mono text-[10px]">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-500">Git Owner:</span>
                            <input
                              type="text"
                              value={gitOwner}
                              onChange={(e) => setGitOwner(e.target.value)}
                              className="w-full bg-slate-950 border border-white/5 px-3 py-2 rounded-xl text-xs mt-1 text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <span className="text-slate-500">Repository Name:</span>
                            <input
                              type="text"
                              value={gitRepo}
                              onChange={(e) => setGitRepo(e.target.value)}
                              className="w-full bg-slate-950 border border-white/5 px-3 py-2 rounded-xl text-xs mt-1 text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-500">Personal Access Token (PAT):</span>
                          <input
                            type="password"
                            value={gitToken}
                            onChange={(e) => setGitToken(e.target.value)}
                            placeholder="Encrypted OAuth Token..."
                            className="w-full bg-slate-950 border border-white/5 px-3 py-2 rounded-xl text-xs mt-1 text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveUpdaterConfig}
                            disabled={isSavingConfig}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/5 rounded-xl transition cursor-pointer text-center"
                          >
                            {isSavingConfig ? "Saving..." : "Save Config"}
                          </button>
                          <button
                            onClick={handleTestConnection}
                            disabled={isTestingConnection}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/5 rounded-xl transition cursor-pointer text-center"
                          >
                            {isTestingConnection ? "Testing..." : "Test Connection"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Connection results & manual checks */}
                  <div className="border border-white/5 bg-slate-950/10 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="p-2 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 mb-2 w-max">
                        <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">MATRIX ACTION</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">Validate Updates Release Node</h4>
                      
                      {testResult && (
                        <div className={`p-4 rounded-2xl border text-[10px] font-mono leading-relaxed ${testResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
                          <div className="font-bold uppercase mb-1">{testResult.success ? "Connection Test Passed" : "Connection Test Failed"}</div>
                          <p>{testResult.message || testResult.error}</p>
                        </div>
                      )}

                      <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl text-[10px] font-mono space-y-2 text-slate-400">
                        <div className="flex justify-between">
                          <span>Last Checked Status:</span>
                          <span className="text-white">{lastChecked}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Build Version:</span>
                          <span className="text-cyan-400 font-bold">v1.0.12 (Premium Edition)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckUpdates}
                      disabled={isCheckingUpdate}
                      className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition shadow-[0_0_15px_rgba(6,182,212,0.1)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCheckingUpdate ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Checking Releases...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={13} />
                          <span>Check For Release Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FOOTER ACCENTS */}
        <footer className="mt-8 border-t border-white/5 pt-4 text-center text-[10px] font-mono text-slate-600 max-w-5xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} Max-AI Secure Systems Node. ALL CHANNELS ACTIVE.</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase text-[9px] tracking-wider text-slate-500">Encryption Active: AES-256 + ECDH 25519</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
