import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface AudioButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function AudioButton({ isRecording, onPress, disabled = false }: AudioButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: isRecording ? '#FF6B00' : '#1A1A1A',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons
        name={isRecording ? 'stop' : 'mic'}
        size={20}
        color={isRecording ? '#FFFFFF' : '#666666'}
      />
    </Pressable>
  );
}
