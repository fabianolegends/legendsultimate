create extension if not exists pgcrypto;

create type public.event_status as enum ('draft', 'published', 'archived');
create type public.activity_source as enum ('ride_with_gps', 'gpx', 'fit', 'tcx');
create type public.validation_status as enum ('pending', 'validated', 'review', 'rejected');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  timezone text not null default 'America/Sao_Paulo',
  status public.event_status not null default 'draft',
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  stage_number integer not null check (stage_number > 0),
  name text not null,
  route_label text,
  stage_date date not null,
  distance_km numeric(8,3),
  elevation_m integer,
  direction_required boolean not null default true,
  start_radius_m integer not null default 300,
  finish_radius_m integer not null default 300,
  checkpoint_radius_m integer not null default 200,
  auto_validate_min_coverage numeric(5,2) not null default 97.00,
  review_min_coverage numeric(5,2) not null default 90.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, stage_number)
);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid unique not null references public.stages(id) on delete cascade,
  file_name text not null,
  storage_path text,
  distance_km numeric(8,3) not null,
  elevation_m integer,
  start_lat double precision not null,
  start_lng double precision not null,
  finish_lat double precision not null,
  finish_lng double precision not null,
  route_points jsonb not null,
  created_at timestamptz not null default now()
);

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  label text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_m integer not null default 200,
  route_progress numeric(5,2),
  created_at timestamptz not null default now(),
  unique (stage_id, sequence)
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  ride_with_gps_user_id bigint unique,
  full_name text not null,
  email text,
  country_code text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete set null,
  source public.activity_source not null,
  source_activity_id text,
  name text not null,
  started_at timestamptz not null,
  distance_km numeric(8,3) not null,
  elevation_m integer,
  moving_time_s integer,
  avg_speed_kmh numeric(6,2),
  avg_heart_rate numeric(6,2),
  avg_watts numeric(7,2),
  gps_points jsonb,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (source, source_activity_id)
);

create table public.validation_results (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid unique not null references public.activities(id) on delete cascade,
  stage_id uuid not null references public.stages(id) on delete cascade,
  status public.validation_status not null default 'pending',
  coverage_percent numeric(5,2),
  start_ok boolean,
  finish_ok boolean,
  direction_ok boolean,
  checkpoints_passed integer,
  checkpoints_total integer,
  max_deviation_m integer,
  notes text,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stages_event_id_idx on public.stages(event_id);
create index checkpoints_stage_id_idx on public.checkpoints(stage_id);
create index activities_athlete_id_idx on public.activities(athlete_id);
create index activities_stage_id_idx on public.activities(stage_id);
create index activities_started_at_idx on public.activities(started_at);
create index validation_results_stage_id_idx on public.validation_results(stage_id);

alter table public.events enable row level security;
alter table public.stages enable row level security;
alter table public.routes enable row level security;
alter table public.checkpoints enable row level security;
alter table public.athletes enable row level security;
alter table public.activities enable row level security;
alter table public.validation_results enable row level security;

create policy "Published events are public"
on public.events for select
to anon, authenticated
using (status = 'published');

create policy "Published stages are public"
on public.stages for select
to anon, authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = stages.event_id and e.status = 'published'
  )
);

create policy "Published checkpoints are public"
on public.checkpoints for select
to anon, authenticated
using (
  exists (
    select 1
    from public.stages s
    join public.events e on e.id = s.event_id
    where s.id = checkpoints.stage_id and e.status = 'published'
  )
);

create policy "Athletes can read own profile"
on public.athletes for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create policy "Athletes can update own profile"
on public.athletes for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

create policy "Athletes can read own activities"
on public.activities for select
to authenticated
using (
  exists (
    select 1 from public.athletes a
    where a.id = activities.athlete_id
      and a.auth_user_id = (select auth.uid())
  )
);

create policy "Athletes can read own validation results"
on public.validation_results for select
to authenticated
using (
  exists (
    select 1
    from public.activities act
    join public.athletes a on a.id = act.athlete_id
    where act.id = validation_results.activity_id
      and a.auth_user_id = (select auth.uid())
  )
);

insert into public.events (slug, name, timezone, status, starts_on, ends_on)
values ('legends-test-2026', 'Legends Test 2026', 'America/Sao_Paulo', 'draft', '2026-07-19', '2026-07-19')
on conflict (slug) do nothing;
