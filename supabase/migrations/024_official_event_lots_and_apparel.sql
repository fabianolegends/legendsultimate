-- Legends Core
-- Migration 024: evento oficial 2027, lotes, desconto 60+ e vestuário.

create table if not exists public.registration_lots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  registration_fee_cents integer not null,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, display_order),
  check (ends_at > starts_at),
  check (registration_fee_cents > 0),
  check (display_order > 0)
);

create index if not exists registration_lots_event_period_idx
  on public.registration_lots(event_id, starts_at, ends_at);

alter table public.registration_lots enable row level security;

drop policy if exists "Published event lots are public"
  on public.registration_lots;
create policy "Published event lots are public"
on public.registration_lots for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = registration_lots.event_id
      and e.status = 'published'
  )
);

grant all privileges on table public.registration_lots to service_role;

alter table public.events
  add column if not exists premium_kit_enabled boolean not null default false,
  add column if not exists premium_kit_fee_cents integer,
  add column if not exists casual_shirt_required boolean not null default false,
  add column if not exists senior_discount_enabled boolean not null default false,
  add column if not exists senior_discount_percent integer not null default 50,
  add column if not exists regulation_version text;

alter table public.events
  drop constraint if exists events_premium_kit_fee_cents_check;
alter table public.events
  add constraint events_premium_kit_fee_cents_check
  check (
    (not premium_kit_enabled and premium_kit_fee_cents is null)
    or (premium_kit_enabled and premium_kit_fee_cents > 0)
  );

alter table public.events
  drop constraint if exists events_senior_discount_percent_check;
alter table public.events
  add constraint events_senior_discount_percent_check
  check (senior_discount_percent between 50 and 100);

alter table public.registrations
  add column if not exists registration_lot_id uuid
    references public.registration_lots(id) on delete set null,
  add column if not exists registration_lot_name text,
  add column if not exists registration_base_fee_cents integer,
  add column if not exists senior_discount_applied boolean not null default false,
  add column if not exists senior_discount_cents integer not null default 0,
  add column if not exists premium_kit_selected boolean not null default false,
  add column if not exists premium_kit_fee_cents integer not null default 0,
  add column if not exists casual_shirt_size text,
  add column if not exists jersey_size text,
  add column if not exists regulation_version text;

alter table public.registrations
  drop constraint if exists registrations_registration_base_fee_cents_check;
alter table public.registrations
  add constraint registrations_registration_base_fee_cents_check
  check (
    registration_base_fee_cents is null
    or registration_base_fee_cents > 0
  );

alter table public.registrations
  drop constraint if exists registrations_senior_discount_cents_check;
alter table public.registrations
  add constraint registrations_senior_discount_cents_check
  check (senior_discount_cents >= 0);

alter table public.registrations
  drop constraint if exists registrations_premium_kit_fee_cents_check;
alter table public.registrations
  add constraint registrations_premium_kit_fee_cents_check
  check (premium_kit_fee_cents >= 0);

alter table public.registrations
  drop constraint if exists registrations_casual_shirt_size_check;
alter table public.registrations
  add constraint registrations_casual_shirt_size_check
  check (
    casual_shirt_size is null
    or casual_shirt_size in ('PP', 'P', 'M', 'G', 'GG')
  );

alter table public.registrations
  drop constraint if exists registrations_jersey_size_check;
alter table public.registrations
  add constraint registrations_jersey_size_check
  check (
    (not premium_kit_selected and jersey_size is null)
    or (
      premium_kit_selected
      and premium_kit_fee_cents > 0
      and jersey_size in ('PP', 'P', 'M', 'G', 'GG')
    )
  );

create index if not exists registrations_registration_lot_idx
  on public.registrations(registration_lot_id);
create index if not exists registrations_apparel_idx
  on public.registrations(event_id, casual_shirt_size, jersey_size);

grant all privileges on table public.events to service_role;
grant all privileges on table public.registrations to service_role;

-- A camada do banco também impede inscrições fora dos lotes configurados.
create or replace function public.enforce_public_event_registration()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_event public.events%rowtype;
  active_registrations integer;
  has_lots boolean;
  has_active_lot boolean;
begin
  if new.source <> 'online' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status <> 'cancelled' then
    return new;
  end if;

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

  if not found
    or target_event.status <> 'published'
    or target_event.access_mode <> 'public'
    or not target_event.registration_open then
    raise exception 'As inscrições deste evento não estão abertas ao público.';
  end if;

  if target_event.registration_closes_at is not null
    and target_event.registration_closes_at < now() then
    raise exception 'O período de inscrições foi encerrado.';
  end if;

  select exists (
    select 1 from public.registration_lots l
    where l.event_id = new.event_id
  ) into has_lots;

  select exists (
    select 1 from public.registration_lots l
    where l.event_id = new.event_id
      and now() between l.starts_at and l.ends_at
  ) into has_active_lot;

  if has_lots and not has_active_lot then
    raise exception 'Não há lote de inscrições vigente nesta data.';
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

