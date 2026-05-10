import { useEffect, useState } from 'react';
import { Platform, View, TextInput, Pressable } from 'react-native';
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

const PLACEHOLDERS = [
  'Pedile que cambie tu lunes…',
  'Reemplazá un ejercicio…',
  'Dame ideas para core…',
  'Aumentá el peso del press…',
  'Armá una rutina de fuerza…',
];

export function MessageInput({
  onSend,
  onStartRecording,
  onStopRecording,
  isRecording,
  liveTranscript = '',
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const theme = useTheme();
  const displayText = isRecording ? liveTranscript : text;
  const canSend = text.trim().length > 0 && !disabled && !isRecording;

  useEffect(() => {
    if (text.length > 0 || isRecording) return;
    const id = setInterval(() => {
      setPhIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [text.length, isRecording]);

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  const placeholder = isRecording ? '🎤 Escuchando…' : PLACEHOLDERS[phIdx];

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: 'transparent',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          backgroundColor: '#141414',
          borderRadius: 26,
          paddingLeft: 6,
          paddingRight: 6,
          paddingVertical: 6,
          gap: 6,
          borderWidth: 1,
          borderColor: '#202020',
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 8px 24px rgba(0,0,0,0.45)' as any }
            : {
                shadowColor: '#000',
                shadowOpacity: 0.45,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
              }),
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
            justifyContent: 'center',
            paddingHorizontal: 6,
            paddingVertical: 8,
          }}
        >
          <TextInput
            value={displayText}
            onChangeText={isRecording ? undefined : setText}
            placeholder={placeholder}
            placeholderTextColor={isRecording ? '#6366F1' : '#5C5C5C'}
            editable={!disabled && !isRecording}
            style={{ fontSize: 16, color: '#FFFFFF', maxHeight: 128 }}
            onSubmitEditing={handleSend}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={{
            width: 38,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 19,
            backgroundColor: canSend ? theme.primary : '#1F1F1F',
          }}
        >
          <Ionicons name="arrow-up" size={18} color={canSend ? '#FFFFFF' : '#666666'} />
        </Pressable>
      </View>
    </View>
  );
}
