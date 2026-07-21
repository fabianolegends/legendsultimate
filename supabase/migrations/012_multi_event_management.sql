alter table public.events
  add column if not exists description text,
  add column if not exists location text,
  add column if not exists event_type text not null default 'stage_race',
  add column if not exists scoring_mode text not null default 'weighted_points',
  add column if not exists registration_source text not null default 'mixed',
  add column if not exists access_mode text not null default 'invite',
  add column if not exists participant_limit integer,
  add column if not exists is_test boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_event_type_check'
  ) then
    alter table public.events add constraint events_event_type_check
      check (event_type in ('stage_race', 'adventure', 'challenge'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'events_scoring_mode_check'
  ) then
    alter table public.events add constraint events_scoring_mode_check
      check (scoring_mode in ('weighted_points', 'elapsed_time', 'completion'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'events_registration_source_check'
  ) then
    alter table public.events add constraint events_registration_source_check
      check (registration_source in ('windfit', 'manual', 'mixed'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'events_access_mode_check'
  ) then
    alter table public.events add constraint events_access_mode_check
      check (access_mode in ('invite', 'public'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'events_participant_limit_check'
  ) then
    alter table public.events add constraint events_participant_limit_check
      check (participant_limit is null or participant_limit > 0);
  end if;
end $$;

create index if not exists idx_events_status_starts_on
  on public.events(status, starts_on desc);
