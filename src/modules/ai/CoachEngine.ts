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

export async function streamChat(
  request: ChatRequest,
  callbacks: CoachCallbacks,
  abortSignal?: AbortSignal
): Promise<void> {
  const url = `${SUPABASE_URL}/functions/v1/ai-chat`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(request),
    signal: abortSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    callbacks.onError(`Error ${response.status}: ${errorText}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError('No response stream available');
    return;
  }

  const decoder = new TextDecoder();
  let fullResponse = '';
  let routineModified = false;
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') {
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
              callbacks.onError(chunk.content);
              return;
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    callbacks.onDone(fullResponse, routineModified);
  } catch (err) {
    if (abortSignal?.aborted) return;
    callbacks.onError(err instanceof Error ? err.message : 'Unknown streaming error');
  }
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
