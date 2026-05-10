import { useAuthStore, useChatStore } from '@/store';
import type { ApiClient, ChatMessage } from '@/types';
import { buildConversationHistory, streamChat } from '@/services/api';
import type { ChatRequest } from '@/services/api';
import { markOnboardingCompleted } from '@/services';
import { createApiClient } from '@/services/api/client';

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

interface ChatTransport {
  apiClient: ApiClient;
  endpoint: string;
}

// Module-level transport, set by `<CoachProvider>` on mount via
// `setChatTransport`. We use module state instead of forcing every call site
// (chat input, audio button, ...) to thread an ApiClient down through props,
// while still keeping the transport injectable for the embedded module. Side
// effect: there can only be one active transport per JS bundle — fine for
// the shipped apps where exactly one CoachProvider is mounted.
let activeTransport: ChatTransport | null = null;

export function setChatTransport(transport: ChatTransport | null): void {
  activeTransport = transport;
}

/** Standalone-app fallback: if no provider has registered a transport, build
 *  one from the legacy `EXPO_PUBLIC_SUPABASE_*` env vars so the existing
 *  `ai-chat` endpoint still works without any plumbing changes. */
function getOrBuildTransport(): ChatTransport {
  if (activeTransport) return activeTransport;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return {
    apiClient: createApiClient({
      apiBaseUrl: `${url.replace(/\/$/, '')}/functions/v1`,
      anonKey,
      // Standalone fallback — when no provider sets a real getter we degrade
      // to the anon key, matching the old `CoachEngine.ts` behaviour.
      getAuthToken: async () => null,
    }),
    endpoint: 'ai-chat',
  };
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

  const transport = getOrBuildTransport();
  streamChat(
    transport.apiClient,
    transport.endpoint,
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
