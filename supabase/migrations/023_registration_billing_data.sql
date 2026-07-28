-- Legends Core
-- Migration 023: dados fiscais e de endereço necessários para a inscrição e checkout Asaas.

alter table public.registrations
  add column if not exists cpf_cnpj text,
  add column if not exists postal_code text,
  add column if not exists address text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists province text;

alter table public.registrations
  drop constraint if exists registrations_cpf_cnpj_check;

alter table public.registrations
  add constraint registrations_cpf_cnpj_check
  check (cpf_cnpj is null or cpf_cnpj ~ '^([0-9]{11}|[0-9]{14})$');

alter table public.registrations
  drop constraint if exists registrations_postal_code_check;

alter table public.registrations
  add constraint registrations_postal_code_check
  check (postal_code is null or postal_code ~ '^[0-9]{8}$');

grant all privileges on table public.registrations to service_role;
