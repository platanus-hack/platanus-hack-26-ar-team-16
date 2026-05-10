export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type CoachStyle = 'amable' | 'intenso' | 'picante';

export interface UserProfile {
  id: string;
  tenantId: string;
  displayName: string;
  avatarUrl: string | null;
  fitnessLevel: FitnessLevel;
  equipmentAvailable: string[];
  injuries: string[];
  trainingDaysPerWeek: number;
  goals: string[];
  onboardingCompleted: boolean;
  createdAt: string;
  // External identity (Phase 1 — docs/ARCHITECTURE.md §10).
  // Nullable because legacy rows may not have these populated yet, and
  // the standalone-consumer signup writes them only via the trigger
  // refresh in migration 004. Existing consumers must treat them as
  // optional fields.
  externalId?: string | null;
  externalIdp?: string | null;
  lastActiveAt?: string | null;
}
