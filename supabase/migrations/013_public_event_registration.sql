alter table public.events
  add column if not exists registration_open boolean not null default false,
  add column if not exists registration_closes_at timestamptz,
  add column if not exists windfit_registration_url text,
  add column if not exists terms_url text;

alter table public.registrations
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_accepted_at timestamptz;

alter table public.registrations
  drop constraint if exists registrations_source_check;

alter table public.registrations
  add constraint registrations_source_check
  check (source in ('windfit', 'manual', 'online'));

alter table public.registrations
  drop constraint if exists registrations_online_consent_check;

alter table public.registrations
  add constraint registrations_online_consent_check
  check (source <> 'online' or (terms_accepted_at is not null and privacy_accepted_at is not null));

create index if not exists idx_events_public_registration
  on public.events(status, registration_open, starts_on)
  where status = 'published';

create index if not exists idx_registrations_event_active
  on public.registrations(event_id, status)
  where status <> 'cancelled';

create or replace function public.enforce_public_event_registration()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_event public.events%rowtype;
  active_registrations integer;
begin
  if new.source <> 'online' then
    return new;
  end if;

  select * into target_event
  from public.events
  where id = new.event_id
  for update;

  if not found or target_event.status <> 'published' or target_event.access_mode <> 'public' or not target_event.registration_open then
    raise exception 'As inscrições deste evento não estão abertas ao público.';
  end if;

  if target_event.registration_closes_at is not null and target_event.registration_closes_at < now() then
    raise exception 'O período de inscrições foi encerrado.';
  end if;

  if target_event.participant_limit is not null then
    select count(*) into active_registrations
    from public.registrations
    where event_id = new.event_id and status <> 'cancelled';

    if active_registrations >= target_event.participant_limit then
      raise exception 'As vagas deste evento estão esgotadas.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists registrations_public_capacity_guard on public.registrations;
create trigger registrations_public_capacity_guard
before insert on public.registrations
for each row execute function public.enforce_public_event_registration();
