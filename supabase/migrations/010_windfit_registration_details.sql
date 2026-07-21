-- Detalhes operacionais presentes na exportação de inscritos da Windfit.

alter table public.registrations
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists registered_at timestamptz;

create index if not exists registrations_registered_at_idx
  on public.registrations (registered_at);
