-- Legends Core
-- Migration 031: acesso simplificado e fotos para os cards dos atletas.

alter table public.registrations
  add column if not exists document_number text;

update public.registrations
set document_number = cpf_cnpj
where document_number is null and cpf_cnpj is not null;

create index if not exists registrations_email_lower_idx
  on public.registrations (lower(email));

create table if not exists public.athlete_card_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  face_photo_path text not null,
  cycling_photo_path text not null,
  face_photo_name text not null,
  cycling_photo_name text not null,
  consent_accepted_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'card_created')),
  admin_notes text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id)
);

create index if not exists athlete_card_photos_event_status_idx
  on public.athlete_card_photos(event_id, status, updated_at desc);

create table if not exists public.athlete_media_login_attempts (
  key_hash text primary key,
  failure_count integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.athlete_card_photos enable row level security;
alter table public.athlete_media_login_attempts enable row level security;

grant all privileges on table public.athlete_card_photos to service_role;
grant all privileges on table public.athlete_media_login_attempts to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'athlete-card-photos',
  'athlete-card-photos',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on column public.registrations.document_number is
  'Documento original importado da plataforma de inscrições; usado também para acesso controlado à área do atleta.';

comment on table public.athlete_card_photos is
  'Fotos privadas enviadas pelos inscritos para produção dos cards individuais.';
