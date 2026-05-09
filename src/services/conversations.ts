import type { ChatMessage, Conversation, MessageRole } from '../types';
import { supabase } from './supabase';

interface ConversationRow {
  id: string;
  user_id: string;
  created_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  audio_url: string | null;
  created_at: string;
}

function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    audioUrl: row.audio_url,
    createdAt: row.created_at,
  };
}

export async function getOrCreateConversation(userId: string): Promise<Conversation> {
  const { data: existing, error: selectErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectErr) throw selectErr;
  if (existing) return rowToConversation(existing as ConversationRow);

  const { data: created, error: insertErr } = await supabase
    .from('conversations')
    .insert({ user_id: userId })
    .select('*')
    .single();

  if (insertErr || !created) throw insertErr ?? new Error('Failed to create conversation');
  return rowToConversation(created as ConversationRow);
}

export async function createConversation(userId: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId })
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('Failed to create conversation');
  return rowToConversation(data as ConversationRow);
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as MessageRow[]).map(rowToMessage);
}

export async function saveMessage(
  message: Omit<ChatMessage, 'id' | 'createdAt'>
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: message.conversationId,
      role: message.role,
      content: message.content,
      audio_url: message.audioUrl,
    })
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('Failed to save message');
  return rowToMessage(data as MessageRow);
}

export async function uploadAudioMessage(
  userId: string,
  conversationId: string,
  audio: Blob | ArrayBuffer | Uint8Array,
  contentType = 'audio/m4a'
): Promise<string> {
  const ext = contentType.split('/')[1] ?? 'm4a';
  const path = `${userId}/${conversationId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('chat-audio')
    .upload(path, audio as Blob, { contentType, upsert: false });

  if (error) throw error;
  return path;
}

export async function getAudioSignedUrl(path: string, expiresInSec = 60 * 60): Promise<string> {
  const { data, error } = await supabase.storage
    .from('chat-audio')
    .createSignedUrl(path, expiresInSec);

  if (error || !data) throw error ?? new Error('Failed to sign audio URL');
  return data.signedUrl;
}
