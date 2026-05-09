import { useState, useCallback } from 'react';

// TODO: @alexndr-n — implement with expo-av Audio.Recording

interface AudioRecorderResult {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
}

export function useAudioRecorder(): AudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    // TODO: implement
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    setIsRecording(false);
    // TODO: implement — return transcribed text or audio URI
    return null;
  }, []);

  return { isRecording, startRecording, stopRecording };
}
