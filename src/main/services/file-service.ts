import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { readdir, writeFile, readFile, mkdir } from 'fs/promises';

class FileService {
  async readFile(filePath: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Read failed: ${error.message}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<boolean> {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error: any) {
      throw new Error(`Write failed: ${error.message}`);
    }
  }

  async createFolder(folderPath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(folderPath)) {
        await mkdir(folderPath, { recursive: true });
      }
      return true;
    } catch (error: any) {
      throw new Error(`Folder creation failed: ${error.message}`);
    }
  }

  async listFiles(dirPath: string): Promise<{
    name: string;
    type: 'file' | 'directory';
    size: number;
    modified: number;
  }[]> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      return entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: fs.statSync(path.join(dirPath, entry.name)).size,
        modified: fs.statSync(path.join(dirPath, entry.name)).mtime.getTime(),
      }));
    } catch (error: any) {
      throw new Error(`List failed: ${error.message}`);
    }
  }

  async searchFiles(dirPath: string, query: string): Promise<string[]> {
    const results: string[] = [];
    const search = async (dir: string) => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.name.toLowerCase().includes(query.toLowerCase())) {
            results.push(fullPath);
          }
          if (entry.isDirectory()) {
            await search(fullPath);
          }
        }
      } catch (error) {
        // Skip permission errors
      }
    };
    await search(dirPath);
    return results;
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch (error: any) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}

const fileService = new FileService();

export function registerFileHandlers() {
  ipcMain.handle('file:read', async (event, filePath: string) => {
    const content = await fileService.readFile(filePath);
    return { success: true, content };
  });

  ipcMain.handle('file:write', async (event, filePath: string, content: string) => {
    const success = await fileService.writeFile(filePath, content);
    return { success };
  });

  ipcMain.handle('file:create-folder', async (event, folderPath: string) => {
    const success = await fileService.createFolder(folderPath);
    return { success };
  });

  ipcMain.handle('file:list', async (event, dirPath: string) => {
    const files = await fileService.listFiles(dirPath);
    return { success: true, files };
  });

  ipcMain.handle('file:search', async (event, dirPath: string, query: string) => {
    const results = await fileService.searchFiles(dirPath, query);
    return { success: true, results };
  });

  ipcMain.handle('file:delete', async (event, filePath: string) => {
    const success = await fileService.deleteFile(filePath);
    return { success };
  });
}

export { FileService, fileService };