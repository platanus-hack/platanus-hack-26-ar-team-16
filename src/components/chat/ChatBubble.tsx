import { View, Text } from 'react-native';
import type { ChatMessage } from '@/types';
import { useTheme } from '@/theme';

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming = false }: ChatBubbleProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={{ flexDirection: 'row', marginBottom: 8, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          maxWidth: '85%',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 16,
          ...(isUser
            ? { borderBottomRightRadius: 6, backgroundColor: theme.primary }
            : { borderBottomLeftRadius: 6, backgroundColor: '#F1F5F9' }),
        }}
      >
        <Text style={{ fontSize: 16, color: isUser ? '#FFFFFF' : '#0F172A' }}>
          {message.content}
          {isStreaming && !isUser && (
            <Text style={{ color: '#94A3B8' }}>▍</Text>
          )}
        </Text>
      </View>
    </View>
  );
}
