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
  /** When true, suppress the "GOHAN" label — used to collapse consecutive
   *  assistant messages within the same turn under a single label. */
  hideAssistantLabel?: boolean;
}

export function ChatBubble({
  message,
  isStreaming = false,
  hideAssistantLabel = false,
}: ChatBubbleProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const { text, spec } = useSpecFromMessage(message.content);

  const actionHandlers = {
    reply: async (params: Record<string, unknown>) => {
      const replyText = params.text as string;
      if (replyText) void sendUserMessage(replyText);
    },
  };

  if (isUser) {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 22 }}>
        <View
          style={{
            maxWidth: '88%',
            backgroundColor: theme.primary,
            borderRadius: 20,
            borderTopRightRadius: 6,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 15, lineHeight: 21 }}>{text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 22 }}>
      {!hideAssistantLabel && (
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.6,
            color: '#5F5F5F',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          Gohan
        </Text>
      )}
      {text.length > 0 && (
        <Text style={{ color: '#F4F4F5', fontSize: 16, lineHeight: 24 }}>
          {text}
          {isStreaming && !spec && <Text style={{ color: '#666' }}>{' ▍'}</Text>}
        </Text>
      )}
      {spec && (
        <View style={{ marginTop: 8 }}>
          <StateProvider initialState={{}}>
            <VisibilityProvider>
              <ActionProvider handlers={actionHandlers}>
                <Renderer spec={spec} loading={isStreaming} />
              </ActionProvider>
            </VisibilityProvider>
          </StateProvider>
        </View>
      )}
      {message.sources && message.sources.length > 0 && (
        <SourcePills sources={message.sources} />
      )}
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
      style={{ marginTop: 10, marginHorizontal: -4 }}
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
            backgroundColor: pressed ? '#262626' : '#181818',
            borderWidth: 1,
            borderColor: '#2A2A2A',
          })}
        >
          <Text style={{ color: '#A0A0A0', fontSize: 11 }}>
            {firstAuthor(s.authors)}
            {s.year ? ` ${s.year}` : ''}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
