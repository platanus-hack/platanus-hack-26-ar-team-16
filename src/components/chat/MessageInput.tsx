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
        borderTopColor: '#1A1A1A',
        backgroundColor: '#0F0F0F',
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
          backgroundColor: '#1A1A1A',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <TextInput
          value={displayText}
          onChangeText={isRecording ? undefined : setText}
          placeholder={isRecording ? '🎤 Escuchando...' : 'Escribí un mensaje'}
          placeholderTextColor={isRecording ? '#6366F1' : '#666666'}
          editable={!disabled && !isRecording}
          style={{ fontSize: 16, color: '#FFFFFF', maxHeight: 128 }}
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
          backgroundColor: canSend ? theme.primary : '#1A1A1A',
        }}
      >
        <Ionicons name="send" size={18} color={canSend ? '#FFFFFF' : '#666666'} />
      </Pressable>
    </View>
  );
}
