import React, { useEffect, useState } from 'react';
import { VoiceWidget } from './components/VoiceWidget';
import './styles/tailwind.css';

function App() {
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    const initApp = async () => {
      // Initialize services
      await window.electron.ipcRenderer.invoke('voice:init', {
        apiKey: process.env.REACT_APP_NIM_API_KEY || '',
        model: 'nimble',
        language: 'en',
      });

      await window.electron.ipcRenderer.invoke('memory:init');

      // Get system info
      const info = await window.electron.ipcRenderer.invoke('system:info');
      setSystemInfo(info);
    };

    initApp();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-500 mb-2">
            MAX-AII
          </h1>
          <p className="text-cyan-400/70 text-lg font-mono">NEURAL CORE ONLINE • READY FOR EXECUTION</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Voice Widget */}
          <div className="md:col-span-2">
            <VoiceWidget />
          </div>

          {/* System Info */}
          {systemInfo && (
            <div className="rounded-lg bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-cyan-500/30 backdrop-blur p-6">
              <h3 className="text-cyan-400 font-mono text-sm font-bold mb-4">SYSTEM TELEMETRY</h3>
              <div className="space-y-2 text-xs text-gray-300 font-mono">
                <p>Platform: {systemInfo.platform}</p>
                <p>CPUs: {systemInfo.cpus}</p>
                <p>Memory: {(systemInfo.memory / 1024 / 1024 / 1024).toFixed(1)}GB</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;