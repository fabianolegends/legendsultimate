create table if not exists public.health_declarations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  athlete_number text not null,
  full_name text not null,
  email text not null,
  birth_date date,
  blood_type text,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  answers jsonb not null default '{}'::jsonb,
  medications text,
  allergies text,
  health_notes text,
  consent_accepted_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, registration_id)
);

create index if not exists health_declarations_event_idx on public.health_declarations(event_id);
create index if not exists health_declarations_registration_idx on public.health_declarations(registration_id);

alter table public.health_declarations enable row level security;

-- Dados de saúde são sensíveis: nenhuma política pública é criada.
-- Leitura e escrita ocorrem somente pelas rotas server-side com service role,
-- após validação da inscrição ou autenticação administrativa.
