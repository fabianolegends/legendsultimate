-- Migration 030: independent Ultimate and Short journeys.

alter table public.registrations
  add column if not exists journey_format text not null default 'ultimate';

alter table public.registrations
  drop constraint if exists registrations_journey_format_check;

alter table public.registrations
  add constraint registrations_journey_format_check
  check (journey_format in ('ultimate', 'short'));

create index if not exists registrations_event_journey_format_idx
  on public.registrations(event_id, journey_format, status);

alter table public.events
  add column if not exists public_remaining_spots_ultimate integer not null default 100,
  add column if not exists public_remaining_spots_short integer not null default 50;

alter table public.events
  drop constraint if exists events_public_remaining_spots_ultimate_nonnegative,
  drop constraint if exists events_public_remaining_spots_short_nonnegative;

alter table public.events
  add constraint events_public_remaining_spots_ultimate_nonnegative
    check (public_remaining_spots_ultimate between 0 and 100),
  add constraint events_public_remaining_spots_short_nonnegative
    check (public_remaining_spots_short between 0 and 50);

alter table public.stage_results
  add column if not exists journey_format text not null default 'ultimate';

alter table public.stage_results
  drop constraint if exists stage_results_journey_format_check;

alter table public.stage_results
  add constraint stage_results_journey_format_check
  check (journey_format in ('ultimate', 'short'));

alter table public.stage_results
  drop constraint if exists stage_results_stage_id_athlete_id_key;

alter table public.stage_results
  add constraint stage_results_stage_athlete_journey_unique
  unique (stage_id, athlete_id, journey_format);

create index if not exists stage_results_stage_journey_category_position_idx
  on public.stage_results(stage_id, journey_format, category, position);

comment on column public.registrations.journey_format is
  'Formato da jornada importado da Windfit: ultimate (Stages 01-04) ou short (Stages 03-04).';

comment on column public.stage_results.journey_format is
  'Mantém as classificações Ultimate e Short independentes nas etapas compartilhadas.';

comment on column public.events.public_remaining_spots_ultimate is
  'Contador manual da organização para as 100 vagas da Legends Ultimate.';

comment on column public.events.public_remaining_spots_short is
  'Contador manual da organização para as 50 vagas da Legends Short.';