drop trigger if exists registrations_public_capacity_guard
  on public.registrations;
create trigger registrations_public_capacity_guard
before insert or update of status on public.registrations
for each row execute function public.enforce_public_event_registration();

-- Cria a configuração inicial como evento de teste interno. Ele permanece em
-- rascunho, restrito à organização e com inscrições fechadas.
do $$
declare
  official_event_id uuid;
begin
  insert into public.events (
    slug,
    name,
    timezone,
    status,
    starts_on,
    ends_on,
    description,
    location,
    event_type,
    scoring_mode,
    registration_source,
    access_mode,
    participant_limit,
    is_test,
    registration_open,
    registration_closes_at,
    registration_fee_cents,
    experience_fee_cents,
    asaas_checkout_expires_minutes,
    asaas_max_installments,
    premium_kit_enabled,
    premium_kit_fee_cents,
    casual_shirt_required,
    senior_discount_enabled,
    senior_discount_percent,
    regulation_version
  )
  values (
    'legends-bike-race-2027',
    '[TESTE] Legends Bike Race 2027',
    'America/Sao_Paulo',
    'draft',
    '2027-04-22',
    '2027-04-25',
    'Quatro etapas e quatro destinos em uma jornada premium de gravel pela Serra Gaúcha.',
    'Serra Gaúcha · Brasil',
    'stage_race',
    'weighted_points',
    'asaas',
    'invite',
    100,
    true,
    false,
    '2027-03-21T02:59:59Z',
    119900,
    119900,
    120,
    12,
    true,
    34900,
    true,
    true,
    50,
    '2027-v1'
  )
  on conflict (slug) do update set
    name = excluded.name,
    status = 'draft',
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    description = excluded.description,
    location = excluded.location,
    event_type = excluded.event_type,
    scoring_mode = excluded.scoring_mode,
    registration_source = excluded.registration_source,
    access_mode = 'invite',
    participant_limit = excluded.participant_limit,
    is_test = true,
    registration_open = false,
    registration_closes_at = excluded.registration_closes_at,
    registration_fee_cents = excluded.registration_fee_cents,
    experience_fee_cents = excluded.experience_fee_cents,
    asaas_checkout_expires_minutes = excluded.asaas_checkout_expires_minutes,
    asaas_max_installments = excluded.asaas_max_installments,
    premium_kit_enabled = excluded.premium_kit_enabled,
    premium_kit_fee_cents = excluded.premium_kit_fee_cents,
    casual_shirt_required = excluded.casual_shirt_required,
    senior_discount_enabled = excluded.senior_discount_enabled,
    senior_discount_percent = excluded.senior_discount_percent,
    regulation_version = excluded.regulation_version,
    updated_at = now()
  returning id into official_event_id;

  insert into public.registration_lots (
    event_id,
    name,
    starts_at,
    ends_at,
    registration_fee_cents,
    display_order
  )
  values
    (
      official_event_id,
      'Lote 01',
      '2026-08-18T03:00:00Z',
      '2026-09-21T02:59:59Z',
      119900,
      1
    ),
    (
      official_event_id,
      'Lote 02',
      '2026-09-21T03:00:00Z',
      '2026-12-11T02:59:59Z',
      139900,
      2
    ),
    (
      official_event_id,
      'Lote 03',
      '2026-12-11T03:00:00Z',
      '2027-03-21T02:59:59Z',
      159900,
      3
    )
  on conflict (event_id, display_order) do update set
    name = excluded.name,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    registration_fee_cents = excluded.registration_fee_cents,
    updated_at = now();

  insert into public.stages (
    event_id,
    stage_number,
    name,
    route_label,
    stage_date,
    distance_km,
    elevation_m,
    classification_weight
  )
  values
    (
      official_event_id,
      1,
      'Canela',
      'Canela → São Francisco de Paula',
      '2027-04-22',
      111.9,
      1684,
      1
    ),
    (
      official_event_id,
      2,
      'São Francisco de Paula',
      'São Francisco de Paula → Gramado',
      '2027-04-23',
      89.1,
      1520,
      1
    ),
    (
      official_event_id,
      3,
      'Gramado',
      'Gramado → Nova Petrópolis',
      '2027-04-24',
      99.3,
      1522,
      1
    ),
    (
      official_event_id,
      4,
      'Nova Petrópolis',
      'Nova Petrópolis → Canela',
      '2027-04-25',
      70.0,
      1576,
      1
    )
  on conflict (event_id, stage_number) do update set
    name = excluded.name,
    route_label = excluded.route_label,
    stage_date = excluded.stage_date,
    distance_km = excluded.distance_km,
    elevation_m = excluded.elevation_m,
    classification_weight = excluded.classification_weight,
    updated_at = now();
end $$;

