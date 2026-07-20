-- Legends Core: integridade da apuração, publicação e trilha de auditoria.

alter table public.activities
  add column if not exists track_fingerprint text;

create index if not exists activities_stage_fingerprint_idx
  on public.activities(stage_id, track_fingerprint)
  where track_fingerprint is not null;

update public.activities
set track_fingerprint = encode(digest(gps_points::text, 'sha256'), 'hex')
where track_fingerprint is null and gps_points is not null;

alter table public.stages
  add column if not exists results_locked boolean not null default false,
  add column if not exists results_published_at timestamptz;

alter table public.stage_results
  add column if not exists integrity_status text not null default 'clean';

alter table public.stage_results
  drop constraint if exists stage_results_integrity_status_check;

alter table public.stage_results
  add constraint stage_results_integrity_status_check
  check (integrity_status in ('clean', 'duplicate', 'reviewed'));

create table if not exists public.stage_result_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  stage_id uuid not null references public.stages(id) on delete cascade,
  result_id uuid references public.stage_results(id) on delete set null,
  action text not null check (action in ('adjust_result', 'publish_stage', 'reopen_stage')),
  note text not null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists stage_result_audit_stage_idx
  on public.stage_result_audit_log(stage_id, created_at desc);

alter table public.stage_result_audit_log enable row level security;
grant all privileges on table public.stage_result_audit_log to service_role;

with duplicate_tracks as (
  select stage_id, track_fingerprint
  from public.activities
  where stage_id is not null and track_fingerprint is not null
  group by stage_id, track_fingerprint
  having count(distinct athlete_id) > 1
)
update public.stage_results sr
set integrity_status = 'duplicate', updated_at = now()
from public.activities a
join duplicate_tracks d
  on d.stage_id = a.stage_id and d.track_fingerprint = a.track_fingerprint
where sr.activity_id = a.id and sr.integrity_status = 'clean';
