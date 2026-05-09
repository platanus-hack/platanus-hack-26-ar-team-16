-- Megatlon tenant seed.
-- Run from Supabase SQL editor in the gohan-ai project.
-- Idempotent: safe to re-run.

insert into public.tenants (slug, name, primary_color, logo_url)
values (
  'megatlon',
  'Megatlon',
  '#FF6B00',
  null  -- swap when a real Megatlon logo asset is uploaded
)
on conflict (slug) do update
  set name = excluded.name,
      primary_color = excluded.primary_color,
      logo_url = excluded.logo_url;

-- 2. Optional: assign demo user to Megatlon tenant.
--    Pick ONE option — leave both commented until Dante decides.
--
--    OPTION A (simplest — reuse existing demo user):
--    update public.profiles
--      set tenant_slug = 'megatlon'
--      where id = (select id from auth.users where email = 'demo@gohan.ai');
--
--    OPTION B (cleaner — separate user per tenant):
--      Create demo-megatlon@gohan.ai via the Auth admin API,
--      then copy the routine:
--
--    insert into public.routines (user_id, name, description, is_active)
--      select '<new-user-id>', name, description, is_active
--      from public.routines
--      where user_id = (select id from auth.users where email = 'demo@gohan.ai')
--        and is_active = true;
--    -- (then copy routine_days and routine_exercises in the same way)
