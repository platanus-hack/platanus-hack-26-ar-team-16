import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import {
  Renderer,
  ActionProvider,
  StateProvider,
  VisibilityProvider,
} from '@json-render/react-native';
import type { ChatMessage, CitedSource } from '@/types';
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
            : { borderBottomLeftRadius: 6, backgroundColor: '#1F1F1F' }),
        }}
      >
        {text.length > 0 && (
          <Text className="text-base" style={{ color: '#FFFFFF' }}>
            {text}
            {isStreaming && !isUser && !spec && (
              <Text style={{ color: '#888888' }}>{'▍'}</Text>
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
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcePills sources={message.sources} />
        )}
      </View>
    </View>
  );
}

function SourcePills({ sources }: { sources: CitedSource[] }) {
  const firstAuthor = (authors: string | null) => {
    if (!authors) return 'Fuente';
    return authors.split(',')[0].split(' ').pop() ?? authors;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 8, marginHorizontal: -4 }}
      contentContainerStyle={{ paddingHorizontal: 4, gap: 6 }}
    >
      {sources.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => s.url && Linking.openURL(s.url)}
          style={({ pressed }) => ({
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: pressed ? '#3A3A3A' : '#2A2A2A',
            borderWidth: 1,
            borderColor: '#444',
          })}
        >
          <Text style={{ color: '#A0A0A0', fontSize: 11 }}>
            {firstAuthor(s.authors)}{s.year ? ` ${s.year}` : ''}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
