-- Legends Core: certificados pós-evento com arte-base administrável.

alter table public.events
  add column if not exists certificate_enabled boolean not null default false,
  add column if not exists certificate_template_path text,
  add column if not exists certificate_text_color text not null default '#171a16';

alter table public.events
  drop constraint if exists events_certificate_text_color_check,
  add constraint events_certificate_text_color_check
    check (certificate_text_color ~ '^#[0-9A-Fa-f]{6}$');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificate-templates',
  'certificate-templates',
  true,
  10485760,
  array['image/png']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
