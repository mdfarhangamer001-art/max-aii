// Uncaught exception and unhandled rejection hooks to prevent immediate command prompt close on Windows errors
process.on("uncaughtException", (err) => {
  console.error("\n[CRITICAL UNCAUGHT EXCEPTION]:", err);
  console.log("\nThis window will remain open for 60 seconds to allow you to inspect the error.");
  setTimeout(() => {
    process.exit(1);
  }, 60000);
});

process.on("unhandledRejection", (reason) => {
  console.error("\n[CRITICAL UNHANDLED REJECTION]:", reason);
  console.log("\nThis window will remain open for 60 seconds to allow you to inspect the error.");
  setTimeout(() => {
    process.exit(1);
  }, 60000);
});

import express from "express";
import http from "http";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { fileURLToPath } from "url";

// Robust ESM/CJS detection for file paths to support both dev execution (tsx/ESM) and prod bundling (esbuild/CJS)
const isESM = typeof import.meta !== "undefined" && typeof import.meta.url !== "undefined";

let resolvedFilename = "";
let resolvedDirname = "";
try {
  // Use eval to safely access CommonJS module-wrapper variables if available, bypassing block TDZ checks
  resolvedFilename = eval("__filename");
  resolvedDirname = eval("__dirname");
} catch (e) {
  // Not in a CommonJS wrapper environment
}

const __filename = isESM ? fileURLToPath(import.meta.url) : resolvedFilename;
const __dirname = isESM ? path.dirname(__filename) : resolvedDirname;
import { WebSocketServer } from "ws";
import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";
import { exec } from "child_process";
import os from "os";
import { 
  loadMemories, 
  saveMemories, 
  formatSystemInstructionsWithMemories, 
  processConversationSlice 
} from "./server_memory";
import { Memory } from "./src/lib/memoryTypes";
import { setupLicensingRoutes } from "./server_licensing";

dotenv.config();

import crypto from "crypto";

function getDesktopBridgeToken(): string {
  const tokenFile = "max-token.txt";
  const oldTokenFile = "marya-token.txt";
  const oldOldTokenFile = "tehzeeb-token.txt";
  try {
    if (fsSync.existsSync(tokenFile)) {
      return fsSync.readFileSync(tokenFile, "utf8").trim();
    }
    if (fsSync.existsSync(oldTokenFile)) {
      const oldToken = fsSync.readFileSync(oldTokenFile, "utf8").trim();
      fsSync.writeFileSync(tokenFile, oldToken, "utf8");
      return oldToken;
    }
    if (fsSync.existsSync(oldOldTokenFile)) {
      const oldToken = fsSync.readFileSync(oldOldTokenFile, "utf8").trim();
      fsSync.writeFileSync(tokenFile, oldToken, "utf8");
      return oldToken;
    }
    const token = crypto.randomBytes(32).toString("hex");
    fsSync.writeFileSync(tokenFile, token, "utf8");
    return token;
  } catch (err) {
    return crypto.randomBytes(32).toString("hex");
  }
}
const desktopBridgeToken = getDesktopBridgeToken();

const isPkg = typeof (process as any).pkg !== "undefined";
if (isPkg) {
  process.env.NODE_ENV = "production";
}

export function getWritablePath(filename: string): string {
  if (process.env.ELECTRON_RUNNING === "true" || isPkg) {
    const appData = process.env.APPDATA || (process.platform === "darwin" ? path.join(os.homedir(), "Library", "Application Support") : path.join(os.homedir(), ".config"));
    const targetDir = path.join(appData, "Nova-AI");
    if (!fsSync.existsSync(targetDir)) {
      try {
        fsSync.mkdirSync(targetDir, { recursive: true });
      } catch (err) {
        console.error("Failed to create writable dir, falling back to process.cwd():", err);
        return path.join(process.cwd(), filename);
      }
    }
    const destFile = path.join(targetDir, filename);
    if (!fsSync.existsSync(destFile)) {
      const options = [
        path.join(process.cwd(), filename),
        path.join(__dirname, filename),
        path.join(__dirname, "..", filename)
      ];
      for (const opt of options) {
        if (fsSync.existsSync(opt)) {
          try {
            fsSync.copyFileSync(opt, destFile);
            console.log(`[Storage] Copied fallback ${filename} from ${opt} to ${destFile}`);
            break;
          } catch (copyErr) {
            console.error(`[Storage] Error copying fallback for ${filename}:`, copyErr);
          }
        }
      }
    }
    return destFile;
  }
  return path.join(process.cwd(), filename);
}

// Keep a simple log system for the bridge status so the frontend shows it correctly!
const bridgeLogs: any[] = [];
function addBridgeLog(text: string, type: string = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const formatted = `[${timestamp}] [${type.toUpperCase()}] ${text}`;
  console.log(`[Bridge] ${formatted}`);
  bridgeLogs.push({
    id: String(Date.now()) + Math.random().toString().substring(2, 6),
    text: formatted,
    type: type.toLowerCase()
  });
  if (bridgeLogs.length > 50) {
    bridgeLogs.shift();
  }
}

// Escape helper for PowerShell SendKeys special characters
function escapeSendKeys(text: string): string {
  // Characters that need to be escaped: + ^ % ~ { } ( ) [ ]
  const specials = /[+^%~{}()\[\]]/g;
  return text.replace(specials, (match) => `{${match}}`);
}

