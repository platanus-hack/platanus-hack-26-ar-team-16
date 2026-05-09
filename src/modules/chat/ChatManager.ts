import { useChatStore } from '@/store';
import type { ChatMessage } from '@/types';
import { mockStreamReply } from './mockCoach';

const MOCK_CONVERSATION_ID = 'mock-conversation';

export function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface SendOptions {
  audioUrl?: string | null;
}

export async function sendUserMessage(content: string, opts?: SendOptions): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;

  const store = useChatStore.getState();
  const userMsg: ChatMessage = {
    id: generateTempId(),
    conversationId: MOCK_CONVERSATION_ID,
    role: 'user',
    content: trimmed,
    audioUrl: opts?.audioUrl ?? null,
    createdAt: new Date().toISOString(),
  };
  store.addMessage(userMsg);

  const assistantMsg: ChatMessage = {
    id: generateTempId(),
    conversationId: MOCK_CONVERSATION_ID,
    role: 'assistant',
    content: '',
    audioUrl: null,
    createdAt: new Date().toISOString(),
  };
  store.addMessage(assistantMsg);
  store.setStreaming({ isStreaming: true, partialContent: '' });

  let buffer = '';
  try {
    for await (const token of mockStreamReply(trimmed)) {
      buffer += token;
      const current = useChatStore.getState();
      current.updateMessage(assistantMsg.id, buffer);
      current.setStreaming({ partialContent: buffer });
    }
  } finally {
    useChatStore.getState().setStreaming({ isStreaming: false, partialContent: '' });
  }
}

export function seedWelcomeMessage(): void {
  const store = useChatStore.getState();
  if (store.messages.length > 0) return;
  store.addMessage({
    id: 'welcome-1',
    conversationId: MOCK_CONVERSATION_ID,
    role: 'assistant',
    content:
      'Hola, soy Gohan. Para armarte una rutina personalizada contame: ¿cuál es tu objetivo, cuántos días entrenás por semana y qué equipamiento tenés?',
    audioUrl: null,
    createdAt: new Date().toISOString(),
  });
}
