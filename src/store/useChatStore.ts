import { create } from 'zustand';
import type { ChatMessage, StreamingState } from '../types';

interface ChatState {
  messages: ChatMessage[];
  streaming: StreamingState;
  activeTool: string | null;
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setStreaming: (streaming: Partial<StreamingState>) => void;
  setActiveTool: (toolName: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streaming: { isStreaming: false, partialContent: '' },
  activeTool: null,
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m,
      ),
    })),
  setMessages: (messages) => set({ messages }),
  setStreaming: (streaming) =>
    set((state) => ({ streaming: { ...state.streaming, ...streaming } })),
  setActiveTool: (activeTool) => set({ activeTool }),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [], activeTool: null }),
}));
