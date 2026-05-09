export interface CoachConfig {
  model: string;
  maxTokens: number;
  systemPrompt: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}
