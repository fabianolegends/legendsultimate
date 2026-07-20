-- Legends Core: resultados oficiais por etapa e classificação geral por pontos.

alter table public.stages
  add column if not exists classification_weight numeric(4,2),
  add column if not exists time_limit_s integer,
  add column if not exists results_published boolean not null default false;

update public.stages
set classification_weight = case stage_number
  when 1 then 1.15 when 2 then 1.00 when 3 then 1.20 when 4 then 0.65 else 1.00 end
where classification_weight is null;

update public.stages
set time_limit_s = case stage_number
  when 1 then 36000 when 2 then 32400 when 3 then 36000 when 4 then 21600 else null end
where time_limit_s is null;

alter table public.stages
  alter column classification_weight set default 1.00,
  alter column classification_weight set not null,
  drop constraint if exists stages_classification_weight_check,
  add constraint stages_classification_weight_check check (classification_weight between 0.10 and 5.00),
  drop constraint if exists stages_time_limit_s_check,
  add constraint stages_time_limit_s_check check (time_limit_s is null or time_limit_s > 0);

create table if not exists public.stage_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  stage_id uuid not null references public.stages(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete set null,
  activity_id uuid references public.activities(id) on delete set null,
  full_name text not null,
  bib_number text,
  category text not null,
  modality text not null default 'gravel_race',
  official_time_s integer not null check (official_time_s > 0),
  manual_time_s integer check (manual_time_s is null or manual_time_s > 0),
  time_penalty_s integer not null default 0 check (time_penalty_s >= 0),
  points_penalty numeric(8,2) not null default 0 check (points_penalty >= 0),
  final_time_s integer not null check (final_time_s > 0),
  position integer check (position is null or position > 0),
  base_points integer not null default 0 check (base_points >= 0),
  weighted_points numeric(8,2) not null default 0 check (weighted_points >= 0),
  status text not null default 'provisional'
    check (status in ('provisional', 'review', 'official', 'disqualified', 'dnf')),
  admin_note text,
  calculated_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, athlete_id)
);

create index if not exists stage_results_event_id_idx on public.stage_results(event_id);
create index if not exists stage_results_stage_category_position_idx on public.stage_results(stage_id, category, position);
create index if not exists stage_results_athlete_id_idx on public.stage_results(athlete_id);

alter table public.stage_results enable row level security;
grant all privileges on table public.stage_results to service_role;
