-- Legends Core: athlete identity integrity for Ride with GPS links.

create table if not exists public.registration_link_audit (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  previous_athlete_id uuid references public.athletes(id) on delete set null,
  athlete_id uuid references public.athletes(id) on delete set null,
  ride_with_gps_user_id bigint,
  action text not null check (action in ('linked', 'unlinked', 'transferred_in', 'transferred_out', 'migration_unlinked')),
  actor_type text not null default 'system' check (actor_type in ('athlete', 'admin', 'system')),
  actor_reference text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists registration_link_audit_event_idx
  on public.registration_link_audit(event_id, created_at desc);
create index if not exists registration_link_audit_registration_idx
  on public.registration_link_audit(registration_id, created_at desc);

alter table public.registration_link_audit enable row level security;
grant all privileges on table public.registration_link_audit to service_role;

-- Preserve the oldest active link and release legacy duplicates before adding
-- the database-level invariant. Every released link remains in the audit log.
with ranked as (
  select
    r.id,
    r.event_id,
    r.athlete_id,
    row_number() over (
      partition by r.event_id, r.athlete_id
      order by r.claimed_at asc nulls last, r.created_at asc, r.id asc
    ) as position
  from public.registrations r
  where r.athlete_id is not null
    and r.status <> 'cancelled'
), duplicates as (
  select * from ranked where position > 1
), logged as (
  insert into public.registration_link_audit (
    event_id, registration_id, previous_athlete_id, athlete_id,
    ride_with_gps_user_id, action, actor_type, reason
  )
  select
    d.event_id, d.id, d.athlete_id, null,
    a.ride_with_gps_user_id, 'migration_unlinked', 'system',
    'Vínculo legado duplicado no mesmo evento'
  from duplicates d
  left join public.athletes a on a.id = d.athlete_id
  returning registration_id
)
update public.registrations r
set athlete_id = null, claimed_at = null, updated_at = now()
where r.id in (select registration_id from logged);

create unique index if not exists registrations_one_active_identity_per_event_idx
  on public.registrations(event_id, athlete_id)
  where athlete_id is not null and status <> 'cancelled';

create or replace function public.link_registration_identity(
  p_registration_id uuid,
  p_athlete_id uuid,
  p_ride_with_gps_user_id bigint,
  p_actor_type text default 'athlete',
  p_actor_reference text default null,
  p_reason text default null
)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.registrations;
  v_previous_athlete_id uuid;
  v_current_ride_id bigint;
  v_target_ride_id bigint;
begin
  if p_actor_type not in ('athlete', 'admin', 'system') then
    raise exception 'Tipo de responsável inválido.' using errcode = '22023';
  end if;

  select * into v_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'Inscrição não encontrada.' using errcode = 'P0002';
  end if;
  if v_registration.status = 'cancelled' then
    raise exception 'Uma inscrição cancelada não pode ser vinculada.' using errcode = 'P0001';
  end if;

  select ride_with_gps_user_id into v_target_ride_id
  from public.athletes
  where id = p_athlete_id
  for update;

  if not found or v_target_ride_id is distinct from p_ride_with_gps_user_id then
    raise exception 'A identidade Ride with GPS não corresponde ao atleta informado.' using errcode = 'P0001';
  end if;

  if v_registration.athlete_id is not null then
    select ride_with_gps_user_id into v_current_ride_id
    from public.athletes
    where id = v_registration.athlete_id;
    if v_current_ride_id is not null and v_current_ride_id <> p_ride_with_gps_user_id then
      raise exception 'Esta inscrição já está vinculada a outra conta Ride with GPS.' using errcode = 'P0001';
    end if;
  end if;

  if exists (
    select 1
    from public.registrations r
    where r.event_id = v_registration.event_id
      and r.athlete_id = p_athlete_id
      and r.id <> v_registration.id
      and r.status <> 'cancelled'
  ) then
    raise exception 'Esta conta Ride with GPS já representa outra inscrição ativa neste evento.' using errcode = 'P0001';
  end if;

  v_previous_athlete_id := v_registration.athlete_id;
  update public.registrations
  set athlete_id = p_athlete_id, claimed_at = coalesce(claimed_at, now()), updated_at = now()
  where id = v_registration.id
  returning * into v_registration;

  update public.activities
  set athlete_id = p_athlete_id
  where raw_payload ->> 'registration_id' = p_registration_id::text
    and athlete_id is distinct from p_athlete_id;

  update public.stage_results
  set athlete_id = p_athlete_id, updated_at = now()
  where registration_id = p_registration_id
    and athlete_id is distinct from p_athlete_id;

  insert into public.registration_link_audit (
    event_id, registration_id, previous_athlete_id, athlete_id,
    ride_with_gps_user_id, action, actor_type, actor_reference, reason
  ) values (
    v_registration.event_id, v_registration.id,
    v_previous_athlete_id,
    p_athlete_id, p_ride_with_gps_user_id, 'linked', p_actor_type,
    p_actor_reference, p_reason
  );

  return v_registration;
end;
$$;

create or replace function public.unlink_registration_identity(
  p_registration_id uuid,
  p_actor_type text default 'admin',
  p_actor_reference text default null,
  p_reason text default null
)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.registrations;
  v_previous_athlete_id uuid;
  v_ride_user_id bigint;
begin
  select * into v_registration
  from public.registrations
  where id = p_registration_id
  for update;
  if not found then
    raise exception 'Inscrição não encontrada.' using errcode = 'P0002';
  end if;

  v_previous_athlete_id := v_registration.athlete_id;
  if v_previous_athlete_id is null then return v_registration; end if;
  select ride_with_gps_user_id into v_ride_user_id from public.athletes where id = v_previous_athlete_id;

  update public.registrations
  set athlete_id = null, claimed_at = null, updated_at = now()
  where id = p_registration_id
  returning * into v_registration;

  insert into public.registration_link_audit (
    event_id, registration_id, previous_athlete_id, athlete_id,
    ride_with_gps_user_id, action, actor_type, actor_reference, reason
  ) values (
    v_registration.event_id, v_registration.id, v_previous_athlete_id, null,
    v_ride_user_id, 'unlinked', p_actor_type, p_actor_reference, p_reason
  );
  return v_registration;
end;
$$;

create or replace function public.transfer_registration_identity(
  p_from_registration_id uuid,
  p_to_registration_id uuid,
  p_actor_reference text default null,
  p_reason text default 'Correção administrativa de vínculo'
)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from public.registrations;
  v_to public.registrations;
  v_athlete_id uuid;
  v_ride_user_id bigint;
begin
  if p_from_registration_id = p_to_registration_id then
    raise exception 'Selecione duas inscrições diferentes.' using errcode = '22023';
  end if;

  select * into v_from from public.registrations where id = p_from_registration_id for update;
  select * into v_to from public.registrations where id = p_to_registration_id for update;
  if v_from.id is null or v_to.id is null then
    raise exception 'Inscrição de origem ou destino não encontrada.' using errcode = 'P0002';
  end if;
  if v_from.event_id <> v_to.event_id then
    raise exception 'A transferência só pode ocorrer dentro do mesmo evento.' using errcode = 'P0001';
  end if;
  if v_from.athlete_id is null then
    raise exception 'A inscrição de origem não possui conta vinculada.' using errcode = 'P0001';
  end if;
  if v_to.athlete_id is not null then
    raise exception 'A inscrição de destino já possui uma conta vinculada.' using errcode = 'P0001';
  end if;

  v_athlete_id := v_from.athlete_id;
  select ride_with_gps_user_id into v_ride_user_id from public.athletes where id = v_athlete_id;
  if v_ride_user_id is null then
    raise exception 'A origem não possui uma identidade Ride with GPS válida.' using errcode = 'P0001';
  end if;

  update public.registrations set athlete_id = null, claimed_at = null, updated_at = now() where id = v_from.id;
  update public.registrations set athlete_id = v_athlete_id, claimed_at = now(), updated_at = now() where id = v_to.id returning * into v_to;

  update public.activities
  set raw_payload = jsonb_set(coalesce(raw_payload, '{}'::jsonb), '{registration_id}', to_jsonb(v_to.id::text), true)
  where raw_payload ->> 'registration_id' = v_from.id::text
    and athlete_id = v_athlete_id;
  update public.stage_results set registration_id = v_to.id, updated_at = now()
  where registration_id = v_from.id and athlete_id = v_athlete_id;

  insert into public.registration_link_audit (event_id, registration_id, previous_athlete_id, athlete_id, ride_with_gps_user_id, action, actor_type, actor_reference, reason)
  values (v_from.event_id, v_from.id, v_athlete_id, null, v_ride_user_id, 'transferred_out', 'admin', p_actor_reference, p_reason);
  insert into public.registration_link_audit (event_id, registration_id, previous_athlete_id, athlete_id, ride_with_gps_user_id, action, actor_type, actor_reference, reason)
  values (v_to.event_id, v_to.id, null, v_athlete_id, v_ride_user_id, 'transferred_in', 'admin', p_actor_reference, p_reason);
  return v_to;
end;
$$;

-- Existing duplicate test activities remain available for the current test
-- environment, but future attempts to reuse one track for two athletes in the
-- same stage are blocked at write time.
create or replace function public.prevent_duplicate_stage_track()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.stage_id is not null and new.track_fingerprint is not null and exists (
    select 1 from public.activities a
    where a.stage_id = new.stage_id
      and a.track_fingerprint = new.track_fingerprint
      and a.athlete_id is distinct from new.athlete_id
      and a.id is distinct from new.id
  ) then
    raise exception 'Esta atividade já foi utilizada por outro atleta nesta etapa.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists activities_prevent_duplicate_stage_track on public.activities;
create trigger activities_prevent_duplicate_stage_track
before insert or update of stage_id, athlete_id, track_fingerprint on public.activities
for each row execute function public.prevent_duplicate_stage_track();

revoke all on function public.link_registration_identity(uuid, uuid, bigint, text, text, text) from public, anon, authenticated;
revoke all on function public.unlink_registration_identity(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.transfer_registration_identity(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.link_registration_identity(uuid, uuid, bigint, text, text, text) to service_role;
grant execute on function public.unlink_registration_identity(uuid, text, text, text) to service_role;
grant execute on function public.transfer_registration_identity(uuid, uuid, text, text) to service_role;
