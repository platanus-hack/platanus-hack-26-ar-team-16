import { useCallback, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface SpeechRecognitionResult {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    transcriptRef.current = text;
    setTranscript(text);
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.warn('[speech] error:', event.error, event.message);
    setIsListening(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      console.warn('[speech] permission denied');
      return;
    }

    transcriptRef.current = '';
    setTranscript('');
    setIsListening(true);

    ExpoSpeechRecognitionModule.start({
      lang: 'es-AR',
      interimResults: true,
      continuous: true,
    });
  }, []);

  const stopListening = useCallback(async (): Promise<string> => {
    setIsListening(false);
    ExpoSpeechRecognitionModule.stop();
    const result = transcriptRef.current;
    setTranscript('');
    transcriptRef.current = '';
    return result;
  }, []);

  return { isListening, transcript, startListening, stopListening };
}
