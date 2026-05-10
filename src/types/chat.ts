export type MessageRole = 'user' | 'assistant';

export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
}

export interface CitedSource {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  url: string | null;
  claim_short: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  audioUrl: string | null;
  createdAt: string;
  sources?: CitedSource[];
}

export interface StreamingState {
  isStreaming: boolean;
  partialContent: string;
}
