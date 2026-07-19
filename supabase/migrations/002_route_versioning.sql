-- Versionamento de percursos oficiais e bucket privado para GPX.

alter table public.routes
  drop constraint if exists routes_stage_id_key;

alter table public.routes
  add column if not exists version integer not null default 1,
  add column if not exists valid_from timestamptz not null default now(),
  add column if not exists valid_until timestamptz,
  add column if not exists is_active boolean not null default true,
  add column if not exists change_note text,
  add column if not exists created_by text;

create unique index if not exists routes_stage_version_uidx
  on public.routes(stage_id, version);

create unique index if not exists routes_one_active_per_stage_uidx
  on public.routes(stage_id)
  where is_active = true;

create index if not exists routes_stage_history_idx
  on public.routes(stage_id, version desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'official-routes',
  'official-routes',
  false,
  15728640,
  array['application/gpx+xml', 'application/xml', 'text/xml', 'application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Etapa temporária para validar o fluxo completo com o GPX enviado em 19/07/2026.
insert into public.stages (
  event_id,
  stage_number,
  name,
  route_label,
  stage_date,
  distance_km,
  elevation_m,
  direction_required,
  start_radius_m,
  finish_radius_m,
  checkpoint_radius_m,
  auto_validate_min_coverage,
  review_min_coverage
)
select
  e.id,
  1,
  'Stage Test 01',
  'Pedalada matinal — rota de teste',
  '2026-07-19',
  48.404,
  105,
  true,
  250,
  250,
  180,
  97.00,
  90.00
from public.events e
where e.slug = 'legends-test-2026'
on conflict (event_id, stage_number) do update set
  name = excluded.name,
  route_label = excluded.route_label,
  stage_date = excluded.stage_date,
  distance_km = excluded.distance_km,
  elevation_m = excluded.elevation_m;
