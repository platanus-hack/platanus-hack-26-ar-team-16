import { useEffect, useMemo, useRef } from 'react';
import { Dimensions, FlatList, View, Text } from 'react-native';
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
  const screenH = Dimensions.get('window').height;

  // Index of the latest user message — used to anchor it at the top of the
  // viewport whenever a new turn starts. Previous turns become history above
  // the fold; user can scroll up to see them.
  const lastUserIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return i;
    }
    return -1;
  }, [messages]);

  useEffect(() => {
    if (lastUserIndex < 0) return;
    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: lastUserIndex,
          viewPosition: 0,
          animated: true,
        });
      } catch {
        // swallow — onScrollToIndexFailed handles measurement gaps
      }
    }, 60);
    return () => clearTimeout(t);
  }, [lastUserIndex]);

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
      style={{ backgroundColor: '#000000' }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 24,
        // Bottom padding ensures the latest user prompt can be scrolled to the
        // top of the viewport even when its response is short.
        paddingBottom: Math.max(screenH * 0.7, 220),
      }}
      renderItem={({ item, index }) => {
        // Collapse the "GOHAN" label across consecutive assistant messages
        // belonging to the same turn — only the first one in the run shows it.
        const prev = index > 0 ? messages[index - 1] : null;
        const hideAssistantLabel =
          item.role === 'assistant' && prev?.role === 'assistant';

        return (
          <ChatBubble
            message={item}
            hideAssistantLabel={hideAssistantLabel}
            isStreaming={
              isStreaming &&
              index === messages.length - 1 &&
              item.role === 'assistant' &&
              item.content.length > 0
            }
          />
        );
      }}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 100 }}>
          <Text style={{ fontSize: 13, color: '#5A5A5A', letterSpacing: 0.3 }}>
            Empezá una conversación con Gohan
          </Text>
        </View>
      }
      ListFooterComponent={footer}
      onScrollToIndexFailed={(info) => {
        // FlatList hasn't measured the target yet — scroll to an estimate, then
        // retry once layout is known.
        listRef.current?.scrollToOffset({
          offset: info.averageItemLength * info.index,
          animated: false,
        });
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: info.index,
            viewPosition: 0,
            animated: true,
          });
        }, 80);
      }}
    />
  );
}
