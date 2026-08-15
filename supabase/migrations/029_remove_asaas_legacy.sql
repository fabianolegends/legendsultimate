-- Legends Core
-- Migration 029: remoção definitiva do checkout descontinuado.
--
-- Esta migration é intencionalmente destrutiva: inscrições criadas pelo fluxo
-- público antigo, eventos de webhook e metadados exclusivos do provedor são
-- apagados. A Windfit passa a ser a única origem comercial aceita.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registrations'
      and column_name = 'payment_provider'
  ) then
    execute $delete_old_registrations$
      delete from public.registrations
      where source = 'online'
         or payment_provider is not null
    $delete_old_registrations$;
  else
    delete from public.registrations where source = 'online';
  end if;
end
$$;

-- Normaliza qualquer status financeiro residual antes de restaurar o domínio
-- reduzido usado pela importação Windfit.
update public.registrations
set
  payment_status = case
    when payment_status in ('failed', 'chargeback') then 'cancelled'
    when payment_status = 'risk_analysis' then 'pending'
    else payment_status
  end,
  status = case
    when payment_status in ('failed', 'chargeback') then 'cancelled'
    else status
  end,
  updated_at = now()
where payment_status in ('failed', 'chargeback', 'risk_analysis');

-- Impede que eventos antigos reativem o formulário público removido. Eventos
-- oficiais usam a Windfit; eventos internos de simulação permanecem manuais.
update public.events
set
  registration_source = case when is_test then 'manual' else 'windfit' end,
  updated_at = now()
where registration_source is distinct from
  case when is_test then 'manual' else 'windfit' end;

alter table public.events
  drop constraint if exists events_registration_source_check;

alter table public.events
  add constraint events_registration_source_check
  check (
    (is_test and registration_source = 'manual')
    or (not is_test and registration_source = 'windfit')
  );

drop trigger if exists registrations_public_capacity_guard
  on public.registrations;
drop function if exists public.enforce_public_event_registration();

drop table if exists public.payment_webhook_events cascade;

drop index if exists public.registrations_payment_checkout_id_unique;
drop index if exists public.registrations_payment_provider_idx;
drop index if exists public.registrations_payment_expires_at_idx;

alter table public.events
  drop constraint if exists events_asaas_checkout_expires_minutes_check,
  drop constraint if exists events_asaas_max_installments_check,
  drop column if exists asaas_checkout_expires_minutes,
  drop column if exists asaas_max_installments;

alter table public.registrations
  drop constraint if exists registrations_payment_provider_check,
  drop constraint if exists registrations_payment_amount_cents_check,
  drop constraint if exists registrations_payment_status_check,
  drop constraint if exists registrations_source_check,
  drop column if exists payment_provider,
  drop column if exists payment_amount_cents,
  drop column if exists payment_checkout_id,
  drop column if exists payment_checkout_url,
  drop column if exists payment_checkout_status,
  drop column if exists payment_expires_at,
  drop column if exists payment_confirmed_at,
  drop column if exists payment_refunded_at,
  drop column if exists last_payment_event_at;

alter table public.registrations
  add constraint registrations_source_check
  check (source in ('windfit', 'manual')),
  add constraint registrations_payment_status_check
  check (payment_status in (
    'paid',
    'pending',
    'refunded',
    'cancelled',
    'courtesy'
  ));

comment on column public.registrations.source is
  'Origem operacional da inscrição: Windfit ou lançamento manual administrativo.';
comment on column public.registrations.payment_status is
  'Situação de pagamento informada pela Windfit ou definida em exceção manual.';
