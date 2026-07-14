import { ipcMain } from 'electron';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface AndroidDevice {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'offline' | 'unauthorized';
  battery: number;
  storage: number;
  isWiFi: boolean;
}

interface ADBCommand {
  command: string;
  args: string[];
}

class ADBService {
  private connectedDevices: Map<string, AndroidDevice> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      const { stdout } = await execAsync('adb --version');
      console.log('[ADB] Initialized:', stdout.split('\n')[0]);
      this.isInitialized = true;
      await this.scanDevices();
    } catch (error) {
      console.error('[ADB] Initialization failed - ensure Android SDK Platform Tools are installed');
    }
  }

  async scanDevices(): Promise<AndroidDevice[]> {
    try {
      const { stdout } = await execAsync('adb devices -l');
      const devices: AndroidDevice[] = [];
      
      const lines = stdout.split('\n').slice(1);
      for (const line of lines) {
        if (line.trim()) {
          const match = line.match(
            /(\S+)\s+\w+\s+.*model:(\S+).*device:(\S+)/
          );
          if (match) {
            const [, id, model, device] = match;
            const device_obj: AndroidDevice = {
              id,
              name: device,
              model,
              status: 'online',
              battery: 0,
              storage: 0,
              isWiFi: id.includes(':'),
            };
            devices.push(device_obj);
            this.connectedDevices.set(id, device_obj);
          }
        }
      }
      return devices;
    } catch (error) {
      console.error('[ADB] Scan error:', error);
      return [];
    }
  }

  async executeCommand(deviceId: string, command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`adb -s ${deviceId} shell ${command}`);
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`ADB Command failed: ${error.message}`);
    }
  }

  async getBatteryLevel(deviceId: string): Promise<number> {
    try {
      const output = await this.executeCommand(deviceId, 'dumpsys battery');
      const match = output.match(/current level: (\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      console.error('[ADB] Battery query failed');
      return 0;
    }
  }

  async openApp(deviceId: string, packageName: string): Promise<boolean> {
    try {
      await this.executeCommand(
        deviceId,
        `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`
      );
      return true;
    } catch (error) {
      console.error('[ADB] App launch failed:', error);
      return false;
    }
  }

  async closeApp(deviceId: string, packageName: string): Promise<boolean> {
    try {
      await this.executeCommand(deviceId, `am force-stop ${packageName}`);
      return true;
    } catch (error) {
      console.error('[ADB] App close failed:', error);
      return false;
    }
  }

  async tap(deviceId: string, x: number, y: number): Promise<boolean> {
    try {
      await this.executeCommand(deviceId, `input tap ${x} ${y}`);
      return true;
    } catch (error) {
      console.error('[ADB] Tap failed:', error);
      return false;
    }
  }

  async swipe(
    deviceId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration: number = 500
  ): Promise<boolean> {
    try {
      await this.executeCommand(
        deviceId,
        `input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`
      );
      return true;
    } catch (error) {
      console.error('[ADB] Swipe failed:', error);
      return false;
    }
  }

  async screenshot(deviceId: string, savePath: string): Promise<boolean> {
    try {
      await execAsync(`adb -s ${deviceId} exec-out screencap -p > "${savePath}"`);
      return true;
    } catch (error) {
      console.error('[ADB] Screenshot failed:', error);
      return false;
    }
  }

  async toggleWiFi(deviceId: string, enable: boolean): Promise<boolean> {
    try {
      const command = enable
        ? 'svc wifi enable'
        : 'svc wifi disable';
      await this.executeCommand(deviceId, command);
      return true;
    } catch (error) {
      console.error('[ADB] WiFi toggle failed:', error);
      return false;
    }
  }

  async toggleBluetooth(deviceId: string, enable: boolean): Promise<boolean> {
    try {
      const command = `settings put global bluetooth_on ${enable ? 1 : 0}`;
      await this.executeCommand(deviceId, command);
      return true;
    } catch (error) {
      console.error('[ADB] Bluetooth toggle failed:', error);
      return false;
    }
  }

  async pushFile(
    deviceId: string,
    localPath: string,
    remotePath: string
  ): Promise<boolean> {
    try {
      await execAsync(`adb -s ${deviceId} push "${localPath}" "${remotePath}"`);
      return true;
    } catch (error) {
      console.error('[ADB] Push file failed:', error);
      return false;
    }
  }

  async pullFile(
    deviceId: string,
    remotePath: string,
    localPath: string
  ): Promise<boolean> {
    try {
      await execAsync(`adb -s ${deviceId} pull "${remotePath}" "${localPath}"`);
      return true;
    } catch (error) {
      console.error('[ADB] Pull file failed:', error);
      return false;
    }
  }

  async installAPK(deviceId: string, apkPath: string): Promise<boolean> {
    try {
      await execAsync(`adb -s ${deviceId} install "${apkPath}"`);
      return true;
    } catch (error) {
      console.error('[ADB] APK install failed:', error);
      return false;
    }
  }
}

const adbService = new ADBService();

export function registerADBHandlers() {
  ipcMain.handle('adb:init', async () => {
    await adbService.initialize();
    return { success: true, message: 'ADB SYSTEM ONLINE' };
  });

  ipcMain.handle('adb:scan-devices', async () => {
    const devices = await adbService.scanDevices();
    return { success: true, devices };
  });

  ipcMain.handle('adb:get-battery', async (event, deviceId: string) => {
    const battery = await adbService.getBatteryLevel(deviceId);
    return { success: true, battery };
  });

  ipcMain.handle('adb:open-app', async (event, deviceId: string, packageName: string) => {
    const success = await adbService.openApp(deviceId, packageName);
    return { success };
  });

  ipcMain.handle('adb:close-app', async (event, deviceId: string, packageName: string) => {
    const success = await adbService.closeApp(deviceId, packageName);
    return { success };
  });

  ipcMain.handle('adb:tap', async (event, deviceId: string, x: number, y: number) => {
    const success = await adbService.tap(deviceId, x, y);
    return { success };
  });

  ipcMain.handle(
    'adb:swipe',
    async (event, deviceId: string, x1: number, y1: number, x2: number, y2: number) => {
      const success = await adbService.swipe(deviceId, x1, y1, x2, y2);
      return { success };
    }
  );

  ipcMain.handle('adb:screenshot', async (event, deviceId: string, savePath: string) => {
    const success = await adbService.screenshot(deviceId, savePath);
    return { success };
  });

  ipcMain.handle('adb:toggle-wifi', async (event, deviceId: string, enable: boolean) => {
    const success = await adbService.toggleWiFi(deviceId, enable);
    return { success };
  });

  ipcMain.handle('adb:toggle-bluetooth', async (event, deviceId: string, enable: boolean) => {
    const success = await adbService.toggleBluetooth(deviceId, enable);
    return { success };
  });

  ipcMain.handle(
    'adb:push-file',
    async (event, deviceId: string, localPath: string, remotePath: string) => {
      const success = await adbService.pushFile(deviceId, localPath, remotePath);
      return { success };
    }
  );

  ipcMain.handle(
    'adb:pull-file',
    async (event, deviceId: string, remotePath: string, localPath: string) => {
      const success = await adbService.pullFile(deviceId, remotePath, localPath);
      return { success };
    }
  );

  ipcMain.handle('adb:install-apk', async (event, deviceId: string, apkPath: string) => {
    const success = await adbService.installAPK(deviceId, apkPath);
    return { success };
  });
}

export { ADBService, adbService };