// Wire-level types for the public chat API. Mirrors the SSE/JSON contract
// served by both `ai-chat` (legacy) and `api-chat` (public). Kept in
// `src/services/api/` so they ship with the embedded npm module without
// pulling in the dead `src/modules/ai/` tree (see ARCHITECTURE.md §13).

import type { MessageRole } from '@/types';

export interface CoachMessage {
  role: MessageRole;
  content: string;
}

export interface ToolCallResult {
  toolName: string;
  success: boolean;
  result: unknown;
}

export interface CoachResponse {
  content: string;
  toolCalls: ToolCallResult[];
  routineModified: boolean;
}

export interface CitedSource {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  url: string | null;
  claim_short: string;
}

export interface StreamChunk {
  type: 'text' | 'tool_start' | 'tool_end' | 'done' | 'error' | 'sources';
  content: string;
  toolName?: string;
  toolSuccess?: boolean;
  sources?: CitedSource[];
}

export interface ChatRequestUserProfile {
  id: string;
  displayName: string;
  fitnessLevel: string;
  equipmentAvailable: string[];
  injuries: string[];
  trainingDaysPerWeek: number;
  goals: string[];
  onboardingCompleted: boolean;
  coachStyle?: string;
}

export interface ChatRequest {
  userMessage: string;
  conversationHistory: CoachMessage[];
  userProfile: ChatRequestUserProfile | null;
}

export interface CoachCallbacks {
  onToken: (token: string) => void;
  onToolStart: (toolName: string) => void;
  onToolEnd: (toolName: string, success: boolean) => void;
  onSources?: (sources: CitedSource[]) => void;
  onDone: (fullResponse: string, routineModified: boolean) => void;
  onError: (error: string) => void;
}
