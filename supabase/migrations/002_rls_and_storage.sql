-- Gohan AI — RLS, Auth Trigger, Storage
-- Owner: @DanteDia (DEV 3 — infrastructure)
--
-- Apply AFTER 001_initial_schema.sql.
-- Adds:
--   1. updated_at trigger on routines
--   2. auto-create profile when a new auth.users row appears (linked to default tenant)
--   3. RLS policies (multi-tenant: every row is reachable only by its owner)
--   4. Storage bucket for chat audio + RLS on storage.objects

-- ─────────────────────────────────────────────────────────────
-- 1. updated_at trigger on routines
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS routines_set_updated_at ON public.routines;
CREATE TRIGGER routines_set_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2. Auto-create profile on signup
--    Reads tenant slug from raw_user_meta_data.tenant_slug,
--    falling back to 'default'. Display name from metadata too.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_tenant_slug TEXT;
  v_display_name TEXT;
BEGIN
  v_tenant_slug := COALESCE(NEW.raw_user_meta_data->>'tenant_slug', 'default');
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    ''
  );

  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = v_tenant_slug;
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'default';
  END IF;

  INSERT INTO public.profiles (id, tenant_id, display_name)
  VALUES (NEW.id, v_tenant_id, v_display_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_days       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;

-- Tenants: anyone authenticated can read (theming), nobody writes from client
DROP POLICY IF EXISTS "tenants_read_authenticated" ON public.tenants;
CREATE POLICY "tenants_read_authenticated"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: users see/edit only their own row
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Routines: owner only
DROP POLICY IF EXISTS "routines_owner_all" ON public.routines;
CREATE POLICY "routines_owner_all"
  ON public.routines FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Routine days: reachable through owned routine
DROP POLICY IF EXISTS "routine_days_owner_all" ON public.routine_days;
CREATE POLICY "routine_days_owner_all"
  ON public.routine_days FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines r
      WHERE r.id = routine_days.routine_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routines r
      WHERE r.id = routine_days.routine_id AND r.user_id = auth.uid()
    )
  );

-- Routine exercises: reachable through owned routine_day → routine
DROP POLICY IF EXISTS "routine_exercises_owner_all" ON public.routine_exercises;
CREATE POLICY "routine_exercises_owner_all"
  ON public.routine_exercises FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.routine_days rd
      JOIN public.routines r ON r.id = rd.routine_id
      WHERE rd.id = routine_exercises.routine_day_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.routine_days rd
      JOIN public.routines r ON r.id = rd.routine_id
      WHERE rd.id = routine_exercises.routine_day_id AND r.user_id = auth.uid()
    )
  );

-- Conversations: owner only
DROP POLICY IF EXISTS "conversations_owner_all" ON public.conversations;
CREATE POLICY "conversations_owner_all"
  ON public.conversations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Messages: reachable through owned conversation
DROP POLICY IF EXISTS "messages_owner_all" ON public.messages;
CREATE POLICY "messages_owner_all"
  ON public.messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 4. Storage: chat-audio bucket + RLS
--    Path convention: {auth.uid()}/{conversation_id}/{filename}
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-audio', 'chat-audio', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_audio_owner_select" ON storage.objects;
CREATE POLICY "chat_audio_owner_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "chat_audio_owner_insert" ON storage.objects;
CREATE POLICY "chat_audio_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "chat_audio_owner_delete" ON storage.objects;
CREATE POLICY "chat_audio_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
