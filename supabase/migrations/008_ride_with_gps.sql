-- Ride with GPS replaces the conector anterior de atividades.
-- Existing activities remain intact; new imported activities use ride_with_gps.

alter type public.activity_source add value if not exists 'ride_with_gps';

alter table public.athletes
  add column if not exists ride_with_gps_user_id bigint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'athletes_ride_with_gps_user_id_key'
      and conrelid = 'public.athletes'::regclass
  ) then
    alter table public.athletes
      add constraint athletes_ride_with_gps_user_id_key unique (ride_with_gps_user_id);
  end if;
end
$$;
