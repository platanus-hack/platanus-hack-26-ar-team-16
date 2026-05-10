import { View, Text } from 'react-native';
import {
  Renderer,
  ActionProvider,
  StateProvider,
  VisibilityProvider,
} from '@json-render/react-native';
import type { ChatMessage } from '@/types';
import { useTheme } from '@/theme';
import { useSpecFromMessage } from '@/modules/json-render';
import { sendUserMessage } from '@/modules/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming = false }: ChatBubbleProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const { text, spec } = useSpecFromMessage(message.content);

  const actionHandlers = {
    reply: async (params: Record<string, unknown>) => {
      const replyText = params.text as string;
      if (replyText) void sendUserMessage(replyText);
    },
  };

  return (
    <View className="mb-2" style={{ flexDirection: 'row', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <View
        className="rounded-2xl px-4 py-3"
        style={{
          maxWidth: '85%',
          ...(isUser
            ? { borderBottomRightRadius: 6, backgroundColor: theme.primary }
            : { borderBottomLeftRadius: 6, backgroundColor: '#F1F5F9' }),
        }}
      >
        {text.length > 0 && (
          <Text className="text-base" style={{ color: isUser ? '#FFFFFF' : '#0F172A' }}>
            {text}
            {isStreaming && !isUser && !spec && (
              <Text style={{ color: '#94A3B8' }}>{'▍'}</Text>
            )}
          </Text>
        )}
        {spec && (
          <View className="mt-2">
            <StateProvider initialState={{}}>
              <VisibilityProvider>
                <ActionProvider handlers={actionHandlers}>
                  <Renderer spec={spec} loading={isStreaming} />
                </ActionProvider>
              </VisibilityProvider>
            </StateProvider>
          </View>
        )}
      </View>
    </View>
  );
}
