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
            : { borderBottomLeftRadius: 6, backgroundColor: '#1F1F1F' }),
        }}
      >
        <Text style={{ fontSize: 16, color: '#FFFFFF' }}>
          {message.content}
          {isStreaming && !isUser && (
            <Text style={{ color: '#888888' }}>▍</Text>
          )}
        </Text>
      </View>
    </View>
  );
}
