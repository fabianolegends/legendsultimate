-- Legends Core
-- Migration 022: inscrições com checkout externo hospedado pelo Asaas.

alter table public.events
  add column if not exists registration_fee_cents integer,
  add column if not exists experience_fee_cents integer,
  add column if not exists asaas_checkout_expires_minutes integer not null default 120,
  add column if not exists asaas_max_installments integer not null default 1;

alter table public.events
  drop constraint if exists events_registration_source_check;

alter table public.events
  add constraint events_registration_source_check
  check (registration_source in ('windfit', 'manual', 'mixed', 'asaas'));

alter table public.events
  drop constraint if exists events_registration_fee_cents_check;

alter table public.events
  add constraint events_registration_fee_cents_check
  check (registration_fee_cents is null or registration_fee_cents > 0);

alter table public.events
  drop constraint if exists events_experience_fee_cents_check;

alter table public.events
  add constraint events_experience_fee_cents_check
  check (experience_fee_cents is null or experience_fee_cents > 0);

alter table public.events
  drop constraint if exists events_asaas_checkout_expires_minutes_check;

alter table public.events
  add constraint events_asaas_checkout_expires_minutes_check
  check (asaas_checkout_expires_minutes between 10 and 1440);

alter table public.events
  drop constraint if exists events_asaas_max_installments_check;

alter table public.events
  add constraint events_asaas_max_installments_check
  check (asaas_max_installments between 1 and 21);

alter table public.registrations
  add column if not exists payment_provider text,
  add column if not exists payment_amount_cents integer,
  add column if not exists payment_checkout_id text,
  add column if not exists payment_checkout_url text,
  add column if not exists payment_checkout_status text,
  add column if not exists payment_expires_at timestamptz,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_refunded_at timestamptz,
  add column if not exists last_payment_event_at timestamptz;

alter table public.registrations
  drop constraint if exists registrations_payment_provider_check;

alter table public.registrations
  add constraint registrations_payment_provider_check
  check (payment_provider is null or payment_provider = 'asaas');

alter table public.registrations
  drop constraint if exists registrations_payment_amount_cents_check;

alter table public.registrations
  add constraint registrations_payment_amount_cents_check
  check (payment_amount_cents is null or payment_amount_cents > 0);

alter table public.registrations
  drop constraint if exists registrations_payment_status_check;

alter table public.registrations
  add constraint registrations_payment_status_check
  check (payment_status in (
    'paid',
    'pending',
    'refunded',
    'cancelled',
    'courtesy',
    'failed',
    'chargeback',
    'risk_analysis'
  ));

create unique index if not exists registrations_payment_checkout_id_unique
  on public.registrations(payment_checkout_id)
  where payment_checkout_id is not null;

create index if not exists registrations_payment_provider_idx
  on public.registrations(payment_provider, payment_status);

create index if not exists registrations_payment_expires_at_idx
  on public.registrations(payment_expires_at)
  where payment_status = 'pending';

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'asaas'),
  provider_event_id text not null,
  event_type text not null,
  registration_id uuid references public.registrations(id) on delete set null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (provider, provider_event_id)
);

create index if not exists payment_webhook_events_registration_idx
  on public.payment_webhook_events(registration_id, received_at desc);

alter table public.payment_webhook_events enable row level security;

grant all privileges on table public.payment_webhook_events to service_role;
grant all privileges on table public.events to service_role;
grant all privileges on table public.registrations to service_role;

-- A renovação de um checkout cancelado também volta a reservar uma vaga.
-- O bloqueio do evento evita ultrapassar o limite em requisições concorrentes.
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

  if tg_op = 'UPDATE' and old.status <> 'cancelled' then
    return new;
  end if;

  -- Uma confirmação financeira tardia nunca pode ficar invisível. Checkouts
  -- expirados não deveriam aceitar pagamento, mas os webhooks podem chegar fora
  -- de ordem; nesse caso o compromisso financeiro prevalece para tratamento.
  if tg_op = 'UPDATE' and new.payment_status = 'paid' then
    return new;
  end if;

  if new.status = 'cancelled' then
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
    where event_id = new.event_id
      and status <> 'cancelled'
      and id <> new.id;

    if active_registrations >= target_event.participant_limit then
      raise exception 'As vagas deste evento estão esgotadas.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists registrations_public_capacity_guard on public.registrations;
create trigger registrations_public_capacity_guard
before insert or update of status on public.registrations
for each row execute function public.enforce_public_event_registration();
