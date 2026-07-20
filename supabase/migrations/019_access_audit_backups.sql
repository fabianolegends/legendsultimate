-- Legends Core
-- Migration 019: individual operators, role-based access, immutable audit and backup registry.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  role text not null default 'viewer',
  password_hash text not null,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_email_normalized check (email = lower(btrim(email))),
  constraint admin_users_role_check check (role in ('owner', 'director', 'steward', 'viewer')),
  unique (email)
);

create table if not exists public.admin_operation_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.admin_users(id) on delete set null,
  actor_email text not null,
  actor_role text not null,
  action text not null,
  resource_type text not null,
  resource_id text,
  event_id uuid references public.events(id) on delete set null,
  request_id uuid not null default gen_random_uuid(),
  ip_hash text,
  user_agent text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_operation_audit_created_idx
  on public.admin_operation_audit(created_at desc);
create index if not exists admin_operation_audit_actor_idx
  on public.admin_operation_audit(actor_user_id, created_at desc);
create index if not exists admin_operation_audit_event_idx
  on public.admin_operation_audit(event_id, created_at desc);

create table if not exists public.backup_exports (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.admin_users(id) on delete set null,
  actor_email text not null,
  scope text not null check (scope in ('full', 'event')),
  event_id uuid references public.events(id) on delete set null,
  row_counts jsonb not null,
  checksum_sha256 text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.admin_operation_audit enable row level security;
alter table public.backup_exports enable row level security;

grant all privileges on table public.admin_users to service_role;
grant all privileges on table public.admin_operation_audit to service_role;
grant all privileges on table public.backup_exports to service_role;
grant usage, select on sequence public.admin_operation_audit_id_seq to service_role;

-- Audit history must be append-only, even for the server role used by the app.
create or replace function public.prevent_admin_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'A trilha de auditoria é imutável.' using errcode = '42501';
end;
$$;

drop trigger if exists admin_operation_audit_immutable on public.admin_operation_audit;
create trigger admin_operation_audit_immutable
before update or delete on public.admin_operation_audit
for each row execute function public.prevent_admin_audit_mutation();

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.admin_operation_audit from anon, authenticated;
revoke all on table public.backup_exports from anon, authenticated;

-- Database fallback: every mutation on competition-critical data is captured.
-- Application routes add a second, named entry for the most sensitive decisions.
create or replace function public.audit_critical_table_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_event_id uuid;
begin
  begin
    v_event_id := nullif(v_row ->> 'event_id', '')::uuid;
  exception when others then
    v_event_id := null;
  end;
  -- During cascaded deletion the parent event may already be unavailable for FK validation.
  if tg_op = 'DELETE' then v_event_id := null; end if;
  insert into public.admin_operation_audit (
    actor_email, actor_role, action, resource_type, resource_id, event_id, details
  ) values (
    'database-trigger', 'system', lower(tg_op), tg_table_name, v_row ->> 'id', v_event_id,
    jsonb_build_object('source', 'database', 'operation', tg_op)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array['events','stages','routes','checkpoints','registrations','activities','validation_results','stage_results']
  loop
    execute format('drop trigger if exists audit_%I_changes on public.%I', v_table, v_table);
    execute format('create trigger audit_%I_changes after insert or update or delete on public.%I for each row execute function public.audit_critical_table_change()', v_table, v_table);
  end loop;
end $$;
