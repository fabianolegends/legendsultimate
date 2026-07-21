-- Legends Core
-- Migration 005: checkpoint timing, passages and ranked segments.

alter table public.checkpoints
  add column if not exists checkpoint_kind text not null default 'control',
  add column if not exists is_timing_point boolean not null default true;

alter table public.checkpoints
  drop constraint if exists checkpoints_checkpoint_kind_check;

alter table public.checkpoints
  add constraint checkpoints_checkpoint_kind_check
  check (checkpoint_kind in ('start', 'control', 'finish'));

create table if not exists public.timed_segments (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  name text not null,
  segment_type text not null default 'custom'
    check (segment_type in ('climb', 'sprint', 'custom')),
  start_checkpoint_id uuid not null references public.checkpoints(id) on delete cascade,
  finish_checkpoint_id uuid not null references public.checkpoints(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, name),
  check (start_checkpoint_id <> finish_checkpoint_id)
);

create table if not exists public.checkpoint_passages (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints(id) on delete cascade,
  point_index integer not null check (point_index >= 0),
  elapsed_s numeric(12,3) not null check (elapsed_s >= 0),
  activity_distance_m numeric(12,3),
  nearest_distance_m numeric(10,3) not null,
  passed_at timestamptz not null,
  detected_at timestamptz not null default now(),
  unique (activity_id, checkpoint_id)
);

create table if not exists public.segment_results (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  segment_id uuid not null references public.timed_segments(id) on delete cascade,
  start_passage_id uuid not null references public.checkpoint_passages(id) on delete cascade,
  finish_passage_id uuid not null references public.checkpoint_passages(id) on delete cascade,
  elapsed_s numeric(12,3) not null check (elapsed_s > 0),
  status text not null default 'valid' check (status in ('valid', 'review', 'invalid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, segment_id)
);

create index if not exists timed_segments_stage_id_idx on public.timed_segments(stage_id);
create index if not exists checkpoint_passages_activity_id_idx on public.checkpoint_passages(activity_id);
create index if not exists checkpoint_passages_checkpoint_id_idx on public.checkpoint_passages(checkpoint_id);
create index if not exists segment_results_segment_elapsed_idx on public.segment_results(segment_id, elapsed_s);
create index if not exists segment_results_activity_id_idx on public.segment_results(activity_id);

alter table public.timed_segments enable row level security;
alter table public.checkpoint_passages enable row level security;
alter table public.segment_results enable row level security;

grant all privileges on table public.timed_segments to service_role;
grant all privileges on table public.checkpoint_passages to service_role;
grant all privileges on table public.segment_results to service_role;

-- Existing routes receive normalized checkpoint roles.
update public.checkpoints c
set checkpoint_kind = case
  when c.sequence = 0 then 'start'
  when c.sequence = (select max(c2.sequence) from public.checkpoints c2 where c2.stage_id = c.stage_id) then 'finish'
  else 'control'
end;
