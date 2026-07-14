import { ipcMain } from 'electron';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class TerminalService {
  async executeCommand(command: string, cwd?: string): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  async executeCommandStreaming(
    command: string,
    onOutput: (data: string) => void,
    onError: (data: string) => void,
    cwd?: string
  ): Promise<number> {
    return new Promise((resolve) => {
      const child = spawn(command, [], {
        shell: true,
        cwd: cwd || process.cwd(),
      });

      child.stdout?.on('data', (data) => {
        onOutput(data.toString());
      });

      child.stderr?.on('data', (data) => {
        onError(data.toString());
      });

      child.on('close', (code) => {
        resolve(code || 0);
      });
    });
  }

  async runNPMCommand(command: string, cwd?: string): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    return this.executeCommand(`npm ${command}`, cwd);
  }

  async runGitCommand(command: string, cwd?: string): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    return this.executeCommand(`git ${command}`, cwd);
  }
}

const terminalService = new TerminalService();

export function registerTerminalHandlers() {
  ipcMain.handle('terminal:execute', async (event, command: string, cwd?: string) => {
    const result = await terminalService.executeCommand(command, cwd);
    return result;
  });

  ipcMain.handle(
    'terminal:execute-streaming',
    async (event, command: string, cwd?: string) => {
      let allOutput = '';
      let allErrors = '';

      await terminalService.executeCommandStreaming(
        command,
        (output) => {
          allOutput += output;
        },
        (error) => {
          allErrors += error;
        },
        cwd
      );

      return { stdout: allOutput, stderr: allErrors };
    }
  );

  ipcMain.handle('terminal:npm', async (event, command: string, cwd?: string) => {
    const result = await terminalService.runNPMCommand(command, cwd);
    return result;
  });

  ipcMain.handle('terminal:git', async (event, command: string, cwd?: string) => {
    const result = await terminalService.runGitCommand(command, cwd);
    return result;
  });
}

export { TerminalService, terminalService };