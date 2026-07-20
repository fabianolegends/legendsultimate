-- Legends Core
-- Migration 006: registrations, athlete eligibility and Strava account linking.

alter table public.athletes
  add column if not exists bib_number text,
  add column if not exists birth_date date,
  add column if not exists gender text,
  add column if not exists modality text;

alter table public.athletes
  drop constraint if exists athletes_gender_check;

alter table public.athletes
  add constraint athletes_gender_check
  check (gender is null or gender in ('male', 'female', 'other'));

alter table public.athletes
  drop constraint if exists athletes_modality_check;

alter table public.athletes
  add constraint athletes_modality_check
  check (modality is null or modality in ('gravel_race', 'experience'));

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete set null,
  registration_code text not null unique,
  bib_number text,
  full_name text not null,
  email text not null,
  birth_date date,
  gender text check (gender is null or gender in ('male', 'female', 'other')),
  category text,
  modality text not null default 'gravel_race'
    check (modality in ('gravel_race', 'experience')),
  country_code text,
  city text,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'waitlist', 'cancelled')),
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email),
  unique (event_id, bib_number)
);

create index if not exists registrations_event_id_idx on public.registrations(event_id);
create index if not exists registrations_athlete_id_idx on public.registrations(athlete_id);
create index if not exists registrations_status_idx on public.registrations(status);
create index if not exists registrations_category_idx on public.registrations(category);

alter table public.registrations enable row level security;

grant all privileges on table public.registrations to service_role;

-- Keep existing default privileges compatible with future server-side tables.
alter default privileges in schema public
grant all privileges on tables to service_role;
