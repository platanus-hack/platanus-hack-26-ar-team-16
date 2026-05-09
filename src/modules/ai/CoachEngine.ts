import EventSource from 'react-native-sse';
import type { ChatRequest, CoachMessage, CoachResponse, StreamChunk } from './types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface CoachCallbacks {
  onToken: (token: string) => void;
  onToolStart: (toolName: string) => void;
  onToolEnd: (toolName: string, success: boolean) => void;
  onDone: (fullResponse: string, routineModified: boolean) => void;
  onError: (error: string) => void;
}

export function streamChat(
  request: ChatRequest,
  callbacks: CoachCallbacks,
  abortSignal?: AbortSignal
): void {
  const url = `${SUPABASE_URL}/functions/v1/ai-chat`;

  let fullResponse = '';
  let routineModified = false;

  const es = new EventSource(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(request),
  });

  const cleanup = () => {
    es.removeAllEventListeners();
    es.close();
  };

  if (abortSignal) {
    abortSignal.addEventListener('abort', cleanup);
  }

  es.addEventListener('message', (event: { data?: string }) => {
    const data = event.data?.trim();
    if (!data) return;

    if (data === '[DONE]') {
      cleanup();
      callbacks.onDone(fullResponse, routineModified);
      return;
    }

    try {
      const chunk: StreamChunk = JSON.parse(data);

      switch (chunk.type) {
        case 'text':
          fullResponse += chunk.content;
          callbacks.onToken(chunk.content);
          break;
        case 'tool_start':
          callbacks.onToolStart(chunk.toolName ?? chunk.content);
          break;
        case 'tool_end':
          routineModified = true;
          callbacks.onToolEnd(chunk.toolName ?? chunk.content, chunk.toolSuccess ?? true);
          break;
        case 'error':
          cleanup();
          callbacks.onError(chunk.content);
          break;
      }
    } catch {
      // skip malformed events
    }
  });

  es.addEventListener('error', (event: { message?: string }) => {
    cleanup();
    if (abortSignal?.aborted) return;
    callbacks.onError(event.message ?? 'Streaming connection error');
  });
}

export async function sendChat(request: ChatRequest): Promise<CoachResponse> {
  const url = `${SUPABASE_URL}/functions/v1/ai-chat`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'x-no-stream': 'true',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export function buildConversationHistory(
  messages: { role: string; content: string }[]
): CoachMessage[] {
  return messages.map((m) => ({
    role: m.role as CoachMessage['role'],
    content: m.content,
  }));
}
