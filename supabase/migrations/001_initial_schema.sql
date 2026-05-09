-- Gohan AI — Initial Schema
-- TODO: @DanteDia — review and apply via Supabase dashboard or CLI

-- Tenants (gym chains)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#6366F1',
  secondary_color TEXT NOT NULL DEFAULT '#4F46E5',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  fitness_level TEXT NOT NULL DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  equipment_available TEXT[] NOT NULL DEFAULT '{}',
  injuries TEXT[] NOT NULL DEFAULT '{}',
  training_days_per_week INT NOT NULL DEFAULT 3,
  goals TEXT[] NOT NULL DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Routines
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi Rutina',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Routine days
CREATE TABLE routine_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (routine_id, day_of_week)
);

-- Routine exercises
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_day_id UUID NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INT NOT NULL DEFAULT 3,
  reps INT NOT NULL DEFAULT 10,
  weight_kg DECIMAL,
  rest_seconds INT NOT NULL DEFAULT 60,
  order_index INT NOT NULL DEFAULT 0,
  notes TEXT,
  ai_reasoning TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_routines_user ON routines(user_id);
CREATE INDEX idx_routine_days_routine ON routine_days(routine_id);
CREATE INDEX idx_routine_exercises_day ON routine_exercises(routine_day_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Enable Realtime on routine_exercises (for live updates when AI modifies routine)
ALTER PUBLICATION supabase_realtime ADD TABLE routine_exercises;
ALTER PUBLICATION supabase_realtime ADD TABLE routine_days;

-- Insert default tenant
INSERT INTO tenants (name, slug, primary_color, secondary_color)
VALUES ('Gohan AI', 'default', '#6366F1', '#4F46E5');
