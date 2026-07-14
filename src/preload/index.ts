import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, listener: any) => ipcRenderer.on(channel, listener),
    once: (channel: string, listener: any) => ipcRenderer.once(channel, listener),
    removeListener: (channel: string, listener: any) => ipcRenderer.removeListener(channel, listener),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);

export type ElectronAPI = typeof electronAPI;