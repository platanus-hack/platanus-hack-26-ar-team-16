// TODO: @Juampiman — Claude API integration with streaming + tool_use

export interface CoachResponse {
  content: string;
  toolCalls?: ToolCallResult[];
}

export interface ToolCallResult {
  toolName: string;
  success: boolean;
  result: unknown;
}

// Placeholder — DEV 4 implements the full engine
export async function sendMessage(
  _userMessage: string,
  _userId: string,
  _conversationHistory: { role: string; content: string }[]
): Promise<CoachResponse> {
  throw new Error('Not implemented — @Juampiman');
}

// Streaming version — DEV 4 implements
export async function* streamMessage(
  _userMessage: string,
  _userId: string,
  _conversationHistory: { role: string; content: string }[]
): AsyncGenerator<string> {
  throw new Error('Not implemented — @Juampiman');
}
