import React, { useState } from 'react';
import { FileText, Folder, ChevronRight } from 'lucide-react';

interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
}

export const FileExplorer: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(process.env.USERPROFILE || 'C:\\');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke('file:list', path);
      if (result.success) {
        setFiles(result.files);
        setCurrentPath(path);
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-cyan-500/30 backdrop-blur p-6">
      <h3 className="text-cyan-400 font-mono text-sm font-bold mb-4">FILE EXPLORER</h3>
      <div className="space-y-3">
        <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-300 font-mono truncate border border-cyan-500/20">
          {currentPath}
        </div>
        <div className="max-h-96 overflow-y-auto space-y-1">
          {loading ? (
            <p className="text-gray-400 text-xs">LOADING...</p>
          ) : files.length === 0 ? (
            <p className="text-gray-500 text-xs italic">NO FILES</p>
          ) : (
            files.slice(0, 20).map((file) => (
              <button
                key={file.name}
                onClick={() => {
                  if (file.type === 'directory') {
                    loadDirectory(`${currentPath}\\${file.name}`);
                  }
                }}
                className="w-full text-left px-3 py-2 rounded text-xs font-mono hover:bg-cyan-500/20 transition-colors text-gray-300 flex items-center gap-2"
              >
                {file.type === 'directory' ? (
                  <>
                    <Folder className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400">{file.name}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>{file.name}</span>
                  </>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};