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

-- 2. Assign demo user to Megatlon tenant — OPTION A applied.
--    The original PR draft wrote `set tenant_slug = 'megatlon'` but the
--    profiles table stores `tenant_id` (FK to tenants.id), not a slug.
--    The version below is what was actually executed against gohan-ai.
update public.profiles
  set tenant_id = (select id from public.tenants where slug = 'megatlon')
  where id = (select id from auth.users where email = 'demo@gohan.ai');

-- (OPTION B left out — once a tenant has its own demo user, copying routines
--  across users is a fresh migration, not a seed.)
