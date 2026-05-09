import type { ChatMessage, Conversation } from '../types';

// TODO: @DanteDia — implement with Supabase queries

export async function getOrCreateConversation(
  _userId: string
): Promise<Conversation> {
  throw new Error('Not implemented');
}

export async function getMessages(
  _conversationId: string
): Promise<ChatMessage[]> {
  throw new Error('Not implemented');
}

export async function saveMessage(
  _message: Omit<ChatMessage, 'id' | 'createdAt'>
): Promise<ChatMessage> {
  throw new Error('Not implemented');
}
