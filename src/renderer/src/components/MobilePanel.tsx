import React, { useState, useEffect } from 'react';
import { Smartphone, Battery, HardDrive, Wifi, Bluetooth, LogOut, Send } from 'lucide-react';

interface MobileDevice {
  id: string;
  name: string;
  model: string;
  battery: number;
  isWiFi: boolean;
}

export const MobilePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scanDevices();
  }, []);

  const scanDevices = async () => {
    setLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke('adb:scan-devices');
      if (result.success) {
        setDevices(result.devices);
        if (result.devices.length > 0) {
          setSelectedDevice(result.devices[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to scan devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTap = async (x: number, y: number) => {
    if (!selectedDevice) return;
    try {
      await window.electron.ipcRenderer.invoke('adb:tap', selectedDevice, x, y);
    } catch (error) {
      console.error('Tap failed:', error);
    }
  };

  const handleSwipe = async () => {
    if (!selectedDevice) return;
    try {
      await window.electron.ipcRenderer.invoke(
        'adb:swipe',
        selectedDevice,
        100,
        400,
        100,
        100,
        300
      );
    } catch (error) {
      console.error('Swipe failed:', error);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 p-4 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/50 transition-all duration-300 z-40"
      >
        <Smartphone className="w-6 h-6 text-white" />
      </button>

      {/* Collapsible Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-96 bg-gradient-to-br from-purple-900/95 to-black/95 border-l border-cyan-500/30 backdrop-blur-xl transition-transform duration-300 ease-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/20 flex justify-between items-center">
          <h2 className="text-cyan-400 font-mono font-bold text-lg">MOBILE TELEKINESIS</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-cyan-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-120px)]">
          {/* Device Selector */}
          <div>
            <label className="text-cyan-400 text-xs font-mono font-bold mb-2 block">CONNECTED DEVICES</label>
            <button
              onClick={scanDevices}
              disabled={loading}
              className="w-full mb-3 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 text-sm font-mono transition-all disabled:opacity-50"
            >
              {loading ? 'SCANNING...' : 'RESCAN'}
            </button>
            {devices.length > 0 ? (
              <div className="space-y-2">
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id)}
                    className={`w-full p-3 rounded border transition-all text-left text-xs font-mono ${
                      selectedDevice === device.id
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                        : 'bg-purple-900/30 border-purple-500/30 text-gray-300 hover:border-cyan-500/50'
                    }`}
                  >
                    <p className="font-bold">{device.name}</p>
                    <p className="text-xs opacity-70">{device.model}</p>
                    <p className="text-xs opacity-70 mt-1">Battery: {device.battery}%</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs font-mono italic">NO DEVICES CONNECTED</p>
            )}
          </div>

          {/* Controls */}
          {selectedDevice && (
            <div className="space-y-4">
              {/* Touch Controls */}
              <div>
                <label className="text-cyan-400 text-xs font-mono font-bold mb-2 block">TOUCH CONTROL</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSwipe}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded text-orange-400 text-xs font-mono transition-all"
                  >
                    SWIPE UP
                  </button>
                  <button
                    onClick={handleSwipe}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded text-orange-400 text-xs font-mono transition-all"
                  >
                    SWIPE DOWN
                  </button>
                </div>
              </div>

              {/* Hardware Toggles */}
              <div>
                <label className="text-cyan-400 text-xs font-mono font-bold mb-2 block">HARDWARE</label>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded text-purple-400 text-xs font-mono transition-all">
                    <Wifi className="w-4 h-4" />
                    TOGGLE WIFI
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded text-purple-400 text-xs font-mono transition-all">
                    <Bluetooth className="w-4 h-4" />
                    TOGGLE BLUETOOTH
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};