import type { FitnessLevel, UserProfile } from '../types';
import type { Database } from '../types/database';
import { supabase } from './supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

function rowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    fitnessLevel: row.fitness_level as FitnessLevel,
    equipmentAvailable: row.equipment_available ?? [],
    injuries: row.injuries ?? [],
    trainingDaysPerWeek: row.training_days_per_week,
    goals: row.goals ?? [],
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at,
  };
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function updateProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const updates: ProfileUpdate = {};
  if (data.displayName !== undefined) updates.display_name = data.displayName;
  if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
  if (data.fitnessLevel !== undefined) updates.fitness_level = data.fitnessLevel;
  if (data.equipmentAvailable !== undefined)
    updates.equipment_available = data.equipmentAvailable;
  if (data.injuries !== undefined) updates.injuries = data.injuries;
  if (data.trainingDaysPerWeek !== undefined)
    updates.training_days_per_week = data.trainingDaysPerWeek;
  if (data.goals !== undefined) updates.goals = data.goals;
  if (data.onboardingCompleted !== undefined)
    updates.onboarding_completed = data.onboardingCompleted;
  if (data.tenantId !== undefined) updates.tenant_id = data.tenantId;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function markOnboardingCompleted(userId: string): Promise<void> {
  await updateProfile(userId, { onboardingCompleted: true });
}
