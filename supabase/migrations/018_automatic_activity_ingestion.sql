-- Legends Core: persistent, encrypted Ride with GPS authorization and sync audit.

create table if not exists public.ride_with_gps_connections (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  ride_with_gps_user_id bigint unique not null,
  access_token_ciphertext text not null,
  access_token_iv text not null,
  access_token_tag text not null,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'error')),
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ride_with_gps_connections_status_idx
  on public.ride_with_gps_connections(status, last_sync_at nulls first);

create table if not exists public.activity_sync_runs (
  id uuid primary key default gen_random_uuid(),
  trigger_source text not null default 'manual'
    check (trigger_source in ('manual', 'scheduled')),
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'partial', 'failed')),
  connections_scanned integer not null default 0,
  trips_scanned integer not null default 0,
  activities_imported integer not null default 0,
  activities_skipped integer not null default 0,
  errors_count integer not null default 0,
  details jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists activity_sync_runs_started_idx
  on public.activity_sync_runs(started_at desc);

alter table public.ride_with_gps_connections enable row level security;
alter table public.activity_sync_runs enable row level security;

grant all privileges on table public.ride_with_gps_connections to service_role;
grant all privileges on table public.activity_sync_runs to service_role;
