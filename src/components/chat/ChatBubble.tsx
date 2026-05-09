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
    <View className={`flex-row mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${isUser ? 'rounded-br-md' : 'rounded-bl-md bg-slate-100'}`}
        style={isUser ? { backgroundColor: theme.primary } : undefined}
      >
        <Text className={`text-base ${isUser ? 'text-white' : 'text-slate-900'}`}>
          {message.content}
          {isStreaming && !isUser && (
            <Text className="text-slate-400">▍</Text>
          )}
        </Text>
      </View>
    </View>
  );
}
