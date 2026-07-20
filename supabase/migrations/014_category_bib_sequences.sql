-- Legends Core
-- Migration 014: independent, concurrency-safe bib sequences per event/category.

create table if not exists public.event_category_bib_sequences (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null,
  start_number integer not null check (start_number > 0),
  next_number integer not null check (next_number > 0),
  padding integer not null default 3 check (padding between 1 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, category)
);

create index if not exists event_category_bib_sequences_event_idx
  on public.event_category_bib_sequences(event_id, category);

alter table public.event_category_bib_sequences enable row level security;
grant all privileges on table public.event_category_bib_sequences to service_role;

create or replace function public.assign_registration_bib_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sequence_row public.event_category_bib_sequences%rowtype;
  candidate integer;
  candidate_text text;
begin
  -- Explicit organizer numbers are respected.
  if nullif(btrim(new.bib_number), '') is not null then
    return new;
  end if;

  -- Windfit reimports and ordinary edits must preserve the number already assigned.
  if tg_op = 'UPDATE'
     and nullif(btrim(old.bib_number), '') is not null
     and old.category is not distinct from new.category then
    new.bib_number := old.bib_number;
    return new;
  end if;

  if nullif(btrim(new.category), '') is null then
    return new;
  end if;

  select * into sequence_row
  from public.event_category_bib_sequences
  where event_id = new.event_id and category = new.category
  for update;

  -- The organizer may configure the category after registrations already exist.
  if not found then
    return new;
  end if;

  candidate := greatest(sequence_row.next_number, sequence_row.start_number);
  loop
    candidate_text := lpad(candidate::text, sequence_row.padding, '0');
    exit when not exists (
      select 1 from public.registrations
      where event_id = new.event_id
        and bib_number = candidate_text
        and id is distinct from new.id
    );
    candidate := candidate + 1;
  end loop;

  new.bib_number := candidate_text;
  update public.event_category_bib_sequences
  set next_number = candidate + 1, updated_at = now()
  where id = sequence_row.id;
  return new;
end;
$$;

drop trigger if exists registrations_assign_category_bib on public.registrations;
create trigger registrations_assign_category_bib
before insert or update of event_id, category, bib_number on public.registrations
for each row execute function public.assign_registration_bib_number();

create or replace function public.configure_event_category_bib_sequence(
  p_event_id uuid,
  p_category text,
  p_start_number integer,
  p_padding integer default 3
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_count integer := 0;
  normalized_category text := btrim(p_category);
begin
  if normalized_category = '' or p_start_number < 1 or p_padding < 1 or p_padding > 8 then
    raise exception 'Categoria, primeiro número e quantidade de dígitos são inválidos.';
  end if;

  insert into public.event_category_bib_sequences (
    event_id, category, start_number, next_number, padding
  ) values (
    p_event_id, normalized_category, p_start_number, p_start_number, p_padding
  )
  on conflict (event_id, category) do update set
    start_number = excluded.start_number,
    next_number = greatest(public.event_category_bib_sequences.next_number, excluded.start_number),
    padding = excluded.padding,
    updated_at = now();

  -- Each row update invokes the trigger and consumes the next number under lock.
  update public.registrations
  set bib_number = null, updated_at = now()
  where event_id = p_event_id
    and category = normalized_category
    and nullif(btrim(bib_number), '') is null;
  get diagnostics assigned_count = row_count;

  return assigned_count;
end;
$$;

grant execute on function public.configure_event_category_bib_sequence(uuid, text, integer, integer) to service_role;

