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
}
