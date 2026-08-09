alter table public.events
  add column if not exists public_remaining_spots integer;

update public.events
set public_remaining_spots = participant_limit
where public_remaining_spots is null
  and participant_limit is not null;

alter table public.events
  drop constraint if exists events_public_remaining_spots_nonnegative;

alter table public.events
  add constraint events_public_remaining_spots_nonnegative
  check (public_remaining_spots is null or public_remaining_spots >= 0);

comment on column public.events.public_remaining_spots is
  'Contador público de vagas restantes, atualizado manualmente pela organização.';
