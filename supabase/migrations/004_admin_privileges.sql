-- Legends Core
-- Migration 004: grant the server-side Supabase role access to the admin schema.
-- RLS remains enabled for browser roles; the service_role is used only by server routes.

grant usage on schema public to service_role;

grant all privileges on table public.events to service_role;
grant all privileges on table public.stages to service_role;
grant all privileges on table public.routes to service_role;
grant all privileges on table public.route_versions to service_role;
grant all privileges on table public.route_change_log to service_role;
grant all privileges on table public.checkpoints to service_role;
grant all privileges on table public.athletes to service_role;
grant all privileges on table public.activities to service_role;
grant all privileges on table public.validation_results to service_role;

grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
grant all privileges on tables to service_role;

alter default privileges in schema public
grant usage, select on sequences to service_role;

-- Storage operations performed by the server-side client.
grant usage on schema storage to service_role;
grant all privileges on table storage.objects to service_role;
grant all privileges on table storage.buckets to service_role;
