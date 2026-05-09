-- Idempotent demo seed for live presentations.
-- Re-run anytime to reset the demo user back to a known state.
--
-- Prerequisite: a Supabase auth.users row for demo@gohan.ai must already exist.
-- Create it once with:
--   curl -X POST "$EXPO_PUBLIC_SUPABASE_URL/auth/v1/signup" \
--     -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"email":"demo@gohan.ai","password":"GohanDemo2026!","data":{"display_name":"Juan Demo","tenant_slug":"smartfit"}}'
-- Then in the Supabase SQL editor:
--   UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'demo@gohan.ai';
--
-- Then run this file. Login from the app with demo@gohan.ai / GohanDemo2026! to demo.

-- ─── Tenants ─────────────────────────────────────────────
INSERT INTO tenants (name, slug, primary_color, secondary_color, logo_url)
VALUES ('SmartFit Demo', 'smartfit', '#FF6B00', '#1A1A1A', NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color;

-- ─── Demo routine for demo@gohan.ai ──────────────────────
DO $$
DECLARE
  v_user UUID;
  v_routine UUID;
  v_day_lun UUID;
  v_day_mie UUID;
  v_day_vie UUID;
BEGIN
  SELECT id INTO v_user FROM auth.users WHERE email = 'demo@gohan.ai';
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'demo@gohan.ai not found in auth.users — sign up first (see header comment)';
  END IF;

  -- Profile: realistic intermediate trainer
  UPDATE profiles SET
    display_name = 'Juan Demo',
    fitness_level = 'intermediate',
    equipment_available = ARRAY['mancuernas', 'barra olímpica', 'rack', 'banco'],
    injuries = ARRAY[]::text[],
    training_days_per_week = 3,
    goals = ARRAY['hipertrofia', 'fuerza'],
    onboarding_completed = TRUE,
    -- Megatlon is the primary demo tenant (PR #10 wired the shell to it).
    -- Re-running this seed should not silently downgrade the demo user
    -- back to smartfit.
    tenant_id = (SELECT id FROM tenants WHERE slug = 'megatlon')
  WHERE id = v_user;

  -- Wipe any old routines for this user (cascade clears days + exercises)
  DELETE FROM routines WHERE user_id = v_user;

  -- Create the demo routine
  INSERT INTO routines (user_id, name, is_active)
  VALUES (v_user, 'Push / Pull / Legs', TRUE)
  RETURNING id INTO v_routine;

  -- Day 1 — Lunes (Push)
  INSERT INTO routine_days (routine_id, day_of_week, muscle_groups, label)
  VALUES (v_routine, 1, ARRAY['Pecho', 'Hombros', 'Tríceps'], 'Lunes — Push')
  RETURNING id INTO v_day_lun;

  INSERT INTO routine_exercises (routine_day_id, exercise_name, sets, reps, weight_kg, rest_seconds, order_index, ai_reasoning)
  VALUES
    (v_day_lun, 'Press de banca con barra', 4, 8, 60, 90, 0, 'Compuesto principal de pecho. 4x8 con peso desafiante para hipertrofia y fuerza.'),
    (v_day_lun, 'Press inclinado con mancuernas', 3, 10, 22.5, 75, 1, 'Énfasis en pecho superior, donde Juan suele estar menos desarrollado.'),
    (v_day_lun, 'Aperturas con mancuernas', 3, 12, 12, 60, 2, 'Aislamiento para acabar de fatigar el pecho.'),
    (v_day_lun, 'Press militar con barra', 4, 8, 35, 90, 3, 'Compuesto de hombro, base para el desarrollo de la sección anterior.'),
    (v_day_lun, 'Elevaciones laterales con mancuernas', 4, 12, 8, 45, 4, 'Aislamiento de deltoides medio para anchura del hombro.'),
    (v_day_lun, 'Press francés con barra', 3, 10, 25, 60, 5, 'Aislamiento de tríceps con énfasis en cabeza larga.');

  -- Day 2 — Miércoles (Pull)
  INSERT INTO routine_days (routine_id, day_of_week, muscle_groups, label)
  VALUES (v_routine, 3, ARRAY['Espalda', 'Bíceps'], 'Miércoles — Pull')
  RETURNING id INTO v_day_mie;

  INSERT INTO routine_exercises (routine_day_id, exercise_name, sets, reps, weight_kg, rest_seconds, order_index, ai_reasoning)
  VALUES
    (v_day_mie, 'Peso muerto convencional', 4, 6, 100, 120, 0, 'Compuesto pesado de la cadena posterior. Inicio del día cuando estás más fresco.'),
    (v_day_mie, 'Dominadas (lastradas si podés)', 4, 8, 0, 90, 1, 'Mejor ejercicio de espalda alta. Sumá lastre cuando hagas 4x8 limpio.'),
    (v_day_mie, 'Remo con barra', 3, 10, 50, 75, 2, 'Trabajo de espalda media, complementa las dominadas.'),
    (v_day_mie, 'Pull-over con mancuerna', 3, 12, 18, 60, 3, 'Aislamiento de dorsal, también trabaja serrato.'),
    (v_day_mie, 'Curl con barra', 3, 10, 30, 60, 4, 'Compuesto de bíceps, prioriza progresión de carga.'),
    (v_day_mie, 'Curl martillo con mancuernas', 3, 12, 12, 45, 5, 'Énfasis en braquial y braquioradial.');

  -- Day 3 — Viernes (Legs)
  INSERT INTO routine_days (routine_id, day_of_week, muscle_groups, label)
  VALUES (v_routine, 5, ARRAY['Cuádriceps', 'Glúteos', 'Femorales', 'Pantorrillas'], 'Viernes — Legs')
  RETURNING id INTO v_day_vie;

  INSERT INTO routine_exercises (routine_day_id, exercise_name, sets, reps, weight_kg, rest_seconds, order_index, ai_reasoning)
  VALUES
    (v_day_vie, 'Sentadilla con barra', 4, 8, 80, 120, 0, 'Rey de los ejercicios de pierna. 4x8 con técnica impecable.'),
    (v_day_vie, 'Peso muerto rumano con barra', 3, 10, 70, 90, 1, 'Dominante de cadera, aísla femorales y glúteos.'),
    (v_day_vie, 'Zancadas con mancuernas', 3, 12, 15, 75, 2, 'Unilateral, corrige asimetrías y trabaja estabilizadores.'),
    (v_day_vie, 'Hip thrust con barra', 3, 12, 60, 75, 3, 'Aislamiento de glúteos, clave para el desarrollo posterior.'),
    (v_day_vie, 'Extensiones de cuádriceps (si tenés)', 3, 12, NULL, 60, 4, 'Aislamiento. Si no tenés máquina, reemplazar por sissy squats.'),
    (v_day_vie, 'Elevación de talones con mancuernas', 4, 15, 20, 45, 5, 'Pantorrillas, alto rep range para hipertrofia del sóleo.');

  RAISE NOTICE 'Demo seed applied. Login: demo@gohan.ai / GohanDemo2026!';
END $$;
