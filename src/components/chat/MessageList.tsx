import { useEffect, useRef } from 'react';
import { FlatList, View, Text } from 'react-native';
import type { ChatMessage } from '@/types';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { ToolIndicator } from './ToolIndicator';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  activeTool?: string | null;
}

export function MessageList({ messages, isStreaming, activeTool = null }: MessageListProps) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, isStreaming, activeTool]);

  const last = messages[messages.length - 1];
  const showTyping =
    isStreaming &&
    !activeTool &&
    last?.role === 'assistant' &&
    last.content.length === 0;

  const footer = activeTool ? (
    <ToolIndicator toolName={activeTool} />
  ) : showTyping ? (
    <TypingIndicator />
  ) : null;

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m) => m.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
      renderItem={({ item, index }) => (
        <ChatBubble
          message={item}
          isStreaming={
            isStreaming &&
            index === messages.length - 1 &&
            item.role === 'assistant' &&
            item.content.length > 0
          }
        />
      )}
      ListEmptyComponent={
        <View className="items-center justify-center py-20">
          <Text className="text-base text-slate-400">
            Empezá una conversación con Gohan
          </Text>
        </View>
      }
      ListFooterComponent={footer}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
    />
  );
}
