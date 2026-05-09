import { useAuthStore, useChatStore } from '@/store';
import type { ChatMessage } from '@/types';
import { buildConversationHistory, streamChat } from '@/modules/ai';
import type { ChatRequest } from '@/modules/ai';
import { markOnboardingCompleted } from '@/services';

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

function buildUserProfileForRequest(): ChatRequest['userProfile'] {
  const u = useAuthStore.getState().user;
  if (!u) return null;
  return {
    id: u.id,
    displayName: u.displayName,
    fitnessLevel: u.fitnessLevel,
    equipmentAvailable: u.equipmentAvailable,
    injuries: u.injuries,
    trainingDaysPerWeek: u.trainingDaysPerWeek,
    goals: u.goals,
    onboardingCompleted: u.onboardingCompleted,
  };
}

export async function sendUserMessage(
  content: string,
  opts?: SendOptions,
): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;

  const chat = useChatStore.getState();
  // Snapshot prior turns BEFORE we mutate the store with the new turn.
  const conversationHistory = buildConversationHistory(chat.messages);
  const userProfile = buildUserProfileForRequest();

  const userMsg: ChatMessage = {
    id: generateTempId(),
    conversationId: MOCK_CONVERSATION_ID,
    role: 'user',
    content: trimmed,
    audioUrl: opts?.audioUrl ?? null,
    createdAt: new Date().toISOString(),
  };
  chat.addMessage(userMsg);

  const assistantId = generateTempId();
  const assistantMsg: ChatMessage = {
    id: assistantId,
    conversationId: MOCK_CONVERSATION_ID,
    role: 'assistant',
    content: '',
    audioUrl: null,
    createdAt: new Date().toISOString(),
  };
  chat.addMessage(assistantMsg);
  chat.setStreaming({ isStreaming: true, partialContent: '' });
  chat.setActiveTool(null);

  let buffer = '';
  const finalize = (errorText?: string) => {
    const s = useChatStore.getState();
    if (errorText && buffer.length === 0) {
      s.updateMessage(assistantId, `⚠️ ${errorText}`);
    }
    s.setStreaming({ isStreaming: false, partialContent: '' });
    s.setActiveTool(null);
  };

  streamChat(
    { userMessage: trimmed, conversationHistory, userProfile },
    {
      onToken: (token) => {
        buffer += token;
        const s = useChatStore.getState();
        s.updateMessage(assistantId, buffer);
        s.setStreaming({ partialContent: buffer });
      },
      onToolStart: (toolName) => {
        useChatStore.getState().setActiveTool(toolName);
      },
      onToolEnd: (toolName, success) => {
        useChatStore.getState().setActiveTool(null);
        if (toolName === 'create_routine' && success) {
          const user = useAuthStore.getState().user;
          if (user && !user.onboardingCompleted) {
            useAuthStore.getState().setUser({ ...user, onboardingCompleted: true });
            markOnboardingCompleted(user.id).catch(() => {});
          }
        }
      },
      onDone: (full) => {
        if (full) useChatStore.getState().updateMessage(assistantId, full);
        finalize();
      },
      onError: (msg) => {
        console.warn('[chat] stream error:', msg);
        finalize(msg);
      },
    },
  );
}

export function pushAudioBubble(audioUrl: string): void {
  // Holds the recorded audio in the conversation UI without invoking the AI.
  // STT is not wired yet (Dev 4 to add); once it is, this should call
  // `sendUserMessage(transcribedText, { audioUrl })` instead.
  useChatStore.getState().addMessage({
    id: generateTempId(),
    conversationId: MOCK_CONVERSATION_ID,
    role: 'user',
    content: '🎤 Audio (transcripción próximamente)',
    audioUrl,
    createdAt: new Date().toISOString(),
  });
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
