import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send } from 'lucide-react';

interface TerminalLog {
  type: 'input' | 'output' | 'error';
  content: string;
}

export const TerminalWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    setLogs((prev) => [...prev, { type: 'input', content: `$ ${command}` }]);
    setInput('');
    setIsExecuting(true);

    try {
      const result = await window.electron.ipcRenderer.invoke('terminal:execute', command);
      if (result.stdout) {
        setLogs((prev) => [...prev, { type: 'output', content: result.stdout }]);
      }
      if (result.stderr) {
        setLogs((prev) => [...prev, { type: 'error', content: result.stderr }]);
      }
    } catch (error: any) {
      setLogs((prev) => [...prev, { type: 'error', content: error.message }]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-8 p-4 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/50 transition-all duration-300 z-40"
      >
        <Terminal className="w-6 h-6 text-white" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-2/3 h-2/3 bg-gradient-to-br from-slate-900 to-black border border-cyan-500/30 rounded-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center">
              <h3 className="text-cyan-400 font-mono font-bold">TERMINAL</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-cyan-400"
              >
                ✕
              </button>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm">
              {logs.length === 0 && (
                <p className="text-gray-500 text-xs">TERMINAL READY... WAITING FOR INPUT</p>
              )}
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`text-xs ${
                    log.type === 'input'
                      ? 'text-cyan-400'
                      : log.type === 'error'
                      ? 'text-red-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log.content}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-cyan-500/20 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && executeCommand(input)}
                placeholder="Enter command..."
                disabled={isExecuting}
                className="flex-1 bg-slate-800 border border-cyan-500/30 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              />
              <button
                onClick={() => executeCommand(input)}
                disabled={isExecuting}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 font-mono text-xs transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                EXEC
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};