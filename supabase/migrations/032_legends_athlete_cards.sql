-- Legends Core
-- Migration 032: cards públicos de atletas confirmados, geridos no painel privado.

create table if not exists public.legends_athlete_cards (
  id uuid primary key default gen_random_uuid(),
  athlete_name text not null check (char_length(athlete_name) between 2 and 120),
  location text,
  image_path text not null unique,
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legends_athlete_cards_public_order_idx
  on public.legends_athlete_cards (published, display_order, created_at);

alter table public.legends_athlete_cards enable row level security;

grant all privileges on table public.legends_athlete_cards to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'legends-athlete-cards',
  'legends-athlete-cards',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
