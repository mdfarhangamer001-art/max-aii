import React, { useEffect } from 'react';
import { useVoice } from '../hooks/useVoice';
import { Mic, Square } from 'lucide-react';

export const VoiceWidget: React.FC = () => {
  const { isListening, transcript, isProcessing, startListening, stopListening } = useVoice();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, startListening, stopListening]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-lg bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-cyan-500/30 backdrop-blur">
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={`p-4 rounded-full transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
            : 'bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/50'
        } disabled:opacity-50`}
      >
        {isListening ? (
          <Square className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      <div className="text-center">
        <p className="text-cyan-400 text-sm font-mono">
          {isProcessing ? 'PROCESSING...' : isListening ? 'LISTENING...' : 'READY'}
        </p>
        {transcript && (
          <p className="text-white text-base mt-2 max-w-xs break-words">{transcript}</p>
        )}
      </div>
    </div>
  );
};