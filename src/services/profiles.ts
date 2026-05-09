import type { UserProfile } from '../types';

// TODO: @DanteDia — implement with Supabase queries

export async function getProfile(_userId: string): Promise<UserProfile | null> {
  throw new Error('Not implemented');
}

export async function updateProfile(
  _userId: string,
  _data: Partial<UserProfile>
): Promise<void> {
  throw new Error('Not implemented');
}
