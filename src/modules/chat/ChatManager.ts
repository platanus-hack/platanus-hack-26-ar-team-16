import { useAuthStore, useChatStore, useCoachStyleStore, toast } from '@/store';
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
    coachStyle: useCoachStyleStore.getState().style,
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
      onSources: (sources) => {
        useChatStore.getState().updateMessageSources(assistantId, sources);
      },
      onToolEnd: (toolName, success) => {
        useChatStore.getState().setActiveTool(null);
        if (success) {
          if (toolName === 'create_routine') {
            toast.success('Rutina creada');
            const user = useAuthStore.getState().user;
            if (user && !user.onboardingCompleted) {
              useAuthStore.getState().setUser({ ...user, onboardingCompleted: true });
              markOnboardingCompleted(user.id).catch(() => {});
            }
          } else if (toolName === 'update_exercise') {
            toast.success('Ejercicio actualizado');
          } else if (toolName === 'replace_exercise') {
            toast.success('Ejercicio reemplazado');
          } else if (toolName === 'add_exercise') {
            toast.success('Ejercicio agregado');
          } else if (toolName === 'remove_exercise') {
            toast.info('Ejercicio eliminado');
          }
        } else {
          toast.error(`No se pudo ejecutar ${toolName}`);
        }
      },
      onDone: (full) => {
        if (full) useChatStore.getState().updateMessage(assistantId, full);
        finalize();
      },
      onError: (msg) => {
        console.warn('[chat] stream error:', msg);
        toast.error(msg || 'Error en el chat');
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

const ONBOARDING_INIT_CHIPS = [
  '{"op":"add","path":"/root","value":"row"}',
  '{"op":"add","path":"/elements/row","value":{"type":"Row","props":{"gap":8,"flexWrap":"wrap"},"children":["c1","c2"]}}',
  '{"op":"add","path":"/elements/c1","value":{"type":"Chip","props":{"label":"Dale, vamos"},"on":{"press":{"action":"reply","params":{"text":"sí, vamos"}}},"children":[]}}',
  '{"op":"add","path":"/elements/c2","value":{"type":"Chip","props":{"label":"Más tarde"},"on":{"press":{"action":"reply","params":{"text":"más tarde"}}},"children":[]}}',
].join('\n');

export function seedWelcomeMessage(): void {
  const store = useChatStore.getState();
  if (store.messages.length > 0) return;

  const user = useAuthStore.getState().user;
  const onboardingCompleted = user?.onboardingCompleted ?? false;

  if (!onboardingCompleted) {
    store.addMessage({
      id: 'onboarding-init',
      conversationId: MOCK_CONVERSATION_ID,
      role: 'assistant',
      content: `Hola, soy Gohan, tu coach AI. Para armarte una rutina personalizada, ¿te tiro unas preguntas rápidas para conocerte mejor?\n\n${ONBOARDING_INIT_CHIPS}`,
      audioUrl: null,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  const style = useCoachStyleStore.getState().style;
  const welcomeByStyle: Record<string, string> = {
    amable: 'Hola, soy Gohan, tu coach personal. Contame tranquilo: ¿qué objetivo tenés, cuántos días podés entrenar y con qué equipamiento contás? Vamos a tu ritmo.',
    intenso: 'Soy Gohan. Contame tu objetivo, días disponibles y equipamiento. Con eso te armo la rutina.',
    picante: 'Buenas, soy Gohan. A ver, ¿qué querés lograr, cuántos días le metés y qué tenés para entrenar? Dale que no tengo todo el día.',
  };

  store.addMessage({
    id: 'welcome-1',
    conversationId: MOCK_CONVERSATION_ID,
    role: 'assistant',
    content: welcomeByStyle[style] ?? welcomeByStyle.intenso,
    audioUrl: null,
    createdAt: new Date().toISOString(),
  });
}
