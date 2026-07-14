import { ipcMain } from 'electron';
import { registerVoiceHandlers } from '../services/voice-agent';
import { registerMemoryHandlers } from '../services/memory-service';
import { registerOCRHandlers } from '../utils/ocr';
import { registerADBHandlers } from '../services/adb-service';
import { registerWindowHandlers } from '../services/window-manager';
import { registerTerminalHandlers } from '../services/terminal-service';
import { registerFileHandlers } from '../services/file-service';

export function initializeIPC() {
  console.log('[IPC] 🚀 NEURAL CORE INITIALIZATION SEQUENCE');
  console.log('[IPC] ========================================');
  
  registerVoiceHandlers();
  console.log('[IPC] ✓ Voice Agent System');
  
  registerMemoryHandlers();
  console.log('[IPC] ✓ Memory & Vector DB');
  
  registerOCRHandlers();
  console.log('[IPC] ✓ Screen Capture & OCR');
  
  registerADBHandlers();
  console.log('[IPC] ✓ Mobile ADB Telekinesis');
  
  registerWindowHandlers();
  console.log('[IPC] ✓ Window Manager');
  
  registerTerminalHandlers();
  console.log('[IPC] ✓ Terminal Execution');
  
  registerFileHandlers();
  console.log('[IPC] ✓ File System Operations');
  
  ipcMain.handle('system:info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      memory: require('os').totalmem(),
      timestamp: Date.now(),
    };
  });
  
  console.log('[IPC] ✓ System Information');
  console.log('[IPC] ========================================');
  console.log('[IPC] 🟢 ALL SYSTEMS ONLINE - READY FOR EXECUTION');
}

export { ipcMain };