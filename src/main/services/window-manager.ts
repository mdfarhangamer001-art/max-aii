import { ipcMain, BrowserWindow } from 'electron';
import * as ChildProcess from 'child_process';

class WindowManager {
  async getActiveWindow(): Promise<{ title: string; pid: number } | null> {
    try {
      if (process.platform === 'win32') {
        const { exec } = ChildProcess;
        return new Promise((resolve) => {
          exec('Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object -First 1 MainWindowTitle, Id', 
            { shell: 'powershell' }, 
            (error, stdout) => {
              if (error) resolve(null);
              const parts = stdout.trim().split('\n');
              resolve({
                title: parts[0] || 'Unknown',
                pid: parseInt(parts[1]) || 0,
              });
            }
          );
        });
      }
      return null;
    } catch (error) {
      console.error('[WINDOW_MANAGER] Error getting active window:', error);
      return null;
    }
  }

  async moveWindow(pid: number, x: number, y: number): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        const { exec } = ChildProcess;
        const ps = `[DllImport(\"user32.dll\")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags); $hwnd = (Get-Process -Id ${pid}).MainWindowHandle; [Program]::SetWindowPos($hwnd, [IntPtr]::Zero, ${x}, ${y}, 0, 0, 3);`;
        return new Promise((resolve) => {
          exec(ps, { shell: 'powershell' }, (error) => {
            resolve(!error);
          });
        });
      }
      return false;
    } catch (error) {
      console.error('[WINDOW_MANAGER] Move error:', error);
      return false;
    }
  }

  async resizeWindow(pid: number, width: number, height: number): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        const { exec } = ChildProcess;
        const ps = `$hwnd = (Get-Process -Id ${pid}).MainWindowHandle; [Program]::SetWindowPos($hwnd, [IntPtr]::Zero, 0, 0, ${width}, ${height}, 2);`;
        return new Promise((resolve) => {
          exec(ps, { shell: 'powershell' }, (error) => {
            resolve(!error);
          });
        });
      }
      return false;
    } catch (error) {
      console.error('[WINDOW_MANAGER] Resize error:', error);
      return false;
    }
  }

  async minimizeWindow(pid: number): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        const { exec } = ChildProcess;
        const ps = `(Get-Process -Id ${pid}).MainWindowHandle | ForEach-Object {[Program]::ShowWindow($_, 6)};`;
        return new Promise((resolve) => {
          exec(ps, { shell: 'powershell' }, (error) => {
            resolve(!error);
          });
        });
      }
      return false;
    } catch (error) {
      console.error('[WINDOW_MANAGER] Minimize error:', error);
      return false;
    }
  }

  async maximizeWindow(pid: number): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        const { exec } = ChildProcess;
        const ps = `(Get-Process -Id ${pid}).MainWindowHandle | ForEach-Object {[Program]::ShowWindow($_, 3)};`;
        return new Promise((resolve) => {
          exec(ps, { shell: 'powershell' }, (error) => {
            resolve(!error);
          });
        });
      }
      return false;
    } catch (error) {
      console.error('[WINDOW_MANAGER] Maximize error:', error);
      return false;
    }
  }
}

const windowManager = new WindowManager();

export function registerWindowHandlers() {
  ipcMain.handle('window:get-active', async () => {
    const window = await windowManager.getActiveWindow();
    return window;
  });

  ipcMain.handle('window:move', async (event, pid: number, x: number, y: number) => {
    const success = await windowManager.moveWindow(pid, x, y);
    return { success };
  });

  ipcMain.handle('window:resize', async (event, pid: number, w: number, h: number) => {
    const success = await windowManager.resizeWindow(pid, w, h);
    return { success };
  });

  ipcMain.handle('window:minimize', async (event, pid: number) => {
    const success = await windowManager.minimizeWindow(pid);
    return { success };
  });

  ipcMain.handle('window:maximize', async (event, pid: number) => {
    const success = await windowManager.maximizeWindow(pid);
    return { success };
  });
}

export { WindowManager, windowManager };