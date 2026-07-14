import React, { useEffect, useState } from 'react';
import { VoiceWidget } from './components/VoiceWidget';
import { MobilePanel } from './components/MobilePanel';
import { TerminalWidget } from './components/TerminalWidget';
import { FileExplorer } from './components/FileExplorer';
import { Zap } from 'lucide-react';
import './styles/tailwind.css';

function App() {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [initStatus, setInitStatus] = useState<string[]>([]);

  useEffect(() => {
    const initApp = async () => {
      const status: string[] = [];

      try {
        status.push('INITIALIZING NEURAL CORE...');
        setInitStatus([...status]);

        status.push('» Voice Agent System');
        setInitStatus([...status]);
        await window.electron.ipcRenderer.invoke('voice:init', {
          apiKey: process.env.REACT_APP_NIM_API_KEY || '',
          model: 'nimble',
          language: 'en',
        });

        status.push('» Memory & Vector DB');
        setInitStatus([...status]);
        await window.electron.ipcRenderer.invoke('memory:init');

        status.push('» Mobile ADB System');
        setInitStatus([...status]);
        await window.electron.ipcRenderer.invoke('adb:init');

        status.push('» Fetching System Telemetry');
        setInitStatus([...status]);
        const info = await window.electron.ipcRenderer.invoke('system:info');
        setSystemInfo(info);

        status.push('✓ NEURAL CORE ONLINE');
        setInitStatus([...status]);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initApp();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-black p-8">
      {/* Particle Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-3xl bottom-10 right-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-500">
              MAX-AII
            </h1>
            <Zap className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <p className="text-cyan-400/70 text-lg font-mono">AUTONOMOUS DESKTOP AI ASSISTANT • JARVIS-LEVEL EXECUTION</p>
        </div>

        {/* Initialization Status */}
        {initStatus.length > 0 && (
          <div className="mb-8 p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 backdrop-blur">
            <div className="font-mono text-xs space-y-1">
              {initStatus.map((status, i) => (
                <div key={i} className="text-cyan-400">
                  {status}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Widget - Left */}
          <div className="lg:col-span-2">
            <VoiceWidget />
          </div>

          {/* System Telemetry - Right */}
          {systemInfo && (
            <div className="rounded-lg bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-cyan-500/30 backdrop-blur p-6 h-fit">
              <h3 className="text-cyan-400 font-mono text-sm font-bold mb-4">SYSTEM TELEMETRY</h3>
              <div className="space-y-3 text-xs text-gray-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform:</span>
                  <span className="text-cyan-300">{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Architecture:</span>
                  <span className="text-cyan-300">{systemInfo.arch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CPUs:</span>
                  <span className="text-orange-300">{systemInfo.cpus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory:</span>
                  <span className="text-orange-300">{(systemInfo.memory / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <FileExplorer />
        </div>
      </div>

      {/* Floating Widgets */}
      <MobilePanel />
      <TerminalWidget />
    </div>
  );
}

export default App;