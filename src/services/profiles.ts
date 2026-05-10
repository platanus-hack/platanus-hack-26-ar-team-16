import type { FitnessLevel, UserProfile } from '../types';
import type { Database } from '../types/database';
import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

type Db = SupabaseClient<Database>;
function db(client?: Db): Db {
  return client ?? (supabase as Db);
}

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

export async function getProfile(
  userId: string,
  client?: Db,
): Promise<UserProfile | null> {
  const { data, error } = await db(client)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function updateProfile(
  userId: string,
  data: Partial<UserProfile>,
  client?: Db,
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

  const { error } = await db(client).from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

