// HTTP-only chat client. Replaces `src/modules/ai/CoachEngine.ts` for the
// runtime path — the old module is still in the tree as documented dead
// code (see ARCHITECTURE.md §13) and will be deleted in Phase 6.1.
//
// SSE event contract: see CLAUDE.md §73-77. Identical wire format whether
// the underlying endpoint is `ai-chat` (legacy, standalone) or `api-chat`
// (public, embedded). The path is chosen by the caller via `endpoint`.

import EventSource from 'react-native-sse';
import type { ApiClient } from '@/types';
import type {
  ChatRequest,
  CoachCallbacks,
  CoachResponse,
  CoachMessage,
  StreamChunk,
} from './types';

export function streamChat(
  client: ApiClient,
  endpoint: string,
  request: ChatRequest,
  callbacks: CoachCallbacks,
  abortSignal?: AbortSignal,
): void {
  let fullResponse = '';
  let routineModified = false;

  // EventSource needs the headers up-front (no async build), so resolve them
  // first then open the stream. We accept the small extra await here because
  // streaming is interactive — a few ms before the first byte is invisible.
  client
    .buildHeaders({ Accept: 'text/event-stream' })
    .then((headers) => {
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${client.apiBaseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

      const es = new EventSource(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const cleanup = () => {
        es.removeAllEventListeners();
        es.close();
      };

      if (abortSignal) abortSignal.addEventListener('abort', cleanup);

      // react-native-sse types both `data` and `message` fields as nullable
      // strings — we coerce to undefined to keep the existing flow tidy.
      es.addEventListener('message', (event: { data?: string | null }) => {
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

      es.addEventListener('error', (event: unknown) => {
        cleanup();
        if (abortSignal?.aborted) return;
        const msg =
          (event as { message?: string } | null)?.message ?? 'Streaming connection error';
        callbacks.onError(msg);
      });
    })
    .catch((err: Error) => {
      callbacks.onError(err.message ?? 'Failed to open stream');
    });
}

export async function sendChat(
  client: ApiClient,
  endpoint: string,
  request: ChatRequest,
): Promise<CoachResponse> {
  return client.request<CoachResponse>(endpoint, {
    method: 'POST',
    headers: { 'x-no-stream': 'true' },
    body: request,
  });
}

export function buildConversationHistory(
  messages: { role: string; content: string }[],
): CoachMessage[] {
  return messages.map((m) => ({
    role: m.role as CoachMessage['role'],
    content: m.content,
  }));
}
