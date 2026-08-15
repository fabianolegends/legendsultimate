-- Legends Core
-- Migration 028: Windfit como fonte exclusiva das inscrições comerciais.
--
-- A remoção definitiva do provedor anterior e de seus dados ocorre na migration 029.

update public.events
set
  registration_source = case when is_test then 'manual' else 'windfit' end,
  registration_open = case
    when not is_test
      and (
        windfit_registration_url is null
        or btrim(windfit_registration_url) not like 'https://%'
      )
      then false
    else registration_open
  end,
  updated_at = now()
where registration_source in ('asaas', 'mixed')
   or (is_test and registration_source <> 'manual')
   or (not is_test and registration_source <> 'windfit')
   or (
     not is_test
     and registration_open
     and (
       windfit_registration_url is null
       or btrim(windfit_registration_url) not like 'https://%'
     )
   );

alter table public.events
  drop constraint if exists events_registration_source_check;

alter table public.events
  add constraint events_registration_source_check
  check (
    (is_test and registration_source = 'manual')
    or (not is_test and registration_source = 'windfit')
  );

alter table public.events
  drop constraint if exists events_open_windfit_url_check;

alter table public.events
  add constraint events_open_windfit_url_check
  check (
    not registration_open
    or is_test
    or (
      registration_source = 'windfit'
      and windfit_registration_url is not null
      and btrim(windfit_registration_url) like 'https://%'
    )
  );
