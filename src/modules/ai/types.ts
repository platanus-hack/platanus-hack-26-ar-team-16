import type { MessageRole } from '../../types';

export interface CoachConfig {
  model: string;
  maxTokens: number;
}

export interface CoachMessage {
  role: MessageRole;
  content: string;
}

export interface CoachResponse {
  content: string;
  toolCalls: ToolCallResult[];
  routineModified: boolean;
}

export interface ToolCallResult {
  toolName: string;
  success: boolean;
  result: unknown;
}

export interface StreamChunk {
  type: 'text' | 'tool_start' | 'tool_end' | 'done' | 'error';
  content: string;
  toolName?: string;
  toolSuccess?: boolean;
}

export interface ChatRequest {
  userMessage: string;
  conversationHistory: CoachMessage[];
  userProfile: {
    id: string;
    displayName: string;
    fitnessLevel: string;
    equipmentAvailable: string[];
    injuries: string[];
    trainingDaysPerWeek: number;
    goals: string[];
    onboardingCompleted: boolean;
  } | null;
}

export interface ToolInput {
  [key: string]: unknown;
}

export interface CreateRoutineInput {
  routine_name: string;
  days: {
    day_of_week: number;
    muscle_groups: string[];
    label: string;
    exercises: {
      exercise_name: string;
      sets: number;
      reps: number;
      weight_kg: number | null;
      rest_seconds: number;
      notes: string | null;
      ai_reasoning: string;
    }[];
  }[];
}

export interface UpdateExerciseInput {
  exercise_id: string;
  updates: {
    exercise_name?: string;
    sets?: number;
    reps?: number;
    weight_kg?: number | null;
    rest_seconds?: number;
    notes?: string | null;
    ai_reasoning?: string;
  };
}

export interface ReplaceExerciseInput {
  exercise_id: string;
  new_exercise: {
    exercise_name: string;
    sets: number;
    reps: number;
    weight_kg: number | null;
    rest_seconds: number;
    notes: string | null;
    ai_reasoning: string;
  };
}

export interface AddExerciseInput {
  routine_day_id: string;
  exercise: {
    exercise_name: string;
    sets: number;
    reps: number;
    weight_kg: number | null;
    rest_seconds: number;
    notes: string | null;
    ai_reasoning: string;
  };
}

export interface RemoveExerciseInput {
  exercise_id: string;
}
