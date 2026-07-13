const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const { signInWithGoogleDesktop } = require('./googleAuth.cjs');

// Disable security warnings in console for clean operation
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
process.env.ELECTRON_RUNNING = 'true';
process.env.NODE_ENV = 'production';

let mainWindow = null;
let companionWindow = null;

function createCompanionWindow() {
  if (companionWindow) {
    companionWindow.focus();
    return;
  }

  companionWindow = new BrowserWindow({
    width: 300,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  companionWindow.loadURL('http://127.0.0.1:3000/?view=companion');
  companionWindow.setMenu(null);

  companionWindow.on('closed', () => {
    companionWindow = null;
  });
}

function closeCompanionWindow() {
  if (companionWindow) {
    companionWindow.close();
    companionWindow = null;
  }
}

// Global expose for server-side endpoints
global.electronApp = {
  toggleCompanion: (show) => {
    if (show) {
      createCompanionWindow();
    } else {
      closeCompanionWindow();
    }
  }
};

// Listen to ipc messages from React renderer
ipcMain.on('toggle-companion-window', (event, show) => {
  console.log(`[Electron Main] Received toggle-companion-window: ${show}`);
  if (show) {
    createCompanionWindow();
  } else {
    closeCompanionWindow();
  }
});

function createSecondaryWindow(url) {
  const secWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Max - Embedded Frame",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });
  
  secWindow.loadURL(url);
  secWindow.setMenu(null); // Clean menu-less look
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Max",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Allows Same-Origin bypass for web automation inside the iframe!
    }
  });

  // Remove the default Electron application menu bar
  mainWindow.setMenu(null);

  // Maximize the window immediately so that it fills the entire screen on startup!
  mainWindow.maximize();

  // Handle F11 key shortcut to toggle true immersive full-screen mode
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  // Start our bundled Express server inside the Electron main process
  try {
    require('./dist/server.cjs');
    console.log("[Electron Main] Express backend server required successfully.");
  } catch (err) {
    console.error("[Electron Main] Failed to require dist/server.cjs:", err);
  }

  // Set up header interceptor to strip anti-framing headers (X-Frame-Options & CSP)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    // De-restrict frame ancestors and framing policies so Google & YouTube load inside our React iframe
    const headersToRemove = [
      'x-frame-options',
      'content-security-policy',
      'content-security-policy-report-only'
    ];
    
    for (const key of Object.keys(responseHeaders)) {
      if (headersToRemove.includes(key.toLowerCase())) {
        delete responseHeaders[key];
      }
    }
    
    callback({
      cancel: false,
      responseHeaders
    });
  });

  // Intercept any target="_blank" link clicks or window.open calls
  // Render them in our secure secondary BrowserWindow instead of launching default system browser!
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log(`[Electron Main] Intercepted window open request for: ${url}. Routing to secondary app frame.`);
    createSecondaryWindow(url);
    return { action: 'deny' }; // Block default external browser launch
  });

  // Load our Express React app served on port 3000
  const appUrl = 'http://127.0.0.1:3000';
  
  function loadUrlWithRetry() {
    if (!mainWindow) return;
    mainWindow.loadURL(appUrl).then(() => {
      console.log(`[Electron Main] Successfully connected and loaded: ${appUrl}`);
    }).catch((err) => {
      console.log("[Electron Main] Server not ready yet, retrying in 200ms...");
      setTimeout(loadUrlWithRetry, 200);
    });
  }
  
  loadUrlWithRetry();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single-instance lock to prevent duplicate app windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    ipcMain.handle('google-signin', async () => {
      console.log('[Electron Main] Received google-signin request over IPC');
      return signInWithGoogleDesktop();
    });

    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
