import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const server = express();
const PORT = 5173;

// ==================== EXPRESS BACKEND ====================
server.use(express.json());

server.get('/api/health', (req, res) => {
  res.json({ status: 'NEURAL CORE ONLINE', timestamp: Date.now() });
});

const httpServer = server.listen(PORT, () => {
  console.log(`[MAX-AII] Express server running on :${PORT}`);
});

// ==================== WEBSOCKET FOR REAL-TIME ====================
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  console.log('[MAX-AII] WebSocket client connected');
  ws.send(JSON.stringify({ type: 'CONNECT', message: 'NEURAL UPLINK ESTABLISHED' }));
  
  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    console.log('[MAX-AII] WS Message:', data.type);
  });
  
  ws.on('close', () => console.log('[MAX-AII] WebSocket client disconnected'));
});

// ==================== ELECTRON MAIN PROCESS ====================
app.on('ready', createWindow);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: join(__dirname, '../preload/index.ts'),
      contextIsolation: true,
      nodeIntegration: false,
      
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ==================== IPC BRIDGE EXPORTS ====================
export { ipcMain, mainWindow };
export { wss };
