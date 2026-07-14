import { ipcMain } from 'electron';
import { registerVoiceHandlers } from '../services/voice-agent';
import { registerMemoryHandlers } from '../services/memory-service';
import { registerOCRHandlers } from '../utils/ocr';

export function initializeIPC() {
  console.log('[IPC] Initializing all handlers...');
  
  registerVoiceHandlers();
  console.log('[IPC] ✓ Voice handlers registered');
  
  registerMemoryHandlers();
  console.log('[IPC] ✓ Memory handlers registered');
  
  registerOCRHandlers();
  console.log('[IPC] ✓ OCR handlers registered');
  
  // Global system info
  ipcMain.handle('system:info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      memory: require('os').totalmem(),
      timestamp: Date.now(),
    };
  });
  
  console.log('[IPC] ✓ System handlers registered');
}

export { ipcMain };