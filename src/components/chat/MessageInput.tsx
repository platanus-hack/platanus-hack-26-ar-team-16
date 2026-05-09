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
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        gap: 8,
      }}
    >
      <AudioButton
        isRecording={isRecording}
        disabled={disabled}
        onPress={isRecording ? onStopRecording : onStartRecording}
      />
      <View
        style={{
          flex: 1,
          backgroundColor: '#F1F5F9',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <TextInput
          value={displayText}
          onChangeText={isRecording ? undefined : setText}
          placeholder={isRecording ? '🎤 Escuchando...' : 'Escribí un mensaje'}
          placeholderTextColor={isRecording ? '#6366F1' : '#94A3B8'}
          editable={!disabled && !isRecording}
          multiline
          style={{ fontSize: 16, color: '#0F172A', maxHeight: 128 }}
          onSubmitEditing={handleSend}
        />
      </View>
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 20,
          backgroundColor: canSend ? theme.primary : '#CBD5E1',
        }}
      >
        <Ionicons name="send" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
