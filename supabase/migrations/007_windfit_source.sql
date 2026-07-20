-- Legends Core
-- Migration 007: Windfit as official registration and payment source.

alter table public.registrations
  add column if not exists source text not null default 'manual',
  add column if not exists external_registration_id text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists imported_at timestamptz,
  add column if not exists last_synced_at timestamptz;

alter table public.registrations
  drop constraint if exists registrations_source_check;

alter table public.registrations
  add constraint registrations_source_check
  check (source in ('windfit', 'manual'));

alter table public.registrations
  drop constraint if exists registrations_payment_status_check;

alter table public.registrations
  add constraint registrations_payment_status_check
  check (payment_status in ('paid', 'pending', 'refunded', 'cancelled', 'courtesy'));

create unique index if not exists registrations_event_external_id_unique
  on public.registrations(event_id, external_registration_id)
  where external_registration_id is not null;

create index if not exists registrations_payment_status_idx
  on public.registrations(payment_status);

create index if not exists registrations_source_idx
  on public.registrations(source);

update public.registrations
set
  source = coalesce(source, 'manual'),
  payment_status = case
    when status = 'confirmed' then 'courtesy'
    when status = 'cancelled' then 'cancelled'
    else 'pending'
  end,
  imported_at = coalesce(imported_at, created_at),
  last_synced_at = coalesce(last_synced_at, updated_at)
where source = 'manual'
  and payment_status = 'pending';

grant all privileges on table public.registrations to service_role;
