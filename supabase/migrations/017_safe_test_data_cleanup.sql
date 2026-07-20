-- Legends Core
-- Migration 017: atomic, audited cleanup of operational data from test events.

create table if not exists public.test_event_cleanup_audit (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_name text not null,
  actor_reference text,
  confirmation_text text not null,
  removed_counts jsonb not null,
  preserved_counts jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists test_event_cleanup_audit_event_idx
  on public.test_event_cleanup_audit(event_id, created_at desc);

alter table public.test_event_cleanup_audit enable row level security;
grant all privileges on table public.test_event_cleanup_audit to service_role;

create or replace function public.preview_test_event_cleanup(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_removed jsonb;
  v_preserved jsonb;
begin
  select * into v_event from public.events where id = p_event_id;

  if not found then
    raise exception 'Evento não encontrado.' using errcode = 'P0002';
  end if;
  if v_event.is_test is not true then
    raise exception 'A limpeza só pode ser executada em eventos marcados como teste.' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'registrations', (select count(*) from public.registrations where event_id = p_event_id),
    'linked_registrations', (select count(*) from public.registrations where event_id = p_event_id and athlete_id is not null),
    'activities', (select count(*) from public.activities where stage_id in (select id from public.stages where event_id = p_event_id)),
    'validation_results', (select count(*) from public.validation_results where stage_id in (select id from public.stages where event_id = p_event_id)),
    'checkpoint_passages', (
      select count(*) from public.checkpoint_passages
      where activity_id in (
        select id from public.activities where stage_id in (select id from public.stages where event_id = p_event_id)
      )
    ),
    'segment_results', (
      select count(*) from public.segment_results
      where activity_id in (
        select id from public.activities where stage_id in (select id from public.stages where event_id = p_event_id)
      )
    ),
    'stage_results', (select count(*) from public.stage_results where event_id = p_event_id),
    'decision_history', (select count(*) from public.stage_result_audit_log where event_id = p_event_id),
    'identity_history', (select count(*) from public.registration_link_audit where event_id = p_event_id)
  ) into v_removed;

  select jsonb_build_object(
    'events', 1,
    'stages', (select count(*) from public.stages where event_id = p_event_id),
    'routes', (select count(*) from public.routes where stage_id in (select id from public.stages where event_id = p_event_id)),
    'checkpoints', (select count(*) from public.checkpoints where stage_id in (select id from public.stages where event_id = p_event_id)),
    'timed_segments', (select count(*) from public.timed_segments where stage_id in (select id from public.stages where event_id = p_event_id)),
    'bib_sequences', (select count(*) from public.event_category_bib_sequences where event_id = p_event_id),
    'athlete_accounts', (select count(distinct athlete_id) from public.registrations where event_id = p_event_id and athlete_id is not null)
  ) into v_preserved;

  return jsonb_build_object(
    'event_id', v_event.id,
    'event_name', v_event.name,
    'required_confirmation', 'LIMPAR ' || v_event.name,
    'removed', v_removed,
    'preserved', v_preserved,
    'will_close_registrations', true,
    'will_return_to_draft', true
  );
end;
$$;

create or replace function public.cleanup_test_event_data(
  p_event_id uuid,
  p_confirmation text,
  p_actor_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_preview jsonb;
  v_required_confirmation text;
begin
  -- The row lock serializes cleanup with event configuration changes.
  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Evento não encontrado.' using errcode = 'P0002';
  end if;
  if v_event.is_test is not true then
    raise exception 'A limpeza só pode ser executada em eventos marcados como teste.' using errcode = 'P0001';
  end if;

  v_required_confirmation := 'LIMPAR ' || v_event.name;
  if p_confirmation is distinct from v_required_confirmation then
    raise exception 'A confirmação digitada não corresponde ao nome do evento.' using errcode = '22023';
  end if;

  v_preview := public.preview_test_event_cleanup(p_event_id);

  -- Stop new entries before removing operational data.
  update public.events
  set status = 'draft', registration_open = false, updated_at = now()
  where id = p_event_id;

  -- Delete explicit history/results first; activity children also use cascades,
  -- but explicit deletion makes the operation and its audit totals deterministic.
  delete from public.stage_result_audit_log where event_id = p_event_id;
  delete from public.stage_results where event_id = p_event_id;
  delete from public.validation_results
    where stage_id in (select id from public.stages where event_id = p_event_id);
  delete from public.segment_results
    where activity_id in (
      select id from public.activities where stage_id in (select id from public.stages where event_id = p_event_id)
    );
  delete from public.checkpoint_passages
    where activity_id in (
      select id from public.activities where stage_id in (select id from public.stages where event_id = p_event_id)
    );
  delete from public.activities
    where stage_id in (select id from public.stages where event_id = p_event_id);
  delete from public.registration_link_audit where event_id = p_event_id;
  delete from public.registrations where event_id = p_event_id;

  update public.stages
  set results_published = false,
      results_locked = false,
      results_published_at = null,
      updated_at = now()
  where event_id = p_event_id;

  update public.event_category_bib_sequences
  set next_number = start_number, updated_at = now()
  where event_id = p_event_id;

  insert into public.test_event_cleanup_audit (
    event_id, event_name, actor_reference, confirmation_text,
    removed_counts, preserved_counts
  ) values (
    p_event_id, v_event.name, nullif(btrim(p_actor_reference), ''), p_confirmation,
    v_preview -> 'removed', v_preview -> 'preserved'
  );

  return v_preview || jsonb_build_object('cleaned_at', now());
end;
$$;

revoke all on function public.preview_test_event_cleanup(uuid) from public, anon, authenticated;
revoke all on function public.cleanup_test_event_data(uuid, text, text) from public, anon, authenticated;
grant execute on function public.preview_test_event_cleanup(uuid) to service_role;
grant execute on function public.cleanup_test_event_data(uuid, text, text) to service_role;
