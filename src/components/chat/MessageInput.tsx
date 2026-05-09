import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AudioButton } from './AudioButton';

interface MessageInputProps {
  onSend: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  liveTranscript?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onStartRecording,
  onStopRecording,
  isRecording,
  liveTranscript = '',
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const theme = useTheme();
  const displayText = isRecording ? liveTranscript : text;
  const canSend = text.trim().length > 0 && !disabled && !isRecording;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View
      className="flex-row items-end px-4 pt-3 pb-3 border-t border-slate-200 bg-white"
      style={{ gap: 8 }}
    >
      <AudioButton
        isRecording={isRecording}
        disabled={disabled}
        onPress={isRecording ? onStopRecording : onStartRecording}
      />
      <View className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5">
        <TextInput
          value={displayText}
          onChangeText={isRecording ? undefined : setText}
          placeholder={isRecording ? '🎤 Escuchando...' : 'Escribí un mensaje'}
          placeholderTextColor={isRecording ? '#6366F1' : '#94A3B8'}
          editable={!disabled && !isRecording}
          multiline
          className="text-base text-slate-900"
          style={{ maxHeight: 128 }}
          onSubmitEditing={handleSend}
        />
      </View>
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        className="w-10 h-10 items-center justify-center rounded-full"
        style={{ backgroundColor: canSend ? theme.primary : '#CBD5E1' }}
      >
        <Ionicons name="send" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
