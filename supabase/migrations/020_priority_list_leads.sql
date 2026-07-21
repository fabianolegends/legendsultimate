-- Lista prioritária capturada no site público.
-- A tabela não é exposta diretamente: leitura e escrita passam pelas APIs do servidor.

create extension if not exists pgcrypto;

create table if not exists public.priority_list_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 3 and 120),
  email text not null,
  email_normalized text not null,
  city text not null check (char_length(btrim(city)) between 2 and 120),
  phone text not null check (char_length(btrim(phone)) between 8 and 30),
  expectations text not null check (char_length(btrim(expectations)) between 10 and 1000),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'archived')),
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists priority_list_leads_email_unique
  on public.priority_list_leads (email_normalized);

create index if not exists priority_list_leads_created_at_idx
  on public.priority_list_leads (created_at desc);

create index if not exists priority_list_leads_status_idx
  on public.priority_list_leads (status);

alter table public.priority_list_leads enable row level security;

revoke all on table public.priority_list_leads from anon, authenticated;
grant all privileges on table public.priority_list_leads to service_role;
