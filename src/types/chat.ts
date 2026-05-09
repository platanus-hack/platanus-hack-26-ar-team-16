export type MessageRole = 'user' | 'assistant';

export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  audioUrl: string | null;
  createdAt: string;
}

export interface StreamingState {
  isStreaming: boolean;
  partialContent: string;
}
