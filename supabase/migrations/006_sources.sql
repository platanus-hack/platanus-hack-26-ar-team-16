-- Migration 006: sources table for cite_sources tool
-- Stores curated scientific references that Claude can cite.
-- Read: public (anon). Write: service_role only.

create table if not exists public.sources (
  id              text primary key,
  title           text not null,
  authors         text,
  year            int,
  journal_or_org  text,
  category        text not null check (category in ('training','nutrition','recovery','injury','supplements','mental')),
  url             text,
  doi             text,
  claim_short     text not null,
  tags            text[] default '{}',
  created_at      timestamptz default now()
);

create index if not exists sources_tags_gin on public.sources using gin (tags);
create index if not exists sources_category_idx on public.sources (category);

alter table public.sources enable row level security;

-- Anyone (including anon) can read sources
create policy "sources_public_read"
  on public.sources for select
  using (true);

-- Only service role can write (seed + future admin)
create policy "sources_service_write"
  on public.sources for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