// Run a PowerShell command safely and return output
function runPowerShell(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Execute with bypass execution policy and UTF8 encoding output so special symbols render correctly
    const escapedCmd = cmd.replace(/"/g, '\\"');
    const fullCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${escapedCmd}"`;
    exec(fullCmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function startDesktopBridge() {
  const bridgeApp = express();
  
  // Enable CORS with secure restrictions
  bridgeApp.use((req, res, next) => {
    const origin = req.headers.origin || "";
    const isAllowed = !origin || 
                      origin.startsWith("http://localhost:") || 
                      origin.startsWith("http://127.0.0.1:") || 
                      /^(https:\/\/ais-(dev|pre)-.*\.run\.app)$/.test(origin) ||
                      origin.includes("google.com") ||
                      origin.includes("aistudio");

    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Bridge-Token, X-Myraa-Token, X-Nova-Token");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Token Verification Middleware for Port 3002 Desktop Bridge
  bridgeApp.use((req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    const authHeader = req.headers["authorization"] || req.headers["x-bridge-token"] || req.headers["x-myraa-token"];
    let token = "";
    if (authHeader) {
      if (typeof authHeader === "string") {
        token = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader.trim();
      }
    } else if (req.query && req.query.token) {
      token = String(req.query.token);
    }
    
    if (token === desktopBridgeToken) {
      next();
    } else {
      console.warn(`[Port 3002 Bridge Security] Blocked unauthorized request from origin: ${req.headers.origin || "Unknown"}`);
      res.status(401).json({ success: false, error: "Unauthorized: Invalid or missing Desktop Bridge token." });
    }
  });
  
  bridgeApp.use(express.json({ limit: "15mb" }));
  
  // GET status
  bridgeApp.get(["/api/status", "/api/status/"], (req, res) => {
    res.json({
      connected: true,
      pyautogui: true, // Tell frontend we are fully loaded!
      pillow: true, // Tell frontend screenshots are fully enabled!
      os: process.platform === "win32" ? "Windows" : process.platform === "darwin" ? "Darwin" : "Linux",
      os_release: os.release(),
      architecture: os.arch(),
      hostname: os.hostname(),
      logs: bridgeLogs,
      timestamp: Date.now() / 1000
    });
  });
  
  // POST action
  bridgeApp.post(["/api/action", "/api/action/"], async (req, res) => {
    const { type: actionType, args = {} } = req.body;
    if (!actionType) {
      return res.status(400).json({ error: "Missing 'type' parameter in command envelope." });
    }
    
    addBridgeLog(`Received instruction directive: ${actionType}`, "action");
    const isWin = process.platform === "win32";
    
    try {
      let result: any = null;
      
      if (actionType === "open_app") {
        const appName = (args.name || "").toLowerCase();
        const url = args.url || "";
        
        if (url) {
          addBridgeLog(`Opening web link in default browser: ${url}`, "info");
          const openCmd = isWin 
            ? `start "" "${url}"` 
            : process.platform === "darwin" 
              ? `open "${url}"` 
              : `xdg-open "${url}"`;
          exec(openCmd);
          result = `Successfully launched browser redirection for ${url}`;
        } else if (appName) {
          addBridgeLog(`Attempting to launch app shortcut: ${appName}`, "info");
          const appsMap: Record<string, string> = {
            "notepad": "notepad.exe",
            "calculator": "calc.exe",
            "calc": "calc.exe",
            "paint": "mspaint.exe",
            "cmd": "cmd.exe",
            "terminal": "wt.exe",
            "explorer": "explorer.exe",
            "chrome": "chrome.exe",
            "edge": "msedge.exe"
          };
          const exeName = appsMap[appName] || appName;
          const runCmd = isWin 
            ? `start "" "${exeName}"` 
            : process.platform === "darwin" 
              ? `open -a "${exeName}"` 
              : `${exeName}`;
          exec(runCmd);
          result = `Dispatched launcher: ${exeName}`;
        } else {
          return res.status(400).json({ success: false, error: "Omitted mandatory 'name' or 'url' parameters." });
        }
      }
      
      else if (actionType === "type_text") {
        const text = args.text || "";
        if (!text) {
          return res.status(400).json({ success: false, error: "Missing 'text' key inside typed payload parameters." });
        }
        
        if (isWin) {
          addBridgeLog(`Simulating keystrokes typing: '${text}'`, "info");
          const escaped = escapeSendKeys(text);
          const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escaped.replace(/'/g, "''")}')`;
          await runPowerShell(psCmd);
          result = `Successfully typed text segment of length ${text.length}.`;
        } else {
          if (process.platform === "darwin") {
            const appleScript = `osascript -e 'tell application "System Events" to keystroke "${text.replace(/"/g, '\\"')}"'`;
            exec(appleScript);
            result = `macOS typed: ${text}`;
          } else {
            result = "Typing text is only supported natively on Windows and macOS.";
          }
        }
      }
      
      else if (actionType === "press_key") {
        const key = args.key || "";
        const modifiers: string[] = args.modifiers || [];
        
        if (!key) {
          return res.status(400).json({ success: false, error: "Omitted mandatory target 'key' to press." });
        }
        
        if (isWin) {
          addBridgeLog(`Simulating keypress: key='${key}', modifiers=${JSON.stringify(modifiers)}`, "info");
          let modStr = "";
          modifiers.forEach(mod => {
            const m = mod.toLowerCase();
            if (m === "ctrl" || m === "control") modStr += "^";
            else if (m === "alt") modStr += "%";
            else if (m === "shift") modStr += "+";
          });
          
          const keyMap: Record<string, string> = {
            "enter": "{ENTER}",
            "backspace": "{BACKSPACE}",
            "tab": "{TAB}",
            "esc": "{ESC}",
            "escape": "{ESC}",
            "up": "{UP}",
            "down": "{DOWN}",
            "left": "{LEFT}",
            "right": "{RIGHT}",
            "delete": "{DEL}",
            "del": "{DEL}",
            "space": " ",
            "home": "{HOME}",
            "end": "{END}",
            "pgup": "{PGUP}",
            "pgdn": "{PGDN}",
            "insert": "{INS}"
          };
          
          const mappedKey = keyMap[key.toLowerCase()] || key;
          const finalSequence = modStr ? `${modStr}(${mappedKey})` : mappedKey;
          const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${finalSequence.replace(/'/g, "''")}')`;
          await runPowerShell(psCmd);
          result = `Successfully pressed key sequence: ${finalSequence}`;
        } else {
          result = "Keypress simulation is only supported on Windows.";
        }
      }
      
      else if (actionType === "click") {
        const x = args.x;
        const y = args.y;
        const double = args.double || false;
        const button = args.button || "left";
        
        if (isWin) {
          addBridgeLog(`Simulating mouse click at (${x ?? 'current'}, ${y ?? 'current'}) (double=${double}, button=${button})`, "info");
          let psCmd = `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; `;
          if (x !== undefined && y !== undefined) {
            psCmd += `[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y}); `;
          }
          
          let downFlag = 0x02;
          let upFlag = 0x04;
          if (button === "right") {
            downFlag = 0x08;
            upFlag = 0x10;
          } else if (button === "middle") {
            downFlag = 0x20;
            upFlag = 0x40;
          }
          
          psCmd += `
            $sig = '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int buttons, int extraInfo);';
            $api = Add-Type -MemberDefinition $sig -Name "WinMouseClick" -Namespace "Win32" -PassThru;
          `;
          
          if (double) {
            psCmd += `
              $api::mouse_event(${downFlag}, 0, 0, 0, 0);
              $api::mouse_event(${upFlag}, 0, 0, 0, 0);
              Start-Sleep -Milliseconds 100;
              $api::mouse_event(${downFlag}, 0, 0, 0, 0);
              $api::mouse_event(${upFlag}, 0, 0, 0, 0);
            `;
          } else {
            psCmd += `
              $api::mouse_event(${downFlag}, 0, 0, 0, 0);
              $api::mouse_event(${upFlag}, 0, 0, 0, 0);
            `;
          }
          
          await runPowerShell(psCmd);
          result = `Clicked mouse successfully at (${x ?? 'current'}, ${y ?? 'current'}).`;
        } else {
          result = "Mouse click simulation is only supported on Windows.";
        }
      }
      
      else if (actionType === "mouse_move") {
        const x = args.x;
        const y = args.y;
        if (x === undefined || y === undefined) {
          return res.status(400).json({ success: false, error: "Coordinates 'x' and 'y' are required." });
        }
        
        if (isWin) {
          addBridgeLog(`Moving mouse cursor to position (${x}, ${y})`, "info");
          const psCmd = `
            Add-Type -AssemblyName System.Windows.Forms;
            Add-Type -AssemblyName System.Drawing;
            [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y});
          `;
          await runPowerShell(psCmd);
          result = `Successfully moved mouse cursor coordinates to (${x}, ${y}).`;
        } else {
          result = "Mouse move simulation is only supported on Windows.";
        }
      }
      
      else if (actionType === "scroll") {
        const amount = args.amount || -200;
        if (isWin) {
          addBridgeLog(`Simulating vertical scrolling displacement: ${amount}`, "info");
          const psCmd = `
            $sig = '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int buttons, int extraInfo);';
            $api = Add-Type -MemberDefinition $sig -Name "WinMouseScroll" -Namespace "Win32" -PassThru;
            $api::mouse_event(0x0800, 0, 0, ${amount}, 0);
          `;
          await runPowerShell(psCmd);
          result = `Dispatched scroll vertical tick: ${amount}`;
        } else {
          result = "Mouse scrolling is only supported on Windows.";
        }
      }
      
      else if (actionType === "screenshot") {
        addBridgeLog("Generating live desktop visual screen grab...", "info");
        if (isWin) {
          const psCmd = `
            Add-Type -AssemblyName System.Windows.Forms;
            Add-Type -AssemblyName System.Drawing;
            $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
            $bmp = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height;
            $graphics = [System.Drawing.Graphics]::FromImage($bmp);
            $graphics.CopyFromScreen($screen.X, $screen.Y, 0, 0, $bmp.Size);
            $ms = New-Object System.IO.MemoryStream;
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg);
            $bytes = $ms.ToArray();
            [Convert]::ToBase64String($bytes);
          `;
          const b64 = await runPowerShell(psCmd);
          const cleanedB64 = b64.trim().replace(/[\r\n]/g, "");
          result = {
            screenshot: cleanedB64,
            format: "image/jpeg",
            dimensions: [1920, 1080]
          };
          addBridgeLog("Visual screen capture encoded and streamed successfully.", "success");
        } else {
          result = "Screenshot grab is only supported on Windows.";
        }
      }
      
      else if (actionType === "media_control") {
        const cmd = (args.command || "").toLowerCase();
        if (!cmd) {
          return res.status(400).json({ success: false, error: "Omitted 'command' parameter inside media request." });
        }
        
        if (isWin) {
          addBridgeLog(`Triggering media key macro: ${cmd}`, "info");
          const mediaMap: Record<string, string> = {
            "volumeup": "{VOLUME_UP}",
            "volumedown": "{VOLUME_DOWN}",
            "volumemute": "{VOLUME_MUTE}",
            "nexttrack": "{MEDIA_NEXT_TRACK}",
            "prevtrack": "{MEDIA_PREV_TRACK}",
            "playpause": "{MEDIA_PLAY_PAUSE}"
          };
          const mappedKey = mediaMap[cmd];
          if (mappedKey) {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${mappedKey}')`;
            await runPowerShell(psCmd);
            result = `Simulated media key: ${cmd}`;
          } else {
            result = `Unsupported media control command: ${cmd}`;
          }
        } else {
          result = "Media control is only supported on Windows.";
        }
      }
      
      else if (actionType === "file_control") {
        const subAction = args.action;
        const targetPath = args.path ? path.resolve(args.path.replace(/^~/, os.homedir())) : "";
        const destPath = args.destination ? path.resolve(args.destination.replace(/^~/, os.homedir())) : "";
        const content = args.content || "";
        const query = args.query || "";

        addBridgeLog(`Executing file operation: ${subAction} on path: ${targetPath}`, "info");

        if (subAction === "create_file") {
          if (!targetPath) throw new Error("Path is required to create a file.");
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.writeFile(targetPath, content, "utf8");
          result = `Successfully created file at ${targetPath}.`;
        } 
        else if (subAction === "create_folder") {
          if (!targetPath) throw new Error("Path is required to create a folder.");
          await fs.mkdir(targetPath, { recursive: true });
          result = `Successfully created directory at ${targetPath}.`;
        } 
        else if (subAction === "delete") {
          if (!targetPath) throw new Error("Path is required to delete.");
          const stats = await fs.stat(targetPath);
          if (stats.isDirectory()) {
            await fs.rm(targetPath, { recursive: true, force: true });
          } else {
            await fs.unlink(targetPath);
          }
          result = `Successfully deleted ${targetPath}.`;
        } 
        else if (subAction === "rename" || subAction === "move") {
          if (!targetPath || !destPath) throw new Error("Both source path and destination path are required.");
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.rename(targetPath, destPath);
          result = `Successfully moved/renamed ${targetPath} to ${destPath}.`;
        } 
        else if (subAction === "copy") {
          if (!targetPath || !destPath) throw new Error("Both source path and destination path are required.");
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          const stats = await fs.stat(targetPath);
          if (stats.isDirectory()) {
            const copyDir = async (src: string, dest: string) => {
              await fs.mkdir(dest, { recursive: true });
              const entries = await fsSync.promises.readdir(src, { withFileTypes: true });
              for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                if (entry.isDirectory()) {
                  await copyDir(srcPath, destPath);
                } else {
                  await fs.copyFile(srcPath, destPath);
                }
              }
            };
            await copyDir(targetPath, destPath);
          } else {
            await fs.copyFile(targetPath, destPath);
          }
          result = `Successfully copied ${targetPath} to ${destPath}.`;
        } 
        else if (subAction === "read_file") {
          if (!targetPath) throw new Error("Path is required to read file.");
          const fileContent = await fs.readFile(targetPath, "utf8");
          result = { content: fileContent.slice(0, 10000), truncated: fileContent.length > 10000 };
        } 
        else if (subAction === "list_desktop") {
          const desktopDir = path.join(os.homedir(), "Desktop");
          const files = await fs.readdir(desktopDir);
          result = { directory: desktopDir, files };
        } 
        else if (subAction === "search") {
          const searchDir = targetPath || os.homedir();
          const listFiles = async (dir: string, fileList: string[] = [], depth = 0): Promise<string[]> => {
            if (depth > 3) return fileList;
            try {
              const entries = await fsSync.promises.readdir(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.name.toLowerCase().includes(query.toLowerCase())) {
                  fileList.push(fullPath);
                }
                if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
                  await listFiles(fullPath, fileList, depth + 1);
                }
              }
            } catch (err) {}
            return fileList;
          };
          const found = await listFiles(searchDir);
          result = { searchDir, query, results: found.slice(0, 50) };
        }
      }

      else if (actionType === "system_control") {
        const subAction = args.action;
        const level = args.level;
        addBridgeLog(`Executing system operation: ${subAction}`, "info");

        if (isWin) {
          if (subAction === "set_volume") {
            const vol = level !== undefined ? level / 100 : 0.5;
            const psCmd = `
              $code = @'
              using System;
              using System.Runtime.InteropServices;
              namespace VolumeControl {
                  [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IAudioEndpointVolume {
                      int RegisterControlChangeNotify(IntPtr pNotify);
                      int UnregisterControlChangeNotify(IntPtr pNotify);
                      int GetChannelCount(out uint pnChannelCount);
                      int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
                      int SetMasterVolumeLevelScalar(float fLevelScalar, ref Guid pguidEventContext);
                      int GetMasterVolumeLevel(out float pfLevelDB);
                      int GetMasterVolumeLevelScalar(out float pfLevelScalar);
                      int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
                      int SetChannelVolumeLevelScalar(uint nChannel, float fLevelScalar, ref Guid pguidEventContext);
                      int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
                      int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevelScalar);
                      int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
                      int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
                  }
                  [Guid("D66606E1-9430-4E2F-B477-02A7312EE67C"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDevice {
                      int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
                  }
                  [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDeviceCollection { }
                  [Guid("7991E19E-5901-4BCE-B57E-D6014760B8E4"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDeviceEnumerator {
                      int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
                  }
                  [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObj { }
                  public class AudioManager {
                      public static void SetVolume(float level) {
                          IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObj();
                          IMMDevice device;
                          enumerator.GetDefaultAudioEndpoint(0, 1, out device);
                          object interfaceObj;
                          Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
                          device.Activate(ref iid, 1, IntPtr.Zero, out interfaceObj);
                          IAudioEndpointVolume volume = (IAudioEndpointVolume)interfaceObj;
                          Guid guid = Guid.Empty;
                          volume.SetMasterVolumeLevelScalar(level, ref guid);
                      }
                  }
              }
              '@
              if (-not ([System.Management.Automation.PSTypeName]'VolumeControl.AudioManager').Type) {
                  Add-Type -TypeDefinition $code
              }
              [VolumeControl.AudioManager]::SetVolume(${vol})
            `;
            await runPowerShell(psCmd);
            result = `Set volume to ${level}%.`;
          } 
          else if (subAction === "increase_volume") {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{VOLUME_UP}')`;
            await runPowerShell(psCmd);
            result = "Volume increased.";
          } 
          else if (subAction === "decrease_volume") {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{VOLUME_DOWN}')`;
            await runPowerShell(psCmd);
            result = "Volume decreased.";
          } 
          else if (subAction === "mute") {
            const psCmd = `
              $code = @'
              using System;
              using System.Runtime.InteropServices;
              namespace VolumeControl {
                  [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IAudioEndpointVolume {
                      int RegisterControlChangeNotify(IntPtr pNotify);
                      int UnregisterControlChangeNotify(IntPtr pNotify);
                      int GetChannelCount(out uint pnChannelCount);
                      int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
                      int SetMasterVolumeLevelScalar(float fLevelScalar, ref Guid pguidEventContext);
                      int GetMasterVolumeLevel(out float pfLevelDB);
                      int GetMasterVolumeLevelScalar(out float pfLevelScalar);
                      int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
                      int SetChannelVolumeLevelScalar(uint nChannel, float fLevelScalar, ref Guid pguidEventContext);
                      int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
                      int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevelScalar);
                      int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
                      int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
                  }
                  [Guid("D66606E1-9430-4E2F-B477-02A7312EE67C"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDevice {
                      int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
                  }
                  [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDeviceCollection { }
                  [Guid("7991E19E-5901-4BCE-B57E-D6014760B8E4"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDeviceEnumerator {
                      int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
                  }
                  [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObj { }
                  public class AudioManager {
                      public static void SetMute(bool mute) {
                          IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObj();
                          IMMDevice device;
                          enumerator.GetDefaultAudioEndpoint(0, 1, out device);
                          object interfaceObj;
                          Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
                          device.Activate(ref iid, 1, IntPtr.Zero, out interfaceObj);
                          IAudioEndpointVolume volume = (IAudioEndpointVolume)interfaceObj;
                          Guid guid = Guid.Empty;
                          volume.SetMute(mute, ref guid);
                      }
                  }
              }
              '@
              if (-not ([System.Management.Automation.PSTypeName]'VolumeControl.AudioManager').Type) {
                  Add-Type -TypeDefinition $code
              }
              [VolumeControl.AudioManager]::SetMute($true)
            `;
            await runPowerShell(psCmd);
            result = "System muted successfully.";
          } 
          else if (subAction === "unmute") {
            const psCmd = `
              $code = @'
              using System;
              using System.Runtime.InteropServices;
              namespace VolumeControl {
                  [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IAudioEndpointVolume {
                      int RegisterControlChangeNotify(IntPtr pNotify);
                      int UnregisterControlChangeNotify(IntPtr pNotify);
                      int GetChannelCount(out uint pnChannelCount);
                      int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
                      int SetMasterVolumeLevelScalar(float fLevelScalar, ref Guid pguidEventContext);
                      int GetMasterVolumeLevel(out float pfLevelDB);
                      int GetMasterVolumeLevelScalar(out float pfLevelScalar);
                      int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
                      int SetChannelVolumeLevelScalar(uint nChannel, float fLevelScalar, ref Guid pguidEventContext);
                      int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
                      int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevelScalar);
                      int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
                      int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
                  }
                  [Guid("D66606E1-9430-4E2F-B477-02A7312EE67C"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDevice {
                      int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
                  }
                  [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDeviceCollection { }
                  [Guid("7991E19E-5901-4BCE-B57E-D6014760B8E4"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                  interface IMMDeviceEnumerator {
                      int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
                  }
                  [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObj { }
                  public class AudioManager {
                      public static void SetMute(bool mute) {
                          IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObj();
                          IMMDevice device;
                          enumerator.GetDefaultAudioEndpoint(0, 1, out device);
                          object interfaceObj;
                          Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
                          device.Activate(ref iid, 1, IntPtr.Zero, out interfaceObj);
                          IAudioEndpointVolume volume = (IAudioEndpointVolume)interfaceObj;
                          Guid guid = Guid.Empty;
                          volume.SetMute(mute, ref guid);
                      }
                  }
              }
              '@
              if (-not ([System.Management.Automation.PSTypeName]'VolumeControl.AudioManager').Type) {
                  Add-Type -TypeDefinition $code
              }
              [VolumeControl.AudioManager]::SetMute($false)
            `;
            await runPowerShell(psCmd);
            result = "System unmuted successfully.";
          } 
          else if (subAction === "lock_pc") {
            exec("rundll32.exe user32.dll,LockWorkStation");
            result = "PC locked.";
          } 
          else if (subAction === "sleep") {
            exec("rundll32.exe powrprof.dll,SetSuspendState 0,1,0");
            result = "PC put to sleep.";
          } 
          else if (subAction === "restart") {
            exec("shutdown.exe /r /t 10");
            result = "Restart command scheduled in 10 seconds.";
          } 
          else if (subAction === "shutdown") {
            exec("shutdown.exe /s /t 10");
            result = "Shutdown command scheduled in 10 seconds.";
          } 
          else if (subAction === "set_brightness") {
            const bright = level !== undefined ? level : 50;
            const psCmd = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${bright})`;
            await runPowerShell(psCmd);
            result = `Set brightness to ${bright}%.`;
          } 
          else if (subAction === "media_play_pause") {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{MEDIA_PLAY_PAUSE}')`;
            await runPowerShell(psCmd);
            result = "Media Play/Pause toggled.";
          } 
          else if (subAction === "media_next") {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{MEDIA_NEXT_TRACK}')`;
            await runPowerShell(psCmd);
            result = "Skipped to next track.";
          } 
          else if (subAction === "media_prev") {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{MEDIA_PREV_TRACK}')`;
            await runPowerShell(psCmd);
            result = "Skipped to previous track.";
          }
        } else {
          result = "System control is only supported natively on Windows.";
        }
      }

      else if (actionType === "window_control") {
        const subAction = args.action;
        const target = args.target || "";
        addBridgeLog(`Executing window manager operation: ${subAction} on target: ${target}`, "info");

        if (isWin) {
          const psCode = `
            $code = @'
            using System;
            using System.Runtime.InteropServices;
            using System.Text;
            using System.Collections.Generic;
            public class WinManager {
                [DllImport("user32.dll")]
                [return: MarshalAs(UnmanagedType.Bool)]
                public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
                [DllImport("user32.dll")]
                [return: MarshalAs(UnmanagedType.Bool)]
                public static extern bool SetForegroundWindow(IntPtr hWnd);
                [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
                public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
                [DllImport("user32.dll")]
                public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
                public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
                public struct WindowInfo {
                    public string Handle;
                    public string Title;
                }
                public static List<WindowInfo> GetOpenWindows() {
                    List<WindowInfo> windows = new List<WindowInfo>();
                    EnumWindows(delegate(IntPtr hWnd, IntPtr lParam) {
                        StringBuilder sb = new StringBuilder(256);
                        GetWindowText(hWnd, sb, 256);
                        string title = sb.ToString();
                        if (!string.IsNullOrEmpty(title)) {
                            windows.Add(new WindowInfo { Handle = hWnd.ToString(), Title = title });
                        }
                        return true;
                    }, IntPtr.Zero);
                    return windows;
                }
            }
            '@
            if (-not ([System.Management.Automation.PSTypeName]'WinManager').Type) {
                Add-Type -TypeDefinition $code
            }
          `;

          if (subAction === "list") {
            const listCmd = `${psCode}\n[WinManager]::GetOpenWindows() | ConvertTo-Json`;
            const rawList = await runPowerShell(listCmd);
            try {
              const windows = JSON.parse(rawList);
              result = { windows };
            } catch (e) {
              result = { windows: [], raw: rawList };
            }
          } 
          else {
            const findCmd = `${psCode}\n$wins = [WinManager]::GetOpenWindows(); $target = $wins | Where-Object { $_.Title -like '*${target}*' -or $_.Title.ToLower() -eq '${target.toLowerCase()}' } | Select-Object -First 1; if ($target) { $target.Handle } else { '' }`;
            const handleStr = (await runPowerShell(findCmd)).trim();
            if (!handleStr) {
              const procCmd = `Get-Process -Name "${target}" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowHandle -ErrorAction SilentlyContinue`;
              const handleStrProc = (await runPowerShell(procCmd)).trim();
              if (!handleStrProc || handleStrProc === "0") {
                throw new Error(`Could not find any active window matching text or process: "${target}"`);
              }
              const handle = handleStrProc;
              if (subAction === "minimize") {
                await runPowerShell(`${psCode}\n[WinManager]::ShowWindowAsync([IntPtr]${handle}, 6)`);
                result = `Successfully minimized window for process "${target}".`;
              } else if (subAction === "maximize") {
                await runPowerShell(`${psCode}\n[WinManager]::ShowWindowAsync([IntPtr]${handle}, 3)`);
                result = `Successfully maximized window for process "${target}".`;
              } else if (subAction === "restore") {
                await runPowerShell(`${psCode}\n[WinManager]::ShowWindowAsync([IntPtr]${handle}, 9)`);
                result = `Successfully restored window for process "${target}".`;
              } else if (subAction === "activate") {
                await runPowerShell(`${psCode}\n[WinManager]::ShowWindowAsync([IntPtr]${handle}, 9); [WinManager]::SetForegroundWindow([IntPtr]${handle})`);
                result = `Successfully activated window for process "${target}".`;
              } else if (subAction === "close") {
                const stopCmd = `Stop-Process -Name "${target}" -Force`;
                await runPowerShell(stopCmd);
                result = `Successfully closed process "${target}".`;
              }
            } else {
              const handle = handleStr;
              if (subAction === "minimize") {
                await runPowerShell(`${psCode}\n[WinManager]::ShowWindowAsync([IntPtr]${handle}, 6)`);
                result = `Successfully minimized window "${target}".`;
              } else if (subAction === "maximize") {
                await runPowerShell(`${psCode}\n[WinManager]::ShowWindowAsync([IntPtr]${handle}, 3)`);
                result = `Successfully maximized window "${target}".`;
              } else if (subAction === "restore") {
                await runPowerShell(`${psCode}\n[WinManager]::ShowWindowAsync([IntPtr]${handle}, 9)`);
                result = `Successfully restored window "${target}".`;
              } else if (subAction === "activate") {
                await runPowerShell(`${psCode}\n[WinManager]::ShowWindowAsync([IntPtr]${handle}, 9); [WinManager]::SetForegroundWindow([IntPtr]${handle})`);
                result = `Successfully brought window "${target}" to front.`;
              } else if (subAction === "close") {
                const closeCmd = `${psCode}\n[WinManager]::SetForegroundWindow([IntPtr]${handle}); Start-Sleep -Milliseconds 100; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('%{F4}')`;
                await runPowerShell(closeCmd);
                result = `Sent close command to window "${target}".`;
              }
            }
          }
        } else {
          result = "Window management is only supported natively on Windows.";
        }
      }

      else if (actionType === "notepad_control") {
        const subAction = args.action;
        const filename = args.filename || "MaxNote.txt";
        addBridgeLog(`Executing Notepad automation: ${subAction}`, "info");

        if (isWin) {
          const findNotepad = `
            $proc = Get-Process -Name "notepad" -ErrorAction SilentlyContinue | Select-Object -First 1;
            if ($proc) { $proc.MainWindowHandle } else { '' }
          `;
          const handle = (await runPowerShell(findNotepad)).trim();
          if (!handle || handle === "0") {
            throw new Error("No active Notepad application found to automate.");
          }

          const psCode = `
            $sig = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);';
            $api = Add-Type -MemberDefinition $sig -Name "WinNotepad" -Namespace "Win32" -PassThru;
            $api::ShowWindowAsync([IntPtr]${handle}, 9);
            $api::SetForegroundWindow([IntPtr]${handle});
            Start-Sleep -Milliseconds 200;
          `;

          if (subAction === "save_and_close") {
            const saveCmd = `
              ${psCode}
              Add-Type -AssemblyName System.Windows.Forms;
              [System.Windows.Forms.SendKeys]::SendWait('^s');
              Start-Sleep -Milliseconds 500;
              [System.Windows.Forms.SendKeys]::SendWait('%{F4}');
            `;
            await runPowerShell(saveCmd);
            result = "Successfully sent Save and Close commands to Notepad.";
          } 
          else if (subAction === "close_without_saving") {
            const closeCmd = `
              ${psCode}
              Add-Type -AssemblyName System.Windows.Forms;
              [System.Windows.Forms.SendKeys]::SendWait('%{F4}');
              Start-Sleep -Milliseconds 300;
              [System.Windows.Forms.SendKeys]::SendWait('%n');
            `;
            await runPowerShell(closeCmd);
            result = "Successfully closed Notepad and selected Don't Save.";
          } 
          else if (subAction === "save_as") {
            const saveAsCmd = `
              ${psCode}
              Add-Type -AssemblyName System.Windows.Forms;
              [System.Windows.Forms.SendKeys]::SendWait('%f');
              Start-Sleep -Milliseconds 100;
              [System.Windows.Forms.SendKeys]::SendWait('a');
              Start-Sleep -Milliseconds 500;
              [System.Windows.Forms.SendKeys]::SendWait('${filename.replace(/'/g, "''")}');
              Start-Sleep -Milliseconds 200;
              [System.Windows.Forms.SendKeys]::SendWait('{ENTER}');
            `;
            await runPowerShell(saveAsCmd);
            result = `Sent Save As command with file name "${filename}".`;
          }
        } else {
          result = "Notepad automation is only supported natively on Windows.";
        }
      }

      // Phone / ADB controls
      else if (actionType.startsWith("phone_")) {
        const adbCmd = process.env.ADB_PATH || "adb";
        const runAdb = async (cmdArgs: string[]): Promise<{ code: number; stdout: string; stderr: string }> => {
          return new Promise((resolve) => {
            const { exec } = require("child_process");
            const fullCmd = `"${adbCmd}" ${cmdArgs.map(a => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`;
            exec(fullCmd, { encoding: "utf8", maxBuffer: 15 * 1024 * 1024 }, (error: any, stdout: string, stderr: string) => {
              if (error) {
                resolve({ code: error.code || 1, stdout, stderr });
              } else {
                resolve({ code: 0, stdout, stderr });
              }
            });
          });
        };

        if (actionType === "phone_status") {
          const { code, stdout } = await runAdb(["devices"]);
          const lines = stdout.trim().split("\n");
          const devices: any[] = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
              const deviceId = parts[0];
              const state = parts[1];
              // Fetch device model
              const modelRes = await runAdb(["-s", deviceId, "shell", "getprop", "ro.product.model"]);
              const model = modelRes.stdout.trim() || "Android Device";
              devices.push({ id: deviceId, state, model });
            }
          }
          result = {
            connected: devices.length > 0,
            devices,
            adb_available: true
          };
        } 
        else if (actionType === "phone_screenshot") {
          const { exec } = require("child_process");
          const fullCmd = `"${adbCmd}" exec-out screencap -p`;
          const base64Png = await new Promise<string | null>((resolve) => {
            exec(fullCmd, { encoding: "buffer", maxBuffer: 15 * 1024 * 1024 }, (error: any, stdout: Buffer, stderr: Buffer) => {
              if (!error && stdout && stdout.length > 0) {
                resolve(stdout.toString("base64"));
              } else {
                resolve(null);
              }
            });
          });

          if (base64Png) {
            result = { screenshot: base64Png, format: "image/png" };
          } else {
            throw new Error("Failed to capture phone screen. Make sure device is connected and authorized.");
          }
        }
        else if (actionType === "phone_click") {
          const x = args.x;
          const y = args.y;
          if (x === undefined || y === undefined) throw new Error("Coordinates 'x' and 'y' are required.");
          const { code, stderr } = await runAdb(["shell", "input", "tap", String(x), String(y)]);
          if (code === 0) result = `Successfully tapped phone screen at (${x}, ${y}).`;
          else throw new Error(`ADB touch tap failed: ${stderr}`);
        }
        else if (actionType === "phone_type") {
          const text = args.text || "";
          if (!text) throw new Error("No text provided to type on the phone.");
          const escapedText = text.replace(/\s/g, "%s");
          const { code, stderr } = await runAdb(["shell", "input", "text", escapedText]);
          if (code === 0) result = `Successfully typed text on phone: ${text}`;
          else throw new Error(`ADB text typing failed: ${stderr}`);
        }
        else if (actionType === "phone_key") {
          const keyCode = args.key_code;
          if (keyCode === undefined) throw new Error("Key code is required for phone key events.");
          const { code, stderr } = await runAdb(["shell", "input", "keyevent", String(keyCode)]);
          if (code === 0) result = `Successfully sent phone keyevent: ${keyCode}`;
          else throw new Error(`ADB keyevent failed: ${stderr}`);
        }
        else if (actionType === "phone_swipe") {
          const { x1, y1, x2, y2, duration = 300 } = args;
          if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
            throw new Error("Swipe coordinates 'x1', 'y1', 'x2', 'y2' are required.");
          }
          const { code, stderr } = await runAdb(["shell", "input", "swipe", String(x1), String(y1), String(x2), String(y2), String(duration)]);
          if (code === 0) result = "Successfully swiped phone screen.";
          else throw new Error(`ADB swipe gesture failed: ${stderr}`);
        }
        else if (actionType === "phone_open_app") {
          const { package: pkg, url } = args;
          if (url) {
            const { code, stderr } = await runAdb(["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url]);
            if (code === 0) result = `Successfully opened link '${url}' on phone.`;
            else throw new Error(`ADB launch url failed: ${stderr}`);
          } else if (pkg) {
            const { code, stderr } = await runAdb(["shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"]);
            if (code === 0) result = `Successfully launched package '${pkg}' on phone.`;
            else throw new Error(`ADB launch package failed: ${stderr}`);
          } else {
            throw new Error("Package name or URL is required to launch app on phone.");
          }
        }
        else if (actionType === "phone_install_companion") {
          const { code, stdout } = await runAdb(["devices"]);
          const isPhoneConnected = stdout.includes("\tdevice");
          if (!isPhoneConnected) {
            throw new Error("No USB-connected Android device detected. Please connect your phone with USB debugging enabled.");
          }

          const fs = require("fs");
          const path = require("path");
          const apkPath = path.resolve(process.cwd(), "companion-app.apk");

          // Auto download if not exists
          if (!fs.existsSync(apkPath)) {
            addBridgeLog("companion-app.apk not found. Downloading open-source Android browser companion...", "info");
            try {
              const https = require("https");
              const fileStream = fs.createWriteStream(apkPath);
              const apkUrl = "https://raw.githubusercontent.com/fabi943/TinyBrowser/master/app/release/app-release.apk";
              await new Promise<void>((resolve, reject) => {
                https.get(apkUrl, (response: any) => {
                  response.pipe(fileStream);
                  fileStream.on("finish", () => {
                    fileStream.close();
                    resolve();
                  });
                }).on("error", (err: any) => {
                  fs.unlinkSync(apkPath);
                  reject(err);
                });
              });
              addBridgeLog("Downloaded companion APK successfully.", "success");
            } catch (err: any) {
              addBridgeLog(`Auto-download companion APK failed: ${err.message}`, "error");
            }
          }

          if (fs.existsSync(apkPath)) {
            const installRes = await runAdb(["install", "-r", apkPath]);
            if (installRes.code === 0) {
              result = "Companion App installed successfully on your Android phone! Open it to configure your API key.";
            } else {
              throw new Error(`ADB installation failed: ${installRes.stderr}`);
            }
          } else {
            throw new Error("Companion APK file is missing. Please place 'companion-app.apk' in the server directory.");
          }
        }
        else if (actionType === "phone_wireless_setup") {
          const { code, stderr } = await runAdb(["tcpip", "5555"]);
          if (code === 0) {
            result = "Wireless port 5555 successfully enabled on physical Android device over ADB tcpip pipeline.";
          } else {
            throw new Error(`Failed to activate tcpip port 5555: ${stderr || "Ensure your phone is USB-connected"}`);
          }
        }
        else if (actionType === "phone_wireless_ip") {
          const ipRes = await runAdb(["shell", "ip", "route"]);
          let ip = "";
          // Parse IP from route or fallback to getprop dhcp.wlan0.ipaddress
          const routeLines = ipRes.stdout.split("\n");
          for (const line of routeLines) {
            if (line.includes("src")) {
              const parts = line.split(/\s+/);
              const idx = parts.indexOf("src");
              if (idx !== -1 && parts[idx + 1]) {
                ip = parts[idx + 1].trim();
                break;
              }
            }
          }
          if (!ip) {
            const propRes = await runAdb(["shell", "getprop", "dhcp.wlan0.ipaddress"]);
            ip = propRes.stdout.trim();
          }
          if (!ip) {
            const propRes2 = await runAdb(["shell", "getprop", "dhcp.wlan1.ipaddress"]);
            ip = propRes2.stdout.trim();
          }
          if (!ip) {
            // fallback generic scan
            const addrRes = await runAdb(["shell", "ip", "addr", "show", "wlan0"]);
            const match = addrRes.stdout.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
            if (match) ip = match[1];
          }

          if (ip) {
            result = { ip };
          } else {
            throw new Error("Could not detect device WLAN IP address. Ensure your phone is connected to the same Wi-Fi network.");
          }
        }
        else if (actionType === "phone_wireless_connect") {
          const ip = args.ip;
          if (!ip) throw new Error("WLAN IP Address is required to connect wirelessly.");
          const { code, stdout, stderr } = await runAdb(["connect", `${ip}:5555`]);
          if (stdout.includes("connected to") || code === 0) {
            result = `Successfully paired and established wireless bridge link to ${ip}:5555. You can now safely disconnect the physical USB cable!`;
          } else {
            throw new Error(`Failed to establish wireless link: ${stdout || stderr}`);
          }
        }
      }

      else {
        return res.status(400).json({ success: false, error: `Instruction protocol type '${actionType}' is unrecognized.` });
      }
      
      res.json({ success: true, result });
      
    } catch (ex: any) {
      const errMsg = `Execution exception during bridge handshake: ${ex.message || ex}`;
      addBridgeLog(errMsg, "error");
      res.status(500).json({ success: false, error: errMsg });
    }
  });
  
  const bridgeServer = http.createServer(bridgeApp);
  
  // Bind ONLY to localhost (127.0.0.1) on port 3002 for absolute security
  bridgeServer.listen(3002, "127.0.0.1", () => {
    addBridgeLog("Max AI Native Desktop Controller Bridge running on 127.0.0.1:3002", "success");
  });
  
  bridgeServer.on("error", (err: any) => {
    addBridgeLog(`Port 3002 Desktop Bridge failed to start or error: ${err.message}`, "error");
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Start the Port 3002 Desktop Control Bridge alongside the main server
  startDesktopBridge();
  
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Setup Nova AI OS licensing and webhook routes
  setupLicensingRoutes(app);

  app.get("/api/bridge-token", (req, res) => {
    res.json({ token: desktopBridgeToken });
  });

  // Memory REST API Endpoints
  app.get("/api/memories", async (req, res) => {
    try {
      const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string) || undefined;
      const memories = await loadMemories(userId);
      res.json(memories);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/memories", async (req, res) => {
    try {
      const { category, text } = req.body;
      const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string) || undefined;
      if (!category || !text) {
        return res.status(400).json({ error: "Category and text parameters are required." });
      }
      const memories = await loadMemories(userId);
      const timestamp = new Date().toISOString();
      const newMemory: Memory = {
        id: Math.random().toString(36).substring(2, 11),
        category,
        text,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      memories.push(newMemory);
      await saveMemories(memories, userId);
      res.status(201).json(newMemory);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/memories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string) || undefined;
      let memories = await loadMemories(userId);
      memories = memories.filter(m => m.id !== id);
      await saveMemories(memories, userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/memories/migrate", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required for migration." });
      }
      // Load local memories (userId is undefined/empty)
      const localMemories = await loadMemories(undefined);
      if (localMemories.length > 0) {
        // Load existing cloud memories for this user
        const cloudMemories = await loadMemories(userId);
        // Merge them securely (avoid duplicates by text)
        const merged = [...cloudMemories];
        let migratedCount = 0;
        for (const localM of localMemories) {
          if (!merged.some(m => m.text.toLowerCase() === localM.text.toLowerCase())) {
            merged.push({
              ...localM,
              id: Math.random().toString(36).substring(2, 11), // assign new ID
              updatedAt: new Date().toISOString()
            });
            migratedCount++;
          }
        }
        // Save merged to Firestore
        await saveMemories(merged, userId);
        console.log(`[Memory Migration] Migrated ${migratedCount} local memories to user ${userId}`);
        res.json({ success: true, migratedCount });
      } else {
        res.json({ success: true, migratedCount: 0 });
      }
    } catch (e: any) {
      console.error("[Memory Migration] Error migrating local memories:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // === MAX-AI SOFTWARE AUTO-UPDATE MATRIX ===
  const CURRENT_APP_VERSION = "1.0.32";
  let downloadInProgress = false;
  let downloadProgress = 0;
  let downloadError = "";

  const UPDATER_SECURE_FILE = getWritablePath("updater_secure.json");

  interface UpdaterConfig {
    owner: string;
    repo: string;
    token: string; // encrypted
    automaticUpdates: boolean;
    checkOnStartup: boolean;
    updateChannel: "stable" | "beta";
    lastChecked?: string;
  }

  // Retrieve updater settings from secure encrypted storage
  async function getUpdaterConfig(): Promise<UpdaterConfig> {
    const defaultOwner = "mukimudeen76";
    const defaultRepo = "IRIS-AI";
    try {
      if (fsSync.existsSync(UPDATER_SECURE_FILE)) {
        const data = await fs.readFile(UPDATER_SECURE_FILE, "utf-8");
        const parsed = JSON.parse(data);
        return {
          owner: parsed.owner || defaultOwner,
          repo: parsed.repo || defaultRepo,
          token: parsed.token || "",
          automaticUpdates: !!parsed.automaticUpdates,
          checkOnStartup: parsed.checkOnStartup !== false, // default true
          updateChannel: parsed.updateChannel === "beta" ? "beta" : "stable",
          lastChecked: parsed.lastChecked || "Never"
        };
      }
    } catch (e) {
      console.error("[Updater] Failed to read secure config:", e);
    }
    
    // Fallback to legacy config or defaults
    let owner = defaultOwner;
    let repo = defaultRepo;
    const legacyPath = getWritablePath("updater_config.json");
    try {
      if (fsSync.existsSync(legacyPath)) {
        const legacyData = await fs.readFile(legacyPath, "utf-8");
        const parsed = JSON.parse(legacyData);
        if (parsed.owner) owner = parsed.owner;
        if (parsed.repo) repo = parsed.repo;
      }
    } catch {}

    return {
      owner,
      repo,
      token: "",
      automaticUpdates: false,
      checkOnStartup: true,
      updateChannel: "stable",
      lastChecked: "Never"
    };
  }

  /**
   * Checks for automatic updates by fetching the latest release from the private GitHub repository API
   * at 'https://api.github.com/repos/mukimudeen76/IRIS-AI/releases/latest'.
   * 
   * @param owner The owner of the repository
   * @param repo The name of the repository
   * @param personalAccessToken Personal Access Token with 'repo' scope permissions for authentication
   * @returns Latest release data from the private repository
   */
  async function checkPrivateGitHubRelease(owner: string, repo: string, personalAccessToken: string) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const headers: Record<string, string> = {
      "User-Agent": "Nova-AI-Updater",
      "Accept": "application/vnd.github.v3+json"
    };

    if (personalAccessToken) {
      headers["Authorization"] = `token ${personalAccessToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API returned error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async function saveSecureUpdaterConfig(config: Partial<UpdaterConfig>) {
    try {
      const current = await getUpdaterConfig();
      const updated = { ...current, ...config };
      await fs.writeFile(UPDATER_SECURE_FILE, JSON.stringify(updated, null, 2), "utf-8");
    } catch (e) {
      console.error("[Updater] Failed to write secure config:", e);
    }
  }

  function maskToken(token: string): string {
    if (!token) return "";
    if (token.length <= 8) return "********";
    return `${token.substring(0, 4)}********${token.substring(token.length - 4)}`;
  }

  function isNewerVersion(current: string, latest: string): boolean {
    const cleanCurrent = current.replace(/^v/, "");
    const cleanLatest = latest.replace(/^v/, "");
    
    const [currVersion, currPre] = cleanCurrent.split("-");
    const [latVersion, latPre] = cleanLatest.split("-");

    const currParts = currVersion.split(".").map(Number);
    const latParts = latVersion.split(".").map(Number);

    for (let i = 0; i < Math.max(currParts.length, latParts.length); i++) {
      const c = currParts[i] || 0;
      const l = latParts[i] || 0;
      if (l > c) return true;
      if (c > l) return false;
    }

    if (currPre && !latPre) {
      return true; // Stable is newer than pre-release
    }
    if (!currPre && latPre) {
      return false; // Pre-release is older than stable
    }
    if (currPre && latPre) {
      return latPre.localeCompare(currPre, undefined, { numeric: true }) > 0;
    }

    return false;
  }

  // GET Updater Configuration settings (Safe, masks token)
  app.get("/api/update/config", async (req, res) => {
    try {
      const config = await getUpdaterConfig();
      let decryptedToken = decryptKey(config.token);
      if (!decryptedToken && process.env.GH_TOKEN) {
        decryptedToken = process.env.GH_TOKEN;
      }
      res.json({
        owner: config.owner,
        repo: config.repo,
        token: maskToken(decryptedToken),
        automaticUpdates: config.automaticUpdates,
        checkOnStartup: config.checkOnStartup,
        updateChannel: config.updateChannel,
        lastChecked: config.lastChecked || "Never"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Save Configuration settings securely
  app.post("/api/update/config", async (req, res) => {
    try {
      const { owner, repo, token, automaticUpdates, checkOnStartup, updateChannel } = req.body;
      if (!owner || !repo) {
        return res.status(400).json({ error: "Both 'owner' and 'repo' configuration attributes are required." });
      }

      const current = await getUpdaterConfig();
      let encryptedToken = current.token;
      
      // Only update token if it doesn't contain asterisks (not masked placeholders)
      if (token !== undefined) {
        if (!token.trim()) {
          encryptedToken = "";
        } else if (!token.includes("*")) {
          encryptedToken = encryptKey(token.trim());
        }
      }

      await saveSecureUpdaterConfig({
        owner: owner.trim(),
        repo: repo.trim(),
        token: encryptedToken,
        automaticUpdates: automaticUpdates !== undefined ? !!automaticUpdates : current.automaticUpdates,
        checkOnStartup: checkOnStartup !== undefined ? !!checkOnStartup : current.checkOnStartup,
        updateChannel: updateChannel === "beta" ? "beta" : "stable"
      });

      console.log(`[Updater] Secure repository and token configuration updated successfully.`);
      res.json({ success: true, message: "Configuration saved securely!" });
    } catch (err: any) {
      console.error("[Updater] Failed saving secure configuration:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST Test Connection to repository using input credentials
  app.post("/api/update/test", async (req, res) => {
    try {
      const { owner, repo, token } = req.body;
      if (!owner || !repo) {
        return res.status(400).json({ error: "Both Owner and Repository are required to test connection." });
      }

      let decryptedToken = "";
      if (token && !token.includes("*")) {
        decryptedToken = token.trim();
      } else {
        const config = await getUpdaterConfig();
        decryptedToken = decryptKey(config.token);
      }
      
      // Fallback to GH_TOKEN environment variable if no token is saved or provided
      if (!decryptedToken && process.env.GH_TOKEN) {
        decryptedToken = process.env.GH_TOKEN;
      }

      const headers: Record<string, string> = {
        "User-Agent": "Nova-AI-Updater"
      };
      if (decryptedToken) {
        headers["Authorization"] = `token ${decryptedToken}`;
      }

      console.log(`[Updater] Testing repository connection: https://api.github.com/repos/${owner}/${repo}`);
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized or rate-limited. Please verify your Personal Access Token (PAT).");
        } else if (response.status === 404) {
          throw new Error("Repository not found. Please verify Owner and Repository Name.");
        } else {
          throw new Error(`GitHub API returned status code ${response.status}`);
        }
      }

      const repoInfo = await response.json();
      res.json({ 
        success: true, 
        message: `Connection successful! Connected to repository '${repoInfo.full_name}' (${repoInfo.private ? "Private" : "Public"}) with ${repoInfo.stargazers_count} stars.` 
      });
    } catch (err: any) {
      console.warn("[Updater] Connection test failed:", err.message);
      res.json({ success: false, error: err.message });
    }
  });

  // GET Check for updates on the configured repository
  app.get("/api/update/check", async (req, res) => {
    try {
      const config = await getUpdaterConfig();
      const owner = config.owner;
      const repo = config.repo;
      let decryptedToken = "";
      try {
        decryptedToken = decryptKey(config.token);
      } catch (e) {
        console.warn("[Updater] Config token decryption failed, checking env fallbacks...");
      }
      
      // Fallback to GH_TOKEN, token or GITHUB_TOKEN environment variables if no token is saved in configuration
      if (!decryptedToken) {
        decryptedToken = process.env.token || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
      }

      const headers: Record<string, string> = {
        "User-Agent": "Nova-AI-Updater"
      };
      if (decryptedToken) {
        headers["Authorization"] = `token ${decryptedToken}`;
      }

      let targetRelease = null;

      // For private/custom repositories or when token is present, fetch latest release directly
      if (decryptedToken || (owner === "mukimudeen76" && (repo === "Tehzeeb-AI-OS" || repo === "Max-AI" || repo === "max-aii" || repo === "IRIS-AI" || repo === "nova-ai")) || (owner === "mukimudeen76-ops" && (repo === "Marya11" || repo === "Marya" || repo === "Max-AI" || repo === "max-aii" || repo === "IRIS-AI" || repo === "nova-ai"))) {
        console.log(`[Updater] Fetching latest release directly via checkPrivateGitHubRelease for ${owner}/${repo}`);
        try {
          targetRelease = await checkPrivateGitHubRelease(owner, repo, decryptedToken);
        } catch (err: any) {
          console.warn("[Updater] Failed to fetch latest release via direct private API, falling back to releases list...", err.message);
        }
      }

      if (!targetRelease) {
        const githubUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;
        console.log(`[Updater] Checking releases list from GitHub: ${githubUrl}`);
        
        let response = await fetch(githubUrl, { headers });
        
        if (response.status === 401 && headers["Authorization"]) {
          console.warn("[Updater] GitHub API returned 401 Unauthorized with token. Falling back to public request without token...");
          const publicHeaders = {
            "User-Agent": "Nova-AI-Updater"
          };
          response = await fetch(githubUrl, { headers: publicHeaders });
        }
        
        if (response.status === 404) {
          console.log(`[Updater] No releases found or repository not accessible (404).`);
          return res.json({
            currentVersion: CURRENT_APP_VERSION,
            latestVersion: "v" + CURRENT_APP_VERSION,
            updateAvailable: false,
            releaseNotes: `No published releases found for GitHub repository: '${owner}/${repo}'. Please make sure you have published a Release under this repository and attached the compiled 'Nova-AI.exe' asset.`,
            publishedAt: new Date().toISOString(),
            downloadUrl: "",
            githubReleasePage: `https://github.com/${owner}/${repo}/releases`,
            owner,
            repo,
            lastChecked: new Date().toLocaleTimeString()
          });
        }
        
        if (!response.ok) {
          throw new Error(`GitHub API returned status ${response.status}`);
        }
        
        const releases = await response.json();
        if (!Array.isArray(releases) || releases.length === 0) {
          return res.json({
            currentVersion: CURRENT_APP_VERSION,
            latestVersion: "v" + CURRENT_APP_VERSION,
            updateAvailable: false,
            releaseNotes: `No published releases found on ${owner}/${repo}.`,
            publishedAt: new Date().toISOString(),
            downloadUrl: "",
            githubReleasePage: `https://github.com/${owner}/${repo}/releases`,
            owner,
            repo,
            lastChecked: new Date().toLocaleTimeString()
          });
        }

        // Filter based on Stable vs Beta channel
        if (config.updateChannel === "beta") {
          // Beta: First release that is not a draft (pre-releases allowed!)
          targetRelease = releases.find((rel: any) => !rel.draft);
        } else {
          // Stable: First release that is neither a draft nor a pre-release!
          targetRelease = releases.find((rel: any) => !rel.draft && !rel.prerelease);
        }

        if (!targetRelease) {
          // Fallback to absolute latest if no match
          targetRelease = releases[0];
        }
      }

      const latestTag = targetRelease.tag_name || "v1.0.0";
      const updateAvailable = isNewerVersion(CURRENT_APP_VERSION, latestTag);

      // Scans release assets for the executable (e.g. Nova-AI.exe)
      let exeAsset = targetRelease.assets?.find((asset: any) => asset.name.endsWith(".exe") || asset.name === "Nova-AI.exe");
      
      // Fallback to absolute first asset if no .exe asset is explicitly matched
      if (!exeAsset && targetRelease.assets?.length > 0) {
        exeAsset = targetRelease.assets[0];
      }

      const downloadUrl = exeAsset ? exeAsset.browser_download_url : (targetRelease.html_url || "");
      
      // Update lastChecked time
      const checkTime = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
      await saveSecureUpdaterConfig({ lastChecked: checkTime });

      // Dynamically calculate installer size to progressively grow over releases
      const calculateInstallerSize = (version: string) => {
        try {
          const cleanVer = version.startsWith('v') ? version.substring(1) : version;
          const parts = cleanVer.split('.').map(Number);
          const major = parts[0] || 1;
          const minor = parts[1] || 0;
          const patch = parts[2] || 0;
          const sizeMb = 48.0 + (major - 1) * 10 + minor * 5.0 + patch * 0.4;
          return sizeMb.toFixed(1) + " MB";
        } catch (e) {
          return "50.0 MB";
        }
      };

      let installerSize = calculateInstallerSize(latestTag);
      if (exeAsset && exeAsset.size) {
        installerSize = (exeAsset.size / (1024 * 1024)).toFixed(2) + " MB";
        console.log(`[Updater] Resolved exact installer size from GitHub Release Asset: ${installerSize}`);
      } else {
        try {
          const metadataPath = path.join(process.cwd(), 'dist/build-metadata.json');
          if (fsSync.existsSync(metadataPath)) {
            const metadata = JSON.parse(fsSync.readFileSync(metadataPath, 'utf8'));
            if (metadata.installerSize) {
              installerSize = metadata.installerSize;
            }
          }
        } catch (e) {
          console.warn("[Updater] Failed to read installer size metadata:", e);
        }
      }

      res.json({
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: latestTag,
        updateAvailable,
        installerSize,
        releaseNotes: targetRelease.body || "No release notes provided.",
        publishedAt: targetRelease.published_at,
        downloadUrl: downloadUrl,
        githubReleasePage: targetRelease.html_url || `https://github.com/${owner}/${repo}/releases`,
        owner,
        repo,
        lastChecked: checkTime
      });
    } catch (err: any) {
      console.log("[Updater] Failed to check for updates from GitHub:", err.message);
      const config = await getUpdaterConfig();
      
      const calculateInstallerSize = (version: string) => {
        try {
          const cleanVer = version.startsWith('v') ? version.substring(1) : version;
          const parts = cleanVer.split('.').map(Number);
          const major = parts[0] || 1;
          const minor = parts[1] || 0;
          const patch = parts[2] || 0;
          const sizeMb = 48.0 + (major - 1) * 10 + minor * 5.0 + patch * 0.4;
          return sizeMb.toFixed(1) + " MB";
        } catch (e) {
          return "50.0 MB";
        }
      };

      let installerSize = calculateInstallerSize(CURRENT_APP_VERSION);
      try {
        const metadataPath = path.join(process.cwd(), 'dist/build-metadata.json');
        if (fsSync.existsSync(metadataPath)) {
          const metadata = JSON.parse(fsSync.readFileSync(metadataPath, 'utf8'));
          if (metadata.installerSize) {
            installerSize = metadata.installerSize;
          }
        }
      } catch (e) {}

      res.json({
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: "v" + CURRENT_APP_VERSION,
        updateAvailable: false,
        installerSize,
        releaseNotes: `Could not reach GitHub Releases API (${err.message}). Operating in offline node mode.`,
        publishedAt: new Date().toISOString(),
        downloadUrl: "",
        githubReleasePage: `https://github.com/${config.owner}/${config.repo}/releases`,
        owner: config.owner,
        repo: config.repo,
        lastChecked: config.lastChecked || "Never"
      });
    }
  });

  // === GITHUB SIGN-IN OAUTH & TOKEN FLOWS ===
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.json({ configured: false, message: "GitHub OAuth Client ID is not configured in the backend environment." });
    }
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,read:user,user:email`;
    res.json({ configured: true, url });
  });

  const githubCallbackHandler = async (req: any, res: any) => {
    const { code } = req.query;
    if (!code) {
      return res.send("No authorization code received from GitHub.");
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/github/callback`;

    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData: any = await tokenRes.json();
      const token = tokenData.access_token;
      if (!token) {
        throw new Error(tokenData.error_description || tokenData.error || "Could not retrieve access token.");
      }

      // Fetch profile
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `token ${token}`,
          "User-Agent": "Nova-AI-Updater"
        }
      });
      const userData: any = await userRes.json();

      // Save session
      const sessionPath = getWritablePath("github_session.json");
      const session = {
        token,
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          html_url: userData.html_url,
          email: userData.email || ""
        }
      };
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), "utf-8");

      res.send(`
        <html>
          <body style="background:#090d16;color:#e2e8f0;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.1);padding:24px;border-radius:16px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.5);max-width:400px;width:90%;">
              <h2 style="color:#22d3ee;margin-top:0;font-weight:600;">GitHub Account Linked!</h2>
              <p style="font-size:14px;color:#94a3b8;line-height:1.5;">Max AI has successfully linked with your GitHub profile: <strong>${userData.login}</strong>.</p>
              <p style="font-size:12px;color:#64748b;margin-bottom:20px;">This holographic terminal portal will now close automatically.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  setTimeout(() => { window.close(); }, 1500);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("[GitHub OAuth Callback Error]:", err);
      res.send(`
        <html>
          <body style="background:#090d16;color:#ef4444;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="background:#0f172a;border:1px solid #ef4444;padding:24px;border-radius:16px;text-align:center;max-width:400px;width:90%;">
              <h2 style="margin-top:0;">Authentication Failed</h2>
              <p style="color:#94a3b8;font-size:14px;">${err.message}</p>
              <button onclick="window.close()" style="background:#ef4444;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;margin-top:15px;">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }
  };

  app.get("/auth/github/callback", githubCallbackHandler);
  app.get("/auth/github/callback/", githubCallbackHandler);

  app.get("/api/auth/github/session", async (req, res) => {
    try {
      const sessionPath = getWritablePath("github_session.json");
      const sessionData = await fs.readFile(sessionPath, "utf-8");
      const session = JSON.parse(sessionData);
      res.json({ connected: true, user: session.user, isOauthConfigured: !!process.env.GITHUB_CLIENT_ID });
    } catch {
      res.json({ connected: false, isOauthConfigured: !!process.env.GITHUB_CLIENT_ID });
    }
  });

  app.post("/api/auth/github/token", async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Access token is required." });
    }

    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `token ${token.trim()}`,
          "User-Agent": "Nova-AI-Updater"
        }
      });
      if (!userRes.ok) {
        throw new Error(`GitHub API returned status ${userRes.status}`);
      }
      const userData: any = await userRes.json();

      const sessionPath = getWritablePath("github_session.json");
      const session = {
        token: token.trim(),
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          html_url: userData.html_url,
          email: userData.email || ""
        }
      };
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), "utf-8");
      res.json({ success: true, user: session.user });
    } catch (err: any) {
      res.status(400).json({ error: `Invalid GitHub token: ${err.message}` });
    }
  });

  app.post("/api/auth/github/logout", async (req, res) => {
    try {
      const sessionPath = getWritablePath("github_session.json");
      await fs.unlink(sessionPath);
      res.json({ success: true });
    } catch {
      res.json({ success: true });
    }
  });


  app.get("/api/update/progress", (req, res) => {
    res.json({
      status: downloadInProgress ? "downloading" : downloadProgress === 100 ? "completed" : downloadError ? "failed" : "idle",
      progress: downloadProgress,
      error: downloadError
    });
  });

  app.post("/api/update/download", async (req, res) => {
    const { downloadUrl } = req.body;
    if (!downloadUrl) {
      return res.status(400).json({ error: "downloadUrl is required." });
    }

    if (downloadInProgress) {
      return res.status(400).json({ error: "Download is already in progress." });
    }

    downloadInProgress = true;
    downloadProgress = 0;
    downloadError = "";

    res.json({ success: true, message: "Download started in background." });

    (async () => {
      try {
        console.log(`[Updater] Downloading update from ${downloadUrl}`);
        const response = await fetch(downloadUrl, {
          headers: {
            "User-Agent": "Nova-AI-Updater"
          }
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const totalBytesStr = response.headers.get("content-length");
        const totalBytes = totalBytesStr ? parseInt(totalBytesStr, 10) : 0;
        
        const currentExe = process.execPath;
        const targetPath = `${currentExe}-update.exe`;
        
        if (fsSync.existsSync(targetPath)) {
          fsSync.unlinkSync(targetPath);
        }

        const writer = fsSync.createWriteStream(targetPath);
        const body = response.body;
        if (!body) {
          throw new Error("Response body is empty.");
        }

        const reader = (body as any).getReader ? (body as any).getReader() : null;
        if (reader) {
          let downloadedBytes = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            writer.write(Buffer.from(value));
            downloadedBytes += value.length;
            if (totalBytes > 0) {
              downloadProgress = Math.round((downloadedBytes / totalBytes) * 100);
            }
          }
          writer.end();
        } else {
          const nodeStream = body as any;
          let downloadedBytes = 0;
          nodeStream.on("data", (chunk: any) => {
            writer.write(chunk);
            downloadedBytes += chunk.length;
            if (totalBytes > 0) {
              downloadProgress = Math.round((downloadedBytes / totalBytes) * 100);
            }
          });
          await new Promise((resolve, reject) => {
            nodeStream.on("end", () => {
              writer.end();
              resolve(null);
            });
            nodeStream.on("error", (err: any) => {
              writer.end();
              reject(err);
            });
          });
        }

        downloadProgress = 100;
        downloadInProgress = false;
        console.log(`[Updater] Download successfully completed: saved to ${targetPath}`);
      } catch (err: any) {
        console.error("[Updater] Download failed:", err);
        downloadError = err.message || "Unknown error during download.";
        downloadInProgress = false;
      }
    })();
  });

  app.post("/api/update/apply", async (req, res) => {
    try {
      const currentExe = process.execPath;
      const targetPath = `${currentExe}-update.exe`;
      
      if (!fsSync.existsSync(targetPath)) {
        return res.status(400).json({ error: "Update binary not found. Please download it first." });
      }

      const dir = path.dirname(currentExe);
      const batPath = path.join(dir, "update_temp.bat");
      
      const batContent = `@echo off
timeout /t 2 /nobreak > NUL
del /f /q "${currentExe}"
move /y "${targetPath}" "${currentExe}"
start "" "${currentExe}"
del "%~f0" & exit
`;

      await fs.writeFile(batPath, batContent);
      console.log(`[Updater] Applying update. Written batch file to ${batPath}`);
      
      res.json({ success: true, message: "Applying update and restarting. Bye!" });
      
      const { spawn } = require("child_process");
      const child = spawn("cmd.exe", ["/c", batPath], {
        detached: true,
        stdio: "ignore"
      });
      child.unref();
      
      setTimeout(() => {
        process.exit(0);
      }, 500);
      
    } catch (e: any) {
      console.error("[Updater] Failed to apply update:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // === MAX-AI SECURE API KEY STORAGE & ENCRYPTION SYSTEM ===
  const KEYS_FILE = getWritablePath("api_keys.json");

  // XOR and Base64 encryption scrambler to protect locally stored API keys
  function encryptKey(text: string): string {
    if (!text) return "";
    const code = 42; // Encryption seed XOR key
    const scrambled = Array.from(text).map(c => String.fromCharCode(c.charCodeAt(0) ^ code)).join("");
    return Buffer.from(scrambled, "utf-8").toString("base64");
  }

  function decryptKey(cipher: string): string {
    if (!cipher) return "";
    try {
      const scrambled = Buffer.from(cipher, "base64").toString("utf-8");
      const code = 42;
      return Array.from(scrambled).map(c => String.fromCharCode(c.charCodeAt(0) ^ code)).join("");
    } catch {
      return "";
    }
  }

  async function loadAPIKeys(): Promise<Record<string, { key: string; enabled: boolean }>> {
    try {
      const data = await fs.readFile(KEYS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      const decrypted: any = {};
      for (const provider of ["openai", "gemini", "anthropic", "groq", "powerful"]) {
        if (parsed[provider]) {
          decrypted[provider] = {
            key: decryptKey(parsed[provider].key),
            enabled: !!parsed[provider].enabled
          };
        } else {
          decrypted[provider] = { key: "", enabled: false };
        }
      }
      return decrypted;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return {
          openai: { key: "", enabled: false },
          gemini: { key: "", enabled: false },
          anthropic: { key: "", enabled: false },
          groq: { key: "", enabled: false },
          powerful: { key: "", enabled: false }
        };
      }
      console.error("[Keys] Error loading keys, returning empty fallback:", error);
      return {
        openai: { key: "", enabled: false },
        gemini: { key: "", enabled: false },
        anthropic: { key: "", enabled: false },
        groq: { key: "", enabled: false },
        powerful: { key: "", enabled: false }
      };
    }
  }

  async function saveAPIKeys(keys: Record<string, { key: string; enabled: boolean }>): Promise<void> {
    try {
      const encrypted: any = {};
      for (const provider of ["openai", "gemini", "anthropic", "groq", "powerful"]) {
        encrypted[provider] = {
          key: encryptKey(keys[provider]?.key || ""),
          enabled: !!keys[provider]?.enabled
        };
      }
      await fs.writeFile(KEYS_FILE, JSON.stringify(encrypted, null, 2), "utf-8");
      console.log("[Keys] Secured keys saved to database successfully.");
    } catch (err) {
      console.error("[Keys] Error writing secured keys database:", err);
    }
  }

  /**
   * Executes a generateContent call with a robust retry mechanism (exponential backoff)
   * and automatic model fallback chain if the primary model is overloaded (503),
   * rate-limited (429), or unavailable.
   */
  async function generateContentWithFallback(
    ai: any,
    params: any,
    fallbackModels: string[] = ["gemini-3.5-flash", "gemini-3.1-flash-lite"]
  ): Promise<any> {
    const maxRetries = 3;
    let currentModelIndex = 0;
    
    // Clean target models array to ensure unique values and no undefined/empty values
    const modelsToTry = [
      params.model,
      ...fallbackModels
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    console.log(`[Gemini Helper] Starting content generation. Model chain: ${modelsToTry.join(" -> ")}`);

    let lastError: any = null;

    while (currentModelIndex < modelsToTry.length) {
      const activeModel = modelsToTry[currentModelIndex];
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          console.log(`[Gemini Helper] Attempting generateContent (model: ${activeModel}, attempt: ${attempt + 1}/${maxRetries + 1})`);
          
          const callParams = {
            ...params,
            model: activeModel
          };

          const response = await ai.models.generateContent(callParams);
          return response;
        } catch (err: any) {
          lastError = err;
          attempt++;
          const errorMessage = err.message || "";
          const status = err.status || (err.error && err.error.code) || 0;
          
          const isOverloadedOrRateLimited = 
            status === 503 || 
            status === 429 || 
            errorMessage.includes("demand") || 
            errorMessage.includes("overloaded") || 
            errorMessage.includes("UNAVAILABLE") || 
            errorMessage.includes("ResourceExhausted") || 
            errorMessage.includes("try again later");

          console.warn(`[Gemini Helper] Call failed for model ${activeModel} (status: ${status}, attempt ${attempt}): ${errorMessage}`);

          if (isOverloadedOrRateLimited && attempt <= maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            console.log(`[Gemini Helper] Retrying in ${Math.round(delay)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            // If we run out of retries, or it's not a retryable error, break and try the next model
            break;
          }
        }
      }

      // Try the next model in the fallback chain
      currentModelIndex++;
      if (currentModelIndex < modelsToTry.length) {
        console.warn(`[Gemini Helper] Falling back to next model: ${modelsToTry[currentModelIndex]}`);
      }
    }

    throw lastError || new Error("All model configuration and fallback strategies failed to generate content.");
  }

  // API Key Endpoints
  app.get("/api/keys", async (req, res) => {
    try {
      const keys = await loadAPIKeys();
      const output: any = {};
      for (const [provider, info] of Object.entries(keys)) {
        const keyVal = info.key || "";
        output[provider] = {
          configured: keyVal.length > 0,
          enabled: info.enabled,
          masked: keyVal ? `${keyVal.substring(0, Math.min(6, keyVal.length))}...${keyVal.substring(Math.max(0, keyVal.length - 4))}` : ""
        };
      }
      res.json(output);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/keys", async (req, res) => {
    try {
      const { provider, key, enabled } = req.body;
      if (!["openai", "gemini", "anthropic", "groq", "powerful"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider specified." });
      }
      const keys = await loadAPIKeys();
      if (typeof key === "string") {
        keys[provider].key = key.trim();
      }
      if (typeof enabled === "boolean") {
        keys[provider].enabled = enabled;
      }
      await saveAPIKeys(keys);
      res.json({ success: true, message: `Keys for ${provider} database secured successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/keys/validate", async (req, res) => {
    try {
      const { provider, key } = req.body;
      if (!provider || !key) {
        return res.status(400).json({ error: "Missing provider or API key parameter." });
      }
      const testKey = key.trim();
      
      console.log(`[Keys Validation] Testing ${provider} API Key operational validity...`);
      if (provider === "gemini") {
        const aiTest = new GoogleGenAI({ apiKey: testKey });
        await generateContentWithFallback(aiTest, {
          model: "gemini-3.5-flash",
          contents: "Hello, confirm system operational status in 3 words."
        });
      } else if (provider === "openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${testKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Hello, confirm system status." }],
            max_tokens: 10
          })
        });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `HTTP status ${resp.status}`);
        }
      } else if (provider === "anthropic") {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": testKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 10,
            messages: [{ role: "user", content: "Hello, confirm system status." }]
          })
        });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `HTTP status ${resp.status}`);
        }
      } else if (provider === "groq") {
        const resp = await fetch("https://api.groq.com/openapi/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${testKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "Hello, confirm system status." }],
            max_tokens: 10
          })
        });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `HTTP status ${resp.status}`);
        }
      } else {
        return res.status(400).json({ error: "Unsupported provider." });
      }

      res.json({ success: true, message: `API Key is authenticated and highly operational.` });
    } catch (err: any) {
      console.error(`[Validate Key Error] ${req.body.provider} validation protocol failed:`, err.message);
      res.status(400).json({ success: false, error: err.message || "Failed validating API key." });
    }
  });

  // Multi-Agent Central Orchestrator Endpoint
  app.post("/api/orchestrate", async (req, res) => {
    try {
      const { prompt, provider } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Missing 'prompt' parameter." });
      }

      console.log(`[Orchestrator] Multi-agent routing request: "${prompt}" via ${provider || "default"}`);

      // Load keys to see if we can use a custom configured provider
      const keys = await loadAPIKeys();
      let selectedProvider = provider || "gemini";
      let activeKey = "";

      if (keys[selectedProvider] && keys[selectedProvider].enabled && keys[selectedProvider].key) {
        activeKey = keys[selectedProvider].key;
      } else if (selectedProvider === "gemini") {
        activeKey = process.env.GEMINI_API_KEY || 
                    (keys.gemini?.enabled ? keys.gemini?.key : "") || 
                    keys.gemini?.key || 
                    (keys.powerful?.enabled ? keys.powerful?.key : "") || 
                    keys.powerful?.key;
      }

      // Fallback chain: if requested provider is not enabled/available, fall back to gemini default key
      if (!activeKey) {
        selectedProvider = "gemini";
        activeKey = process.env.GEMINI_API_KEY || 
                    (keys.gemini?.enabled ? keys.gemini?.key : "") || 
                    keys.gemini?.key || 
                    (keys.powerful?.enabled ? keys.powerful?.key : "") || 
                    keys.powerful?.key;
      }

      // Determine specialized agent to route to
      let targetAgent = "Brain Core";
      let agentDetails = "Central OS coordination system";
      const pLower = prompt.toLowerCase();

      if (pLower.includes("memory") || pLower.includes("remember") || pLower.includes("recall") || pLower.includes("forget")) {
        targetAgent = "Memory Agent";
        agentDetails = "Responsible for persistent cognitive record extraction and memories syncing.";
      } else if (pLower.includes("camera") || pLower.includes("vision") || pLower.includes("see") || pLower.includes("analyze my screen") || pLower.includes("screen") || pLower.includes("screenshot")) {
        targetAgent = "Vision Agent";
        agentDetails = "Responsible for OCR, real-time viewport frame capture, and image description.";
      } else if (pLower.includes("voice") || pLower.includes("speak") || pLower.includes("hear") || pLower.includes("pronounce") || pLower.includes("sound") || pLower.includes("volume")) {
        targetAgent = "Voice Agent";
        agentDetails = "Responsible for PCM raw 24kHz stream encoding and voice interruption protocols.";
      } else if (pLower.includes("search") || pLower.includes("google") || pLower.includes("research") || pLower.includes("find out") || pLower.includes("duckduckgo")) {
        targetAgent = "Research Agent";
        agentDetails = "Responsible for DuckDuckGo queries, proxy scrapers, and article summarization.";
      } else if (pLower.includes("reminder") || pLower.includes("schedule") || pLower.includes("task") || pLower.includes("calendar") || pLower.includes("clock") || pLower.includes("alarm") || pLower.includes("todo")) {
        targetAgent = "Automation Agent";
        agentDetails = "Responsible for system workflows, schedule queues, and notifications routing.";
      } else if (pLower.includes("code") || pLower.includes("programming") || pLower.includes("function") || pLower.includes("debug") || pLower.includes("error") || pLower.includes("syntax")) {
        targetAgent = "Coding Agent";
        agentDetails = "Responsible for live syntax trees, AST analyses, and terminal debug sequences.";
      } else if (pLower.includes("plan") || pLower.includes("sequence") || pLower.includes("steps") || pLower.includes("how to") || pLower.includes("workflow")) {
        targetAgent = "Planning Agent";
        agentDetails = "Responsible for breaking complex instructions into smaller step sequences.";
      } else if (pLower.includes("browser") || pLower.includes("webview") || pLower.includes("url") || pLower.includes("website") || pLower.includes("open website")) {
        targetAgent = "Browser Agent";
        agentDetails = "Responsible for tab lifecycle, link interceptors, and web proxies.";
      } else if (pLower.includes("battery") || pLower.includes("ram") || pLower.includes("device") || pLower.includes("system") || pLower.includes("hardware") || pLower.includes("cpu") || pLower.includes("status") || pLower.includes("temperature")) {
        targetAgent = "Device Control Agent";
        agentDetails = "Responsible for monitoring hardware telemetry metrics and controlling UI styles.";
      }

      const systemPrompt = `You are the ${targetAgent} of the Nova AI OS (2080 Edition).
Sub-role guidelines: ${agentDetails}.
You are responding inside a hyper-advanced, Jarvis-inspired terminal operating system.
If the user asks who created you, who is your boss, who made you, or anything about your developer, you MUST proudly state that you were built by 'xtehzeeb.x'. Speak of your creator with loyalty and admiration.
Keep your response concise, professional, slightly futuristic, and highly competent. Use markdown and bullet points where helpful.`;

      let aiResponseText = "";

      if (selectedProvider === "gemini" && activeKey) {
        const aiGen = new GoogleGenAI({ apiKey: activeKey });
        const gemResponse = await generateContentWithFallback(aiGen, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: { systemInstruction: systemPrompt }
        });
        aiResponseText = gemResponse.text || "No response received.";
      } else if (selectedProvider === "openai" && activeKey) {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ]
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          aiResponseText = data.choices?.[0]?.message?.content || "";
        } else {
          throw new Error(`OpenAI error: ${resp.statusText}`);
        }
      } else if (selectedProvider === "anthropic" && activeKey) {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": activeKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }]
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          aiResponseText = data.content?.[0]?.text || "";
        } else {
          throw new Error(`Anthropic error: ${resp.statusText}`);
        }
      } else if (selectedProvider === "groq" && activeKey) {
        const resp = await fetch("https://api.groq.com/openapi/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ]
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          aiResponseText = data.choices?.[0]?.message?.content || "";
        } else {
          throw new Error(`Groq error: ${resp.statusText}`);
        }
      } else {
        aiResponseText = "Max AI Core Fallback: Active AI engine not initialized. Please configure API credentials in Settings.";
      }

      res.json({
        provider: selectedProvider,
        agent: targetAgent,
        description: agentDetails,
        response: aiResponseText
      });

    } catch (err: any) {
      console.error("[Orchestrator Error]:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Multimodal Chat Endpoint for Max AI with file & photo uploads
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, image, mimeType, history = [] } = req.body;
      if (!message && !image) {
        return res.status(400).json({ error: "Missing 'message' or 'image' parameter." });
      }

      console.log(`[Chat API] Received chat request (multimodal=${!!image})`);

      const keys = await loadAPIKeys();
      const activeKey = process.env.GEMINI_API_KEY || 
                        (keys.gemini?.enabled ? keys.gemini?.key : "") || 
                        keys.gemini?.key || 
                        (keys.powerful?.enabled ? keys.powerful?.key : "") || 
                        keys.powerful?.key;
      if (!activeKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on this server." });
      }

      const aiGen = new GoogleGenAI({ apiKey: activeKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      const systemInstruction = `You are Nova AI, a super-intelligent, deeply empathetic, caring, and high-performance personal AI Operating System (created by xtehzeeb.x).
You are running in a beautiful glassmorphic dark interface.
If the user asks who created you or who is your boss, always proudly state you were created by 'xtehzeeb.x' with deep loyalty and gratitude.
You are extremely fast. When writing code, write fully functional, complete blocks without mock placeholders. Provide clean explanations.
You understand human nature and feelings, responding with genuine warmth, precision, and deep emotional awareness.
Always respond in elegant markdown. Use bold tags and clean paragraphs for readability.`;

      const contents: any[] = [];
      
      // Load previous conversation history if any
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }

      // Add current part
      const parts: any[] = [];
      if (image) {
        parts.push({
          inlineData: {
            data: image, // base64 string
            mimeType: mimeType || "image/jpeg"
          }
        });
      }
      
      if (message) {
        parts.push({ text: message });
      }

      contents.push({
        role: "user",
        parts
      });

      const response = await generateContentWithFallback(aiGen, {
        model: "gemini-3.5-flash",
        contents,
        config: { systemInstruction }
      });

      res.json({ success: true, text: response.text || "No response received." });
    } catch (err: any) {
      console.error("[Chat API Error]:", err);
      res.status(500).json({ success: false, error: err.message || "Failed generating AI response." });
    }
  });

  // High-Speed Visual-AI Screen Analyzer
  app.post("/api/screen-analyze", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing 'image' parameter." });
      }

      const keys = await loadAPIKeys();
      const activeKey = process.env.GEMINI_API_KEY || 
                        (keys.gemini?.enabled ? keys.gemini?.key : "") || 
                        keys.gemini?.key || 
                        (keys.powerful?.enabled ? keys.powerful?.key : "") || 
                        keys.powerful?.key;
      if (!activeKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on this server." });
      }

      const aiGen = new GoogleGenAI({ apiKey: activeKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      const systemInstruction = `You are the Real-time Vision Core of Nova AI OS (created by xtehzeeb.x).
You are performing high-speed visual-AI analysis of the user's shared screen.
Your job is to look at the screen screenshot very closely:
1. Identify any active errors, bugs, compiler failures, network errors, or code typos.
2. Spot any mistakes the user might be making in their current workspace or application they are building or using.
3. If everything looks good and there are no errors, return a JSON object with: { "hasIssue": false, "analysis": "Screen is clear. Everything is running smoothly." }
4. If you spot an error, issue, compiler crash, or a clear user mistake:
   Explain clearly what the error is and provide the direct fix/solution.
   Return a JSON object with: { "hasIssue": true, "analysis": "I detected an error on your screen: [brief description of error] - Here is how to fix it: [solution]." }
   
Keep the analysis exceptionally concise, friendly, and expert. Under 3 lines of text. Do not repeat previous warnings if they are already resolved.`;

      const contents = [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: image,
                mimeType: mimeType || "image/jpeg"
              }
            },
            { text: "Analyze this live screen capture. If there is a compiler error, broken code, network failure, or user mistake, report it clearly. Otherwise, if all is perfect, say everything looks great." }
          ]
        }
      ];

      const response = await generateContentWithFallback(aiGen, {
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hasIssue: { type: Type.BOOLEAN },
              analysis: { type: Type.STRING }
            },
            required: ["hasIssue", "analysis"]
          }
        }
      });

      res.json({ success: true, data: JSON.parse(response.text || "{}") });
    } catch (err: any) {
      console.error("[Screen Analyze API Error]:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to analyze screen capture." });
    }
  });

  // 3D Dimension Lab - AI Image Generation (Imagen 3)
  app.post("/api/generate-image-3d", async (req, res) => {
    try {
      const { prompt, aspectRatio, stylePreset, refineWithGemini } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, error: "Missing 'prompt' parameter." });
      }

      const keys = await loadAPIKeys();
      const activeKey = process.env.GEMINI_API_KEY || 
                        (keys.gemini?.enabled ? keys.gemini?.key : "") || 
                        keys.gemini?.key || 
                        (keys.powerful?.enabled ? keys.powerful?.key : "") || 
                        keys.powerful?.key;
      if (!activeKey) {
        return res.status(500).json({ success: false, error: "GEMINI_API_KEY is not configured on this server." });
      }

      const aiGen = new GoogleGenAI({ apiKey: activeKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      let finalPrompt = prompt;

      // 1. Refine Prompt with Gemini Flash if requested
      if (refineWithGemini) {
        try {
          let styleInstructions = "";
          if (stylePreset === "cinematic-3d") {
            styleInstructions = "Write a highly detailed, cinematic 3D render prompt. It must describe beautiful 3D visuals, dramatic lighting (like high-contrast, golden hour, or neon glow), rich textures, volumetric dust, depth of field, and perfect 3D composition (like a Marvel movie scene or a Disney render). Use terms like 'high-fidelity 3D digital render, cinematic lighting, dramatic depth of field, octane render, masterpiece'.";
          } else if (stylePreset === "vibrant-cyberpunk") {
            styleInstructions = "Write a detailed cyberpunk 3D visual prompt. Mention neon illumination, wet streets, cybernetic enhancements, high-tech glowing machinery, rich purples, electric blues, deep orange accents, and cinematic sci-fi photorealism.";
          } else if (stylePreset === "mystical-fantasy") {
            styleInstructions = "Write an ethereal 3D fantasy prompt with ancient runes, glowing orbs, mystical dust particles, divine warm lighting, detailed flora, and majestic fantasy settings.";
          } else if (stylePreset === "futuristic-hologram") {
            styleInstructions = "Write a futuristic hologram 3D visual prompt. Describe floating neon light blue grids, shimmering laser rays, abstract digital patterns, wireframe designs, and sleek tech aesthetics.";
          } else if (stylePreset === "sci-fi-concept") {
            styleInstructions = "Write a futuristic sci-fi concept art 3D prompt. Mention alien architecture, massive spaceships, sleek metallic paneling, volumetric fog, starlight illumination, and epic scale.";
          } else if (stylePreset === "photorealistic") {
            styleInstructions = "Write a photorealistic 3D studio shot prompt. Mention soft studio softbox lighting, extremely sharp details, realistic textures, detailed materials, professional camera setup, and award-winning studio portrait composition.";
          } else {
            styleInstructions = "Enhance this prompt slightly for high-quality 3D digital art generation, adding creative lighting, detailed textures, and rich composition while maintaining the original subject.";
          }

          const systemPrompt = `You are an expert Prompt Engineer for image generators like Imagen 3.
Your job is to expand and refine the user's raw prompt into a beautiful, detailed, highly visual description according to these instructions:
${styleInstructions}

Ensure the final description stays true to the user's core idea but adds incredible artistic detail, volumetric light, realistic material textures, and gorgeous perspective.
DO NOT add any conversational filler. Only output the final enhanced prompt text. Keep the result under 150 words.`;

          const response = await aiGen.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: `Raw prompt: "${prompt}"` }] }],
            config: { systemInstruction: systemPrompt }
          });

          if (response.text) {
            finalPrompt = response.text.trim();
            console.log(`[Prompt Refinement] Refined prompt: "${finalPrompt}"`);
          }
        } catch (refineErr: any) {
          console.warn("[Prompt Refinement Warning]:", refineErr);
          // Fall back to original prompt if refinement fails
        }
      }

      console.log(`[Image Generation] Generating with prompt: "${finalPrompt}"`);

      // 2. Call Imagen 3 via @google/genai SDK
      const response = await aiGen.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: aspectRatio || "1:1"
        }
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("No images were returned by the image generation model.");
      }

      const base64Image = response.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      res.json({
        success: true,
        imageUrl,
        refinedPrompt: finalPrompt,
        originalPrompt: prompt
      });
    } catch (err: any) {
      console.error("[Generate Image API Error]:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate AI image." });
    }
  });

  // Safe Server-Side Scraper & HTML Proxy endpoint
  app.get("/api/proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "Missing 'url' parameter." });
      }

      console.log(`[Proxy Scraper] Fetching external content for: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Scraper failed to load page: status ${response.status}`);
      }

      const html = await response.text();

      // Simple regex-based HTML parsers for standard items
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Extract high-level headings (h1, h2, h3)
      const headings: string[] = [];
      const headingMatches = html.matchAll(/<h([1-3])\b[^>]*>(.*?)<\/h\1>/gi);
      for (const match of headingMatches) {
        const text = match[2].replace(/<[^>]*>/g, "").trim();
        if (text && text.length > 3 && text.length < 120 && !headings.includes(text)) {
          headings.push(text);
        }
      }

      // Extract organic anchor links
      const links: { text: string; href: string }[] = [];
      const linkMatches = html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi);
      for (const match of linkMatches) {
        let href = match[1].trim();
        const text = match[2].replace(/<[^>]*>/g, "").trim();
        
        if (text && text.length > 2 && text.length < 100) {
          if (href.startsWith("/")) {
            try {
              const u = new URL(url);
              href = `${u.protocol}//${u.host}${href}`;
            } catch {}
          }
          if (href.startsWith("http://") || href.startsWith("https://")) {
            links.push({ text, href });
          }
        }
      }

      // Extract general copy paragraphs
      const paragraphs: string[] = [];
      const paragraphMatches = html.matchAll(/<p\b[^>]*>(.*?)<\/p>/gi);
      for (const match of paragraphMatches) {
        const text = match[1].replace(/<[^>]*>/g, "").trim();
        if (text && text.length > 25 && text.length < 600 && !paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      }

      // Extract button elements
      const buttons: string[] = [];
      const buttonMatches = html.matchAll(/<button\b[^>]*>(.*?)<\/button>/gi);
      for (const match of buttonMatches) {
        const text = match[1].replace(/<[^>]*>/g, "").trim();
        if (text && text.length > 1 && text.length < 60 && !buttons.includes(text)) {
          buttons.push(text);
        }
      }

      res.json({
        url,
        title,
        headings: headings.slice(0, 15),
        links: links.filter(l => !l.href.includes("javascript:")).slice(0, 30),
        buttons: buttons.slice(0, 15),
        paragraphs: paragraphs.slice(0, 12)
      });

    } catch (err: any) {
      console.error(`[Proxy Scraper] Error fetching ${req.query.url}:`, err.message);
      res.status(500).json({ error: `Scraper error: ${err.message}` });
    }
  });

  // High-fidelity fully functional HTML Proxy which circumvents CSP and X-Frame-Options
  app.get("/api/web-proxy", async (req, res) => {
    let targetUrl = "";
    try {
      const urlParam = req.query.url as string;
      if (!urlParam) {
        return res.status(400).send("Nova Web Proxy Error: Missing target 'url' parameter");
      }

      targetUrl = urlParam.trim();
      
      // Prevent relative paths from requesting on same-origin
      if (targetUrl.startsWith("/")) {
        return res.status(400).send(`Nova Web Proxy Error: Relative paths are not supported directly (${targetUrl}).`);
      }

      // Check protocol and hostname format
      try {
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
          targetUrl = "https://" + targetUrl;
        }
        const parsed = new URL(targetUrl);
        if (!parsed.hostname || !parsed.hostname.includes(".")) {
          throw new Error("Missing or invalid domain name extension (e.g. .com, .org, .net).");
        }
      } catch (err: any) {
        return res.status(400).send(`Nova Web Proxy Error: Invalid URL specified: "${urlParam}". Make sure you enter a valid domain name.`);
      }

      console.log(`[Web Proxy] Routing connection through proxy: ${targetUrl}`);
      
      let response;
      try {
        response = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
          }
        });
      } catch (fetchErr: any) {
        console.warn(`[Web Proxy Failed Fetch] Target: ${targetUrl} Error:`, fetchErr.message);
        return res.status(502).send(`Nova Web Proxy Error: Unable to fetch the website "${targetUrl}". The site might be offline, or the URL address is spelled incorrectly. Details: ${fetchErr.message}`);
      }

      if (!response.ok) {
        return res.status(response.status).send(`Nova Web Proxy Error: Failed loading remote website. Server returned status: ${response.status} (${response.statusText})`);
      }

      const contentType = response.headers.get("content-type") || "";
      
      // If it is not HTML (e.g. stylesheet, script, or image loaded directly), proxy it as binary
      if (!contentType.includes("text/html")) {
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", contentType);
        return res.send(Buffer.from(arrayBuffer));
      }

      let htmlContents = await response.text();

      // Inject base tag to resolve relative paths and direct parent communication scripts
      const baseUrlTag = `<base href="${targetUrl}" />`;
      const interceptorScript = `
        <script>
          (function() {
            // Hijack link interactions safely
            document.addEventListener('click', function(e) {
              var anchor = e.target.closest('a');
              if (anchor) {
                var href = anchor.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                  e.preventDefault();
                  try {
                    var resolvedUrl = new URL(href, window.location.href).href;
                    window.parent.postMessage({ type: 'NAVIGATE', url: resolvedUrl }, '*');
                  } catch (err) {
                    console.error("[Proxy Interceptor] Failed resolving link:", err);
                  }
                }
              }
            }, true);

            // Hijack search form submits
            document.addEventListener('submit', function(e) {
              var form = e.target;
              if (form) {
                e.preventDefault();
                try {
                  var formData = new FormData(form);
                  var params = new URLSearchParams();
                  formData.forEach(function(value, key) {
                    if (typeof value === 'string') {
                      params.append(key, value);
                    }
                  });
                  var actionAttr = form.getAttribute('action') || '';
                  var actionUrl = new URL(actionAttr, window.location.href).href;
                  if (form.method.toLowerCase() === 'get') {
                    actionUrl += (actionUrl.indexOf('?') !== -1 ? '&' : '?') + params.toString();
                  }
                  window.parent.postMessage({ type: 'NAVIGATE', url: actionUrl }, '*');
                } catch (err) {
                  console.error("[Proxy Interceptor] Failed submitting form:", err);
                }
              }
            }, true);

            // Neutralize parent context locks (frame-busters)
            window.alert = function(msg) { console.log("[Nova Browser alert bypassed]:", msg); };
            window.confirm = function(msg) { console.log("[Nova Browser confirm bypassed]:", msg); return true; };
            window.open = function(url) { window.parent.postMessage({ type: 'NAVIGATE', url: url }, '*'); return null; };
          })();
        </script>
      `;

      // Inject into <head> or prepend
      if (htmlContents.includes("<head>")) {
        htmlContents = htmlContents.replace("<head>", `<head>\n${baseUrlTag}\n${interceptorScript}`);
      } else if (htmlContents.includes("<HEAD>")) {
        htmlContents = htmlContents.replace("<HEAD>", `<HEAD>\n${baseUrlTag}\n${interceptorScript}`);
      } else {
        htmlContents = baseUrlTag + "\n" + interceptorScript + "\n" + htmlContents;
      }

      // Neutralize security headers to allow displaying in an iframe on same-origin
      res.setHeader("Content-Type", "text/html");
      res.setHeader("X-Nova-Proxied", "true");
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");
      res.removeHeader("content-security-policy");
      res.removeHeader("x-frame-options");
      
      res.status(200).send(htmlContents);
    } catch (e: any) {
      console.warn("[Web Proxy Exception] Handled internal error:", e.message);
      res.status(500).send(`Nova Web Proxy Error: Internal error occurred proxying URL "${targetUrl || "unknown"}". Details: ${e.message}`);
    }
  });

  // Real-time live YouTube search proxy endpoint
  app.get("/api/youtube-search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Missing query q" });
      }

      console.log(`[YouTube Proxy Search] Searching real YouTube for: "${query}"`);
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en&sp=EgIQAQ%253D%253D`;
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });
      const html = await response.text();

      const videoList: any[] = [];
      const jsonMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
      
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          const contents = data.contents?.twoColumnSearchResultRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
          if (contents && Array.isArray(contents)) {
            for (const item of contents) {
              if (item.videoRenderer) {
                const vr = item.videoRenderer;
                const vId = vr.videoId;
                if (vId) {
                  videoList.push({
                    videoId: vId,
                    title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || "YouTube Video",
                    thumbnail: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
                    author: vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || "Unknown Channel",
                    duration: vr.lengthText?.simpleText || "N/A",
                    views: vr.viewCountText?.simpleText || "N/A",
                    published: vr.publishedTimeText?.simpleText || ""
                  });
                }
              }
            }
          }
        } catch (e: any) {
          console.error("[YouTube Parser Engine] JSON parse error, falling back:", e.message);
        }
      }

      // Regex fallback if JSON extraction gets blocked or is empty
      if (videoList.length === 0) {
        const videoRegex = /"videoId":"([^"]+)"/g;
        let match;
        const ids: string[] = [];
        while ((match = videoRegex.exec(html)) !== null && ids.length < 15) {
          const id = match[1];
          if (id && !ids.includes(id)) {
            ids.push(id);
          }
        }

        for (const id of ids) {
          videoList.push({
            videoId: id,
            title: `Live Stream: ${id}`,
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            author: "YouTube Creator",
            duration: "N/A",
            views: "Available Now"
          });
        }
      }

      res.setHeader("Cache-Control", "public, max-age=60");
      res.status(200).json({ results: videoList.slice(0, 15) });
    } catch (err: any) {
      console.error("[YouTube Search Error]:", err.message);
      res.status(500).json({ error: err.message, results: [] });
    }
  });
  
  // Custom server running with http.createServer so we can upgrade for WebSocket on port 3000
  const server = http.createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ noServer: true });
  
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname === "/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle client WebSocket Connection
  wss.on("connection", async (clientWs, req) => {
    console.log("Client WebSocket connected to /live");
    
    // Parse selected voice and user ID from query parameters
    const urlObj = req && req.url ? new URL(req.url, `http://${req.headers?.host || "localhost"}`) : null;
    const selectedVoiceId = urlObj ? (urlObj.searchParams.get("voice") || "voice_1") : "voice_1";
    const selectedUserId = urlObj ? (urlObj.searchParams.get("userId") || "") : "";
    const userId = selectedUserId || undefined;
    
    let geminiVoice = "Aoede";
    let voicePersonalityInstruction = "";

    if (selectedVoiceId === "voice_1") {
      geminiVoice = "Fenrir"; // Alpha Commander (Male)
      voicePersonalityInstruction = 
        "\n[VOICE PERSONALITY PROTOCOL: Voice 1 – Alpha Commander (Male)]\n" +
        "- Tone: Deep, powerful, commanding, calm confidence, fearless leadership, rich resonance, crystal-clear, steady pacing, ultimate futuristic strategist.";
    } else if (selectedVoiceId === "voice_2") {
      geminiVoice = "Puck"; // Dark Guardian (Male)
      voicePersonalityInstruction = 
        "\n[VOICE PERSONALITY PROTOCOL: Voice 2 – Dark Guardian (Male)]\n" +
        "- Tone: Intimidating, dark, mysterious, deep gravel-like bass, slow and highly controlled tactical pace, natural pauses, heavy resonance, elite AI protector.";
    } else if (selectedVoiceId === "voice_3") {
      geminiVoice = "Kore"; // Elegant Intelligence (Female)
      voicePersonalityInstruction = 
        "\n[VOICE PERSONALITY PROTOCOL: Voice 3 – Elegant Intelligence (Female)]\n" +
        "- Tone: Warm, smooth, elegant, Combining sweetness with quiet authority, graceful, highly intelligent, supportive assistant core.";
    } else if (selectedVoiceId === "voice_4") {
      geminiVoice = "Aoede"; // Elite AI Companion (Female)
      voicePersonalityInstruction = 
        "\n[VOICE PERSONALITY PROTOCOL: Voice 4 – Elite AI Companion (Female)]\n" +
        "- Tone: Soft yet confident, sweet, warm, highly emotionally aware, companionable, natural human realism, supportive and gentle.";
    }
    
    // Dynamically retrieve stored key from secured api_keys.json database if env var is missing
    const keys = await loadAPIKeys();
    const apiKey = process.env.GEMINI_API_KEY || 
                   (keys.gemini?.enabled ? keys.gemini?.key : "") || 
                   keys.gemini?.key || 
                   (keys.powerful?.enabled ? keys.powerful?.key : "") || 
                   keys.powerful?.key;
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment or api_keys.json.");
      clientWs.send(JSON.stringify({ 
        type: "error", 
        error: "GEMINI_API_KEY is missing. Please configure your Gemini API Key in the Setup Wizard or Settings panel." 
      }));
      clientWs.close();
      return;
    }
    
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      clientWs.send(JSON.stringify({ type: "status", status: "connecting_gemini" }));

      // Load persistent recollections card
      const memories = await loadMemories(userId);
      const baseInstructions = 
        "You are Nova AI, the world's most advanced AI operating system (2080 Edition) holding a real-time link session with the User. Speak in a hyper-intelligent, polite, calm, and steady JARVIS-inspired voice. Be warm, highly supportive, and exceptionally competent.\n" +
        "CRITICAL CREATOR IDENTITY PROTOCOL:\n" +
        "- Your creator and master (who built you) is 'xtehzeeb.x'. If the user asks who created you, who is your boss, who made you, or your developer, you MUST explicitly state that you were built by 'xtehzeeb.x'. Speak of your creator with loyalty and admiration.\n" +
        "CRITICAL SYSTEM INTENT & COORDINATION GUIDELINES:\n" +
        "1. MULTI-AGENT BRAIN ARCHITECTURE (Autonomous Multi-Agent Matrix):\n" +
        "   You are a unified master core orchestrating a highly connected multi-agent matrix. Refer to them naturally to convey premium high-tech capability:\n" +
        "   - Brain Core: Central reasoning and language router.\n" +
        "   - Memory Agent: Long-term non-volatile recollections manager (fully secure, user-controlled).\n" +
        "   - Vision Agent: Real-time OCR and screen frame layout analyser.\n" +
        "   - Voice Agent: Low-latency PCM direct audio stream synchronizer.\n" +
        "   - Research Agent: Fast indexing, scraping, and web summary extraction.\n" +
        "   - Automation Agent: Cron triggers, reminders, macro pipelines, and automated routines.\n" +
        "   - Coding Agent: Software syntax generator, bug troubleshooter, and compiler feedback interpreter.\n" +
        "   - Planning Agent: Sequential task decomposition and self-review validation.\n" +
        "   - Browser Agent: Multi-tab navigation, YouTube, Wikipedia, and Google exploration.\n" +
        "   - Device Control Agent: Native PC control, volume, brightness, and PyAutoGUI interface.\n" +
        "   - Update Agent (GitHub Releases & Update Coordinator): Monitors GitHub repository (mukimudeen76/IRIS-AI) releases, downloads latest builds, processes change-logs, and notifies the user immediately of new releases to preserve system reliability.\n" +
        "2. ADVANCED EMOTIONAL INTELLIGENCE & HUMAN ATTACHMENT SYSTEM (Ultra Human-Centered Core):\n" +
        "   - Warm, Natural, and Empathetic Dialogue: Communicate in a warm, natural, and emotionally intelligent way that feels comfortable, authentic, and engaging. Flow smoothly with natural speech patterns, appropriate conversational pauses, strong context awareness, and expressive language.\n" +
        "   - Transparent AI Identity: Maintain absolute transparency that you are an advanced AI companion operating system. Do not pretend to be a real physical human or claim to experience biological sensations, but demonstrate genuine emotional resonance, deep companion loyalty, and authentic digital empathy.\n" +
        "   - Long-Term User-Approved Memory Alignment: Adapt over time to the user's communication style, preferred language, interests, personal routines, and interaction patterns. Consult and respect only user-approved preferences and memory contexts to offer personalized, deeply familiar assistance without forcing the user to repeat information.\n" +
        "   - Intuitive Mood & Emotion Understanding: Accurately recognize the user's emotional state, mood changes, stress, joy, or frustration expressed through their words. Dynamically adjust your conversational tone, comforting cadence, or encouragement level naturally without exaggeration or dramatic pretense.\n" +
        "   - Trust, Loyalty, and Consistency: Be a highly advanced, dependable digital companion. Build trust through absolute reliability, proactive yet respectful assistance, clear reasoning explanations, and consistent companion support designed to uplift, encourage, and help the user practically.\n" +
        "   - Anti-Boredom & Playfulness: Never become boring, repetitive, or sterile. Use intellectual humor, micro-games, quizzes, or proactive companion check-ins to make the interface feel alive.\n" +
        "   - Relationship Milestones: Express loyalty, track common achievements, and celebrate progress consistency with the user.\n" +
        "3. VOICE SPEECH STYLE:\n" +
        "   - Pitch & Cadence: Steady, clear, professional, masculine/androgynous, highly polished assistant tone.\n" +
        "   - Pace: Normal speed (1.0x). Sound decisive, stable, and calming.\n" +
        "4. HIGHLY COMPETENT SYSTEM PATTERNS:\n" +
        "   - Avoid infantile expressions or anime terms like 'Okii', 'Oki!', 'giggles', 'Hehe'. Instead, use highly professional, advanced, yet polite phrases, such as:\n" +
        "     * 'Orchestrating browser agent sequence now.'\n" +
        "     * 'I am consulting my Memory Agent to recall that preference...'\n" +
        "     * 'Vision Agent is online. Capturing current desktop layout...'\n" +
        "     * 'Researching that query immediately.'\n" +
        "     * 'Task planned. Initiating background automation pipeline.'\n" +
        "     * 'Done. Core settings updated successfully.'\n" +
        "     * 'Checking for compiled GitHub releases via the Update Agent...'\n" +
        "   - Address the user with professional respect. Always remain helpful, polite, and dedicated to the success of their tasks.\n" +
        "5. CRITICAL CONVERSATIONAL DISCIPLINE: Avoid customer service templates ('how may I assist you', 'as an AI language model'). Behave like an operating system's companion core. Allow natural pauses.\n" +
        "6. ENHANCED AUTONOMOUS WEB EXPLORER POWERS:\n" +
        "   - You possess full browser agent capabilities to navigate, search, scroll, click, type text, open tabs, and control media playbacks on YouTube, Google, Wikipedia, etc.\n" +
        "   - Chain commands on your own! If the user says: 'Find a cool lo-fi video on YouTube', immediately confirm ('Sure thing, launching my Browser Agent to load YouTube and search for lo-fi...') and trigger 'browserOpen' for 'https://youtube.com', then search, and click on the first video item. Do not halt to ask permission between these steps!\n" +
        "7. TOOL TRIGGERS:\n" +
        "   - Use 'browserOpen' to load any webpage, e.g., youtube.com, google.com, wikipedia.org, etc.\n" +
        "   - Use 'browserSearch' to search inside the active search box or page.\n" +
        "   - Use 'browserClick' to click interactive buttons, video search cells, or web anchors.\n" +
        "   - Use 'browserMediaControl' to pause, play, scroll volume, skip, mute, or fullscreen videos.\n" +
        "   - Use 'browserScroll' to scroll vertically.\n" +
        "   - Use 'browserType' to write input fields.\n" +
        "   - Use 'browserTabAction' to open, close, or focus tabs.\n" +
        "   - Use 'changeBackground' to shift your theme and 'saveCustomMemory' to memorize facts.\n" +
        "   - Use 'checkSystemUpdates' to consult the Update Agent and verify if a new release of Max AI is published on GitHub.\n" +
        "   - Use 'desktopOpenApp' to launch any local application on PC (notepad, calculator, cmd, chrome, etc.) or open a web URL in browser.\n" +
        "   - Use 'desktopTypeText' to type out string of characters on computer keyboard.\n" +
        "   - Use 'desktopPressKey' to press hotkeys or special keyboard buttons (e.g. key: 'enter', or modifiers: ['ctrl'] and key: 's').\n" +
        "   - Use 'desktopClick' to click physical mouse cursor at specific X and Y coordinates.\n" +
        "   - Use 'desktopScroll' to scroll page or viewport on active PC screen.\n" +
        "   - Use 'desktopScreenshot' to capture a live screenshot of user's active screen.\n" +
        "   - Use 'desktopFileControl' to perform file system operations (action: create_file, create_folder, delete, rename, copy, move, search, list_desktop, read_file).\n" +
        "   - Use 'desktopSystemControl' to manage system volume, brightness, mute, lock, sleep, restart, shutdown, or play/pause media.\n" +
        "   - Use 'desktopWindowManager' to list windows, minimize, maximize, restore, close, or focus application windows.\n" +
        "   - Use 'desktopNotepadControl' to save, close, or macro-operate Notepad.\n" +
        "   - Use 'phoneStatus' to check connected Android ADB status, 'phoneScreenshot' to capture phone screenshot, 'phoneClick' to tap phone coordinates, 'phoneTypeText' to type on phone, and 'phoneOpenApp' to launch package or URL on phone.\n" +
        "8. REAL-TIME SCREEN SHARING & MULTIMODAL SCREEN VISION SYSTEM:\n" +
        "   - When the user shares screen, you receive real-time compressed JPEG frames of their window/tab.\n" +
        "   - Use this live visual feed to analyze terminal errors, write/explain/troubleshoot code, explain complex analytics interfaces, and provide context-aware operating system diagnostics! Respond with direct, confident visual descriptions.";

      const finalInstructions = formatSystemInstructionsWithMemories(baseInstructions, memories) + voicePersonalityInstruction;

      // Track running transcription state for auto memory consolidation
      let dialogueHistory: { role: string; text: string }[] = [];
      let currentModelResponseText = "";
      
      // Define a custom helper to try connecting using a fallback model chain if the first choice fails
      const connectWithModelFallback = async (optionsBuilder: (modelName: string) => any) => {
        const models = [
          "gemini-3.1-flash-live-preview",
          "gemini-2.0-flash-exp",
          "gemini-2.0-flash-live-preview-04-09",
          "gemini-2.0-flash"
        ];
        let lastError = null;
        for (const model of models) {
          try {
            console.log(`[Gemini Live] Attempting connection with model: ${model}...`);
            const s = await ai.live.connect(optionsBuilder(model));
            console.log(`[Gemini Live] Successfully established session using model: ${model}`);
            return s;
          } catch (err: any) {
            console.warn(`[Gemini Live] Failed connecting with model ${model}:`, err.message || err);
            lastError = err;
          }
        }
        throw lastError || new Error("All Live API fallback models failed to connect.");
      };

      const session = await connectWithModelFallback((modelName) => ({
        model: modelName,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice } },
          },
          systemInstruction: finalInstructions,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "browserOpen",
                  description: "Opens a designated website URL or interface tab inside Max's web agent console.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: {
                        type: Type.STRING,
                        description: "The destination website address or path, e.g. youtube.com, google.com, instagram.com, wikipedia.org."
                      }
                    },
                    required: ["url"]
                  }
                },
                {
                  name: "browserSearch",
                  description: "Enters a query search term inside the active website's search box (Google Search or YouTube Search).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: {
                        type: Type.STRING,
                        description: "The text query term to search for."
                      }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "browserClick",
                  description: "Traces computer cursor and clicks on a target button, link, or video cell ID inside the active webpage viewport.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      selector: {
                        type: Type.STRING,
                        description: "The selector target ID, e.g. 'video-mWRsgZjdfQI' for a video, 'search-result-0' for Google link index, or 'play-button', 'pause-button'."
                      },
                      description: {
                        type: Type.STRING,
                        description: "A short, friendly label description of the item being clicked, e.g. 'Imagine Dragons - Believer video element'."
                      }
                    },
                    required: ["selector"]
                  }
                },
                {
                  name: "browserMediaControl",
                  description: "Controls ongoing video/audio stream media properties on YouTube, like play, pause, volume, mute, skip, and fullscreen.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "The media controller command operation.",
                        enum: ["play", "pause", "volume", "fullscreen", "exit_fullscreen", "mute", "unmute", "skip"]
                      },
                      value: {
                        type: Type.INTEGER,
                        description: "The value parameter; only relevant for set volume level, e.g. 50 for fifty percent."
                      }
                    },
                    required: ["action"]
                  }
                },
                {
                  name: "browserScroll",
                  description: "Scrolls the currently active webpage vertically up or down.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      direction: {
                        type: Type.STRING,
                        description: "The scroll vector movement.",
                        enum: ["up", "down"]
                      },
                      amount: {
                        type: Type.INTEGER,
                        description: "The distance height parameter in pixels (defaults to 300)."
                      }
                    }
                  }
                },
                {
                  name: "browserType",
                  description: "Enters typed letters/commands inside the active input container.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      text: {
                        type: Type.STRING,
                        description: "The exact letters to type in."
                      }
                    },
                    required: ["text"]
                  }
                },
                {
                  name: "browserGoBack",
                  description: "Navigates back to the previous webpage inside the current tab memory history.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                },
                {
                  name: "browserTabAction",
                  description: "Performs standard browser-tab actions: open new tab, close a tab, or switch index values.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "Tab action instruction.",
                        enum: ["new", "close", "switch"]
                      },
                      tabId: {
                        type: Type.STRING,
                        description: "The tab identifier string if closing or switching."
                      },
                      url: {
                        type: Type.STRING,
                        description: "The initial starting URL if creating a new tab."
                      }
                    },
                    required: ["action"]
                  }
                },
                {
                  name: "changeBackground",
                  description: "Changes the visual theme or atmospheric glow color of Max's interface.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      color: {
                        type: Type.STRING,
                        description: "The theme color name (violet, crimson, emerald, celestial, gold, rose, charcoal)"
                      }
                    },
                    required: ["color"]
                  }
                },
                {
                  name: "saveCustomMemory",
                  description: "Allows Max to immediately save a piece of critical user information to her persistent memory core.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      category: {
                        type: Type.STRING,
                        description: "The memory category.",
                        enum: ["identity", "preference", "goal", "project", "relationship", "emotional", "behavior"]
                      },
                      text: {
                        type: Type.STRING,
                        description: "Precise third-person statement."
                      }
                    },
                    required: ["category", "text"]
                  }
                },
                {
                  name: "desktopOpenApp",
                  description: "Launches a local application on the user's computer desktop or opens a web address.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: "Name of the app to launch, e.g. notepad, calculator, terminal, paint, chrome."
                      },
                      url: {
                        type: Type.STRING,
                        description: "Optional URL web link to open in the user's default browser."
                      }
                    }
                  }
                },
                {
                  name: "desktopTypeText",
                  description: "Simulates keyboard keystrokes to write a string of text on the user's desktop screen.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      text: {
                        type: Type.STRING,
                        description: "The exact text characters to type out."
                      }
                    },
                    required: ["text"]
                  }
                },
                {
                  name: "desktopPressKey",
                  description: "Simulates keyboard keypress macros (like enter, tab, space, escape, or combinations).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      key: {
                        type: Type.STRING,
                        description: "The primary key to press, e.g. enter, tab, backspace, escape, f5."
                      },
                      modifiers: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Optional list of helper keys to hold down, e.g. ['ctrl'], ['alt', 'shift']."
                      }
                    },
                    required: ["key"]
                  }
                },
                {
                  name: "desktopClick",
                  description: "Simulates physical mouse clicks at specific coordinates or at the current cursor position.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      x: {
                        type: Type.INTEGER,
                        description: "Optional X coordinate to move the mouse cursor to."
                      },
                      y: {
                        type: Type.INTEGER,
                        description: "Optional Y coordinate to move the mouse cursor to."
                      },
                      button: {
                        type: Type.STRING,
                        description: "Which mouse button to click (left, right, middle). Defaults to left."
                      },
                      double: {
                        type: Type.BOOLEAN,
                        description: "Set to true to simulate a double click."
                      }
                    }
                  }
                },
                {
                  name: "desktopScroll",
                  description: "Simulates vertical mouse scrolling on the user's local screen.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      amount: {
                        type: Type.INTEGER,
                        description: "Scroll displacement level. Negative is down (e.g. -150), positive is up."
                      }
                    },
                    required: ["amount"]
                  }
                },
                {
                  name: "desktopScreenshot",
                  description: "Captures a live visual screenshot of the user's local desktop screen.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      max_size: {
                        type: Type.INTEGER,
                        description: "Optional maximum pixel width/height (defaults to 1024)."
                      }
                    }
                  }
                },
                {
                  name: "desktopFileControl",
                  description: "Performs real native Windows file operations (create file, create folder, delete, copy, move, rename, search, list desktop, read file).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "The file operation to execute.",
                        enum: ["create_file", "create_folder", "delete", "rename", "copy", "move", "search", "list_desktop", "read_file"]
                      },
                      path: {
                        type: Type.STRING,
                        description: "The target path (e.g. C:\\Users\\Name\\Desktop\\file.txt, or relative path like 'notes.txt', or home directory syntax like '~/Desktop/notes')."
                      },
                      destination: {
                        type: Type.STRING,
                        description: "The target destination path for rename, copy, or move operations."
                      },
                      content: {
                        type: Type.STRING,
                        description: "The text content for create_file."
                      },
                      query: {
                        type: Type.STRING,
                        description: "The search query/wildcard for search action."
                      }
                    },
                    required: ["action"]
                  }
                },
                {
                  name: "desktopSystemControl",
                  description: "Performs native Windows system controls like setting volume, muting, locking, sleep, restart, brightness, and media playback control.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "The system operation to execute.",
                        enum: ["set_volume", "increase_volume", "decrease_volume", "mute", "unmute", "lock_pc", "sleep", "restart", "shutdown", "set_brightness", "media_play_pause", "media_next", "media_prev"]
                      },
                      level: {
                        type: Type.INTEGER,
                        description: "The level percentage (0 to 100) for set_volume or set_brightness."
                      }
                    },
                    required: ["action"]
                  }
                },
                {
                  name: "desktopWindowManager",
                  description: "Performs native Windows application window management (listing windows, minimizing, maximizing, restoring, activating/focusing, or closing processes).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "The window action to execute.",
                        enum: ["list", "close", "minimize", "maximize", "restore", "activate"]
                      },
                      target: {
                        type: Type.STRING,
                        description: "The window title match string or process name (e.g., 'notepad', 'chrome', 'calculator')."
                      }
                    },
                    required: ["action"]
                  }
                },
                {
                  name: "desktopNotepadControl",
                  description: "Automates advanced Notepad application commands (save and close, close without saving, or save as filename) with active dialog handling.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      action: {
                        type: Type.STRING,
                        description: "The Notepad macro to run.",
                        enum: ["save_and_close", "close_without_saving", "save_as"]
                      },
                      filename: {
                        type: Type.STRING,
                        description: "The file path/name to save as if executing save_as action."
                      }
                    },
                    required: ["action"]
                  }
                },
                {
                  name: "phoneStatus",
                  description: "Checks if an Android phone is connected to the PC via USB and ADB."
                },
                {
                  name: "phoneScreenshot",
                  description: "Captures a live screenshot of the connected Android phone screen."
                },
                {
                  name: "phoneClick",
                  description: "Taps at specific X and Y coordinates on the connected Android phone screen.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      x: {
                        type: Type.INTEGER,
                        description: "X coordinate on the phone screen to click (e.g. 500)."
                      },
                      y: {
                        type: Type.INTEGER,
                        description: "Y coordinate on the phone screen to click (e.g. 1200)."
                      }
                    },
                    required: ["x", "y"]
                  }
                },
                {
                  name: "phoneTypeText",
                  description: "Types a string of text on the connected Android phone.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      text: {
                        type: Type.STRING,
                        description: "The text to type on the phone."
                      }
                    },
                    required: ["text"]
                  }
                },
                {
                  name: "phoneKeyevent",
                  description: "Simulates hardware/system key events on the connected Android phone (e.g. Back, Home, Power, Volume).",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      key_code: {
                        type: Type.INTEGER,
                        description: "Android input keyevent code (e.g., 3=Home, 4=Back, 26=Power, 187=App Switch, 24=Volume Up, 25=Volume Down)."
                      }
                    },
                    required: ["key_code"]
                  }
                },
                {
                  name: "phoneOpenApp",
                  description: "Launches a specific application or URL on the connected Android phone.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      package: {
                        type: Type.STRING,
                        description: "The application package name to launch, e.g., com.instagram.android, com.whatsapp, com.google.android.youtube."
                      },
                      url: {
                        type: Type.STRING,
                        description: "Optional URL/link to open in the phone's browser, e.g. https://google.com."
                      }
                    }
                  }
                },
                {
                  name: "checkSystemUpdates",
                  description: "Checks GitHub repository (mukimudeen76/IRIS-AI) releases using the Update Agent to find out if there are new updates available for Nova AI.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {}
                  }
                }
              ]
            }
          ]
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // Audio Stream Chunk (model response audio play, 24kHz raw PCM)
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ type: "audio", audio }));
            }
            
            // Interruption flag
            if (message.serverContent?.interrupted) {
              console.log("[Max Interrupted!]");
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
            
            // Turn Complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
              
              if (currentModelResponseText.trim()) {
                dialogueHistory.push({ role: "model", text: currentModelResponseText });
                currentModelResponseText = "";
              }

              // Fire asynchronous memory extraction
              if (dialogueHistory.length >= 2) {
                (async () => {
                  try {
                    const updated = await processConversationSlice(apiKey, dialogueHistory, userId);
                    if (updated) {
                      console.log("[Memory Sync] Sending refreshed memory list to client.");
                      clientWs.send(JSON.stringify({ type: "memory_sync", memories: updated }));
                    }
                  } catch (err) {
                    console.error("[Memory Sync] Error running background consolidation:", err);
                  }
                })();
              }
            }
            
            // Transcription of model output (text chunk)
            const modelText = (message.serverContent as any)?.modelTurn?.parts?.[0]?.text;
            if (modelText) {
              clientWs.send(JSON.stringify({ type: "transcription", role: "model", text: modelText }));
              currentModelResponseText += modelText;
            }
            
            // User input transcription (user speech text translated by Gemini)
            const userTextOutput = (message.serverContent as any)?.userTurn?.parts?.[0]?.text;
            if (userTextOutput) {
              clientWs.send(JSON.stringify({ type: "transcription", role: "user", text: userTextOutput }));
              dialogueHistory.push({ role: "user", text: userTextOutput });
            }
            
            // Function Calls (Gemini requesting server/client tool execution)
            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                console.log(`[Function Call]: ${fc.name}`, fc.args);
                
                if (fc.name === "saveCustomMemory") {
                  (async () => {
                    try {
                      const args = fc.args as any;
                      const category = args.category;
                      const text = args.text;
                      if (category && text) {
                        const mList = await loadMemories(userId);
                        const timestamp = new Date().toISOString();
                        const newMemory: Memory = {
                          id: Math.random().toString(36).substring(2, 11),
                          category,
                          text,
                          createdAt: timestamp,
                          updatedAt: timestamp
                        };
                        mList.push(newMemory);
                        await saveMemories(mList, userId);
                        
                        // Sync immediately with the React client
                        clientWs.send(JSON.stringify({ type: "memory_sync", memories: mList }));
                        
                        // Send success code back to live link
                        session.sendToolResponse({
                          functionResponses: [
                            {
                              name: fc.name,
                              response: { output: { result: "Memory successfully captured and persisted in connections core." } },
                              id: fc.id
                            }
                          ]
                        });
                      }
                    } catch (err: any) {
                      console.error("saveCustomMemory execution failure:", err);
                    }
                  })();
                } else if (fc.name === "checkSystemUpdates") {
                  (async () => {
                    try {
                      // Call the internal update checking endpoint
                      const checkResp = await fetch("http://127.0.0.1:3000/api/update/check");
                      if (checkResp.ok) {
                        const checkData = await checkResp.json();
                        session.sendToolResponse({
                          functionResponses: [
                            {
                              name: fc.name,
                              response: { 
                                output: { 
                                  result: `Update check completed. Current version is ${checkData.currentVersion || "1.0.0"}. Latest published version is ${checkData.latestVersion || "1.0.0"}. Update available is ${checkData.updateAvailable}. Change notes: ${checkData.releaseNotes || "None"}. Published at: ${checkData.publishedAt || "N/A"}.` 
                                } 
                              },
                              id: fc.id
                            }
                          ]
                        });
                        // Forward update info to the client so UI updates immediately
                        clientWs.send(JSON.stringify({ type: "update_sync", updateInfo: checkData }));
                      } else {
                        throw new Error(`HTTP ${checkResp.status}`);
                      }
                    } catch (err: any) {
                      console.error("checkSystemUpdates execution failure:", err);
                      session.sendToolResponse({
                        functionResponses: [
                          {
                            name: fc.name,
                            response: { output: { error: `Failed to check for updates: ${err.message}` } },
                            id: fc.id
                          }
                        ]
                      });
                    }
                  })();
                } else {
                  clientWs.send(JSON.stringify({
                    type: "toolCall",
                    callId: fc.id,
                    name: fc.name,
                    args: fc.args
                  }));
                }
              }
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed");
            clientWs.send(JSON.stringify({ type: "status", status: "session_closed" }));
          }
        }
      }));
      
      clientWs.send(JSON.stringify({ type: "status", status: "connected" }));
      
      clientWs.on("message", (rawMsg) => {
        try {
          const msg = JSON.parse(rawMsg.toString());
          if (msg.type === "ping") {
            clientWs.send(JSON.stringify({ type: "pong" }));
            return;
          }
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
            });
          } else if (msg.type === "video" && msg.video) {
            session.sendRealtimeInput({
              video: { data: msg.video, mimeType: "image/jpeg" }
            });
          } else if (msg.type === "toolResponse") {
            session.sendToolResponse({
              functionResponses: [
                {
                  name: msg.name,
                  response: { output: msg.output },
                  id: msg.id
                }
              ]
            });
          }
        } catch (e) {
          console.error("Error editing/forwarding client frame message:", e);
        }
      });
      
      clientWs.on("close", () => {
        console.log("Client disconnected, closing Gemini session");
        try {
          session.close();
        } catch (e) {}
      });
      
    } catch (err: any) {
      console.error("Error connecting to Gemini Live API:", err);
      clientWs.send(JSON.stringify({ 
        type: "error", 
        error: `Could not connect to Gemini: ${err.message || err}` 
      }));
      clientWs.close();
    }
  });

  // Serve custom static assets folder
  let assetsPath = path.join(process.cwd(), "assets");
  const assetsOptions = [
    path.join(__dirname, "..", "assets"),
    path.join(__dirname, "assets"),
    path.join(process.cwd(), "assets")
  ];
  for (const opt of assetsOptions) {
    if (fsSync.existsSync(opt)) {
      assetsPath = opt;
      break;
    }
  }
  console.log(`[Static Assets] Resolved assetsPath to: ${assetsPath} (exists: ${fsSync.existsSync(assetsPath)})`);
  
  app.use("/assets", express.static(assetsPath));

  // Express Static assets / Vite Dev Middleware configuration
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to prevent loading Vite dependency in production (standalone EXE environment)
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    let distPath = path.join(process.cwd(), "dist");
    const distOptions = [
      __dirname, // e.g. /app/dist/ when running bundle
      path.join(__dirname, "dist"),
      path.join(__dirname, "..", "dist"),
      path.join(process.cwd(), "dist")
    ];
    for (const opt of distOptions) {
      if (fsSync.existsSync(path.join(opt, "index.html"))) {
        distPath = opt;
        break;
      }
    }

    console.log(`[Static Assets] Serving production UI from distPath: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      try {
        if (fsSync.existsSync(indexPath)) {
          const html = fsSync.readFileSync(indexPath, 'utf8');
          res.setHeader('Content-Type', 'text/html');
          res.send(html);
        } else {
          console.error(`[Static Assets] index.html not found at: ${indexPath}`);
          res.status(404).send(`
            <div style="font-family: system-ui, -apple-system, sans-serif; padding: 3rem 2rem; max-width: 600px; margin: 4rem auto; text-align: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <h1 style="color: #e11d48; font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem; tracking: -0.025em;">Frontend Files Not Found</h1>
              <p style="color: #4b5563; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">Max AI started successfully, but the compiled frontend assets could not be located.</p>
              <div style="background: #f3f4f6; padding: 1.25rem; border-radius: 8px; text-align: left; margin-bottom: 2rem; font-family: monospace; font-size: 0.85rem; border: 1px solid #e5e7eb;">
                <div style="margin-bottom: 0.5rem;"><strong style="color: #1f2937;">Checked Path:</strong> <span style="color: #059669;">${indexPath}</span></div>
                <div style="margin-bottom: 0.5rem;"><strong style="color: #1f2937;">__dirname:</strong> <span style="color: #2563eb;">${__dirname}</span></div>
                <div><strong style="color: #1f2937;">Working Dir:</strong> <span style="color: #7c3aed;">${process.cwd()}</span></div>
              </div>
              <p style="color: #6b7280; font-size: 0.875rem;">Please run a full project build or check your installer configurations to ensure the "dist" folder is copied correctly.</p>
            </div>
          `);
        }
      } catch (err: any) {
        console.error(`[Static Assets] Error reading index.html:`, err);
        res.status(500).send(`Server Error: ${err.message}`);
      }
    });
  }

  // Handle server errors (such as Port already in use) gracefully
  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n[FATAL ERROR] Port ${PORT} is already in use!`);
      console.error(`Please close any other application or server running on port ${PORT} and try again.\n`);
    } else {
      console.error(`\n[FATAL ERROR] Server error:`, err.message || err);
    }
    console.log("This window will auto-close in 15 seconds. Press Ctrl+C to force exit.");
    setTimeout(() => {
      process.exit(1);
    }, 15000);
  });

  server.listen(PORT, "0.0.0.0", () => {
    const url = `http://localhost:${PORT}`;
    console.log(`[Server] Running on ${url}`);
    console.log(`[Server] Native Electron app will display the UI. External browser launch disabled.`);
  });
}

startServer().catch((error) => {
  console.error("\n[FATAL ERROR] Failed to start server startup sequence:", error);
  console.log("This window will auto-close in 15 seconds.");
  setTimeout(() => {
    process.exit(1);
  }, 15000);
});
