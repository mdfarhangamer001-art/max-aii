import { useState, useCallback, useRef } from 'react';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  isProcessing: boolean;
  error: string | null;
}

export const useVoice = () => {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    transcript: '',
    isProcessing: false,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startListening = useCallback(async () => {
    try {
      setState((s) => ({ ...s, isListening: true, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      
      // Auto-stop after 30 seconds
      setTimeout(() => stopListening(), 30000);
    } catch (error: any) {
      setState((s) => ({ ...s, error: error.message, isListening: false }));
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      setState((s) => ({ ...s, isProcessing: true }));
      
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();

      const result = await window.electron.ipcRenderer.invoke('voice:process-audio', arrayBuffer);
      
      setState((s) => ({
        ...s,
        transcript: result.text,
        isListening: false,
        isProcessing: false,
      }));
    } catch (error: any) {
      setState((s) => ({ ...s, error: error.message, isProcessing: false }));
    }
  }, []);

  return { ...state, startListening, stopListening };
};