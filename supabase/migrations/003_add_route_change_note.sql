alter table public.route_versions
  add column if not exists change_note text;
